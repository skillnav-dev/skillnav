#!/usr/bin/env node

/**
 * Backfill `name_zh` for skills using LLM translation.
 * Sends skill name + description in batches of 10, gets concise Chinese names back.
 *
 * Usage:
 *   node scripts/backfill-skills-name-zh.mjs              # Dry run (default)
 *   node scripts/backfill-skills-name-zh.mjs --apply       # Live update
 *   node scripts/backfill-skills-name-zh.mjs --limit 20    # Process first N skills
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { callLLM, getProviderInfo } from "./lib/llm.mjs";

const log = createLogger("backfill-name-zh");

const BATCH_SIZE = 10;
const RATE_LIMIT_MS = 300;
const PAGE_SIZE = 1000;

const SYSTEM_PROMPT = `You are a Chinese tech translator. Translate tool names into natural, concise Chinese (2-8 chars). Return JSON: {"items": [{"name": "original", "nameZh": "中文名"}]}`;

// ── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

// ── Helpers ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Parse LLM JSON response, stripping markdown fences if present.
 */
function parseJsonResponse(text) {
  const jsonStr = text
    .replace(/^```json\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  return JSON.parse(jsonStr);
}

// ── DB helpers ──────────────────────────────────────────────────────

async function fetchSkillsMissingNameZh(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("skills")
      .select("slug, name, description")
      .eq("status", "published")
      .is("name_zh", null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`DB read skills: ${error.message}`);
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

  log.info(`Backfill Skills name_zh -- ${new Date().toISOString()}`);
  log.info(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Limit: ${LIMIT === Infinity ? "none" : LIMIT}`);
  log.info(`LLM provider: ${provider.name} (${provider.model})`);

  // ── Step 1: Fetch skills missing name_zh ────────────────────────

  log.info("Fetching published skills where name_zh IS NULL...");
  let skills = await fetchSkillsMissingNameZh(supabase);
  log.info(`Found ${skills.length} skills needing name_zh`);

  if (LIMIT !== Infinity) {
    skills = skills.slice(0, LIMIT);
    log.info(`Limited to ${skills.length} skills`);
  }

  if (skills.length === 0) {
    log.info("No skills to process. Exiting.");
    log.done();
    return;
  }

  stats.total = skills.length;

  // ── Step 2: Process in batches of 10 ──────────────────────────

  for (let i = 0; i < skills.length; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(skills.length / BATCH_SIZE);

    if (i > 0 && i % 50 === 0) {
      log.info(`Progress: ${i}/${skills.length} processed, ${stats.updated} updated, ${stats.errors} errors`);
    }

    const userPrompt = `Translate these tool names to Chinese. For each, consider the description to pick the best translation.\n\n${batch.map((s) => `- name: "${s.name}", description: "${(s.description || "").slice(0, 200)}"`).join("\n")}`;

    try {
      const text = await callLLM(SYSTEM_PROMPT, userPrompt, 2048);
      const parsed = parseJsonResponse(text);

      if (!parsed.items || !Array.isArray(parsed.items)) {
        log.warn(`  Batch ${batchNum}: unexpected response structure, skipping`);
        stats.skipped += batch.length;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Build a map from original name to Chinese name
      const nameMap = new Map();
      for (const item of parsed.items) {
        if (item.name && item.nameZh) {
          nameMap.set(item.name, item.nameZh);
        }
      }

      for (const skill of batch) {
        const nameZh = nameMap.get(skill.name);
        if (!nameZh) {
          log.warn(`  No translation for "${skill.name}", skipping`);
          stats.skipped++;
          continue;
        }

        if (DRY_RUN) {
          log.info(`  [dry-run] ${skill.name} -> ${nameZh}`);
        } else {
          const { error } = await supabase
            .from("skills")
            .update({ name_zh: nameZh })
            .eq("slug", skill.slug);

          if (error) {
            log.error(`  Failed to update ${skill.slug}: ${error.message}`);
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
    `\n${mode}Backfill Skills name_zh Summary:`,
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
