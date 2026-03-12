#!/usr/bin/env node

/**
 * Backfill the `tools` JSONB column in mcp_servers from the Smithery API.
 * Fetches tool definitions (name, description, inputSchema) for each server.
 *
 * Usage:
 *   node scripts/backfill-mcp-tools.mjs                     # Backfill all with tools IS NULL
 *   node scripts/backfill-mcp-tools.mjs --dry-run            # Preview only
 *   node scripts/backfill-mcp-tools.mjs --limit 5            # Process first N servers
 *   node scripts/backfill-mcp-tools.mjs --slug upstash--context7-mcp  # Single server
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { withRetry } from "./lib/retry.mjs";

const log = createLogger("backfill-tools");

const SMITHERY_API = "https://registry.smithery.ai/servers";
const USER_AGENT = "SkillNav-Sync/1.0";
const RATE_LIMIT_MS = 200;

// ─── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
const slugIdx = args.indexOf("--slug");
const SLUG_FILTER = slugIdx !== -1 ? args[slugIdx + 1] : null;

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Convert DB slug (owner--repo) to Smithery qualifiedName (owner/repo).
 * @param {string} slug
 * @returns {string|null}
 */
function slugToQualifiedName(slug) {
  if (!slug) return null;
  if (slug.includes("--")) {
    const parts = slug.split("--");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[0]}/${parts[1]}`;
    }
  }
  return null;
}

/**
 * Extract owner/repo from a GitHub URL.
 * @param {string} url
 * @returns {string|null}
 */
function githubUrlToQualifiedName(url) {
  if (!url) return null;
  const match = url.match(
    /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/
  );
  if (!match) return null;
  return `${match[1]}/${match[2].replace(/\.git$/, "")}`;
}

/**
 * Resolve the best Smithery qualifiedName for a server row.
 * @param {{ slug: string; github_url?: string; source?: string }} row
 * @returns {string|null}
 */
function resolveQualifiedName(row) {
  // 1. Try slug conversion (most common)
  const fromSlug = slugToQualifiedName(row.slug);
  if (fromSlug) return fromSlug;

  // 2. Try extracting from github_url
  const fromGithub = githubUrlToQualifiedName(row.github_url);
  if (fromGithub) return fromGithub;

  return null;
}

/**
 * Fetch tool definitions from Smithery detail API.
 * @param {string} qualifiedName - e.g. "upstash/context7-mcp"
 * @returns {Promise<Array<{name: string, description: string, inputSchema?: object}>>}
 */
async function fetchSmitheryTools(qualifiedName) {
  // Smithery detail endpoint uses path segments: /servers/{namespace}/{slug}
  const url = `${SMITHERY_API}/${qualifiedName}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (res.status === 404) {
    return null; // Not found on Smithery
  }

  if (!res.ok) {
    throw new Error(`Smithery API ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.tools || [];
}

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── DB helpers ──────────────────────────────────────────────────────

/**
 * Fetch MCP servers needing tools backfill (paginated).
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<Array<{slug: string, github_url: string|null, source: string|null}>>}
 */
async function fetchServersNeedingTools(supabase) {
  const PAGE_SIZE = 1000;
  const allRows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("mcp_servers")
      .select("slug, github_url, source");

    // If targeting a specific slug, skip the IS NULL filter
    if (SLUG_FILTER) {
      query = query.eq("slug", SLUG_FILTER);
    } else {
      query = query.is("tools", null);
    }

    const { data, error } = await query.range(
      offset,
      offset + PAGE_SIZE - 1
    );

    if (error) throw new Error(`DB read mcp_servers: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();
  const stats = {
    total: 0,
    updated: 0,
    notFound: 0,
    noQualifiedName: 0,
    errors: 0,
  };

  log.info(`Backfill MCP Tools -- ${new Date().toISOString()}`);
  log.info(
    `Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"} | Limit: ${LIMIT === Infinity ? "none" : LIMIT}${SLUG_FILTER ? ` | Slug: ${SLUG_FILTER}` : ""}`
  );

  // ── Step 1: Fetch servers needing backfill ─────────────────────────

  log.info("Fetching MCP servers with tools IS NULL...");
  let servers = await fetchServersNeedingTools(supabase);
  log.info(`Found ${servers.length} servers needing tools backfill`);

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

  // ── Step 2: Fetch tools from Smithery for each server ──────────────

  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];
    const qualifiedName = resolveQualifiedName(server);

    log.progress(i + 1, servers.length, stats.errors, server.slug);

    if (!qualifiedName) {
      log.info(`  Skip ${server.slug}: cannot resolve qualifiedName`);
      stats.noQualifiedName++;
      continue;
    }

    try {
      const tools = await withRetry(
        () => fetchSmitheryTools(qualifiedName),
        { label: server.slug, maxRetries: 2, baseDelay: 1000 }
      );

      if (tools === null) {
        // 404 — not found on Smithery
        if (DRY_RUN) {
          log.info(`  [dry-run] ${server.slug} (${qualifiedName}): not found on Smithery`);
        }
        stats.notFound++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      const toolsCount = tools.length;

      // Strip inputSchema to keep only name + description + inputSchema (no extra fields)
      const cleanTools = tools.map((t) => ({
        name: t.name || "",
        description: t.description || "",
        ...(t.inputSchema ? { inputSchema: t.inputSchema } : {}),
      }));

      if (DRY_RUN) {
        log.info(
          `  [dry-run] ${server.slug} (${qualifiedName}): ${toolsCount} tools`
        );
        if (toolsCount > 0) {
          const names = cleanTools
            .slice(0, 5)
            .map((t) => t.name)
            .join(", ");
          log.info(`    Tools: ${names}${toolsCount > 5 ? ` ... +${toolsCount - 5} more` : ""}`);
        }
      } else {
        const { error } = await supabase
          .from("mcp_servers")
          .update({
            tools: cleanTools,
            tools_count: toolsCount,
            last_synced_at: new Date().toISOString(),
          })
          .eq("slug", server.slug);

        if (error) {
          log.error(`  Failed to update ${server.slug}: ${error.message}`);
          stats.errors++;
          await sleep(RATE_LIMIT_MS);
          continue;
        }
      }

      stats.updated++;
    } catch (err) {
      log.error(`  Error fetching ${server.slug} (${qualifiedName}): ${err.message}`);
      stats.errors++;
    }

    // Rate limiting: be polite to Smithery API
    await sleep(RATE_LIMIT_MS);
  }

  log.progressEnd();

  // ── Summary ────────────────────────────────────────────────────────

  const mode = DRY_RUN ? "[DRY RUN] " : "";
  const summaryLines = [
    `\n${mode}Backfill MCP Tools Summary:`,
    `  Total servers: ${stats.total}`,
    `  Updated: ${stats.updated}`,
    `  Not found on Smithery: ${stats.notFound}`,
    `  No qualifiedName: ${stats.noQualifiedName}`,
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
