#!/usr/bin/env node

/**
 * Backfill `description_zh` for A-tier MCP servers using LLM translation.
 * Translates English descriptions into natural Chinese (30-100 chars).
 *
 * Usage:
 *   node scripts/backfill-mcp-description-zh.mjs              # Dry run (default)
 *   node scripts/backfill-mcp-description-zh.mjs --apply       # Live update
 *   node scripts/backfill-mcp-description-zh.mjs --limit 20    # Process first N servers
 *   node scripts/backfill-mcp-description-zh.mjs --tier B --apply  # Process B-tier
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { callLLM, getProviderInfo } from "./lib/llm.mjs";

const log = createLogger("backfill-desc-zh");

const BATCH_SIZE = 10;
const RATE_LIMIT_MS = 300;
const PAGE_SIZE = 1000;

const SYSTEM_PROMPT = `Translate tool descriptions into natural Chinese (30-100 chars). Return JSON: {"items": [{"name": "original", "descriptionZh": "中文描述"}]}`;

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
const tierIdx = args.indexOf("--tier");
const TIER_FILTER = tierIdx !== -1 ? args[tierIdx + 1].toUpperCase() : "A";

// ── Helpers ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJsonResponse(text) {
  const jsonStr = text
    .replace(/^```json\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  return JSON.parse(jsonStr);
}

// ── DB helpers ──────────────────────────────────────────────────────

async function fetchMcpServersMissingDescZh(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("slug, name, description")
      .eq("quality_tier", TIER_FILTER)
      .eq("status", "published")
      .is("description_zh", null)
      .not("description", "is", null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`DB read mcp_servers: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();
  const provider = getProviderInfo();
  const stats = { total: 0, updated: 0, skipped: 0, errors: 0 };

  log.info(`Backfill MCP description_zh -- ${new Date().toISOString()}`);
  log.info(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Limit: ${LIMIT === Infinity ? "none" : LIMIT}`);
  log.info(`LLM provider: ${provider.name} (${provider.model})`);

  // ── Step 1: Fetch A-tier MCP servers missing description_zh ────

  log.info(`Fetching ${TIER_FILTER}-tier MCP servers where description_zh IS NULL...`);
  let servers = await fetchMcpServersMissingDescZh(supabase);
  log.info(`Found ${servers.length} servers needing description_zh`);

  if (LIMIT !== Infinity) {
    servers = servers.slice(0, LIMIT);
    log.info(`Limited to ${servers.length} servers`);
  }

  if (servers.length === 0) {
    log.info("No servers to process. Exiting.");
    log.done();
    return;
  }

  stats.total = servers.length;

  // ── Step 2: Process in batches of 10 ──────────────────────────

  for (let i = 0; i < servers.length; i += BATCH_SIZE) {
    const batch = servers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    if (i > 0 && i % 50 === 0) {
      log.info(`Progress: ${i}/${servers.length} processed, ${stats.updated} updated, ${stats.errors} errors`);
    }

    const userPrompt = `Translate these tool descriptions into natural Chinese (30-100 chars each). Keep technical terms in English where appropriate.\n\n${batch.map((s) => `- name: "${s.name || s.slug}", description: "${(s.description || "").slice(0, 300)}"`).join("\n")}`;

    try {
      const text = await callLLM(SYSTEM_PROMPT, userPrompt, 4096);
      const parsed = parseJsonResponse(text);

      if (!parsed.items || !Array.isArray(parsed.items)) {
        log.warn(`  Batch ${batchNum}: unexpected response structure, skipping`);
        stats.skipped += batch.length;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Build a map from original name to Chinese description
      const descMap = new Map();
      for (const item of parsed.items) {
        if (item.name && item.descriptionZh) {
          descMap.set(item.name, item.descriptionZh);
        }
      }

      for (const server of batch) {
        const key = server.name || server.slug;
        const descZh = descMap.get(key);
        if (!descZh) {
          log.warn(`  No translation for "${key}", skipping`);
          stats.skipped++;
          continue;
        }

        if (DRY_RUN) {
          log.info(`  [dry-run] ${server.slug} -> ${descZh}`);
        } else {
          const { error } = await supabase
            .from("mcp_servers")
            .update({ description_zh: descZh })
            .eq("slug", server.slug);

          if (error) {
            log.error(`  Failed to update ${server.slug}: ${error.message}`);
            stats.errors++;
            continue;
          }
        }

        stats.updated++;
      }
    } catch (err) {
      log.error(`  Batch ${batchNum} LLM error: ${err.message}`);
      stats.errors += batch.length;
    }

    await sleep(RATE_LIMIT_MS);
  }

  // ── Summary ──────────────────────────────────────────────────────

  const mode = DRY_RUN ? "[DRY RUN] " : "";
  const summaryLines = [
    `\n${mode}Backfill MCP description_zh Summary:`,
    `  Total: ${stats.total}`,
    `  Updated: ${stats.updated}`,
    `  Skipped: ${stats.skipped}`,
    `  Errors: ${stats.errors}`,
  ];

  log.summary(summaryLines.join("\n"));
  log.setOutput("updated", stats.updated);
  log.setOutput("errors", stats.errors);
  log.done();

  if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
