#!/usr/bin/env node

/**
 * Sync MCP servers from external discovery sources to Supabase.
 * Sources: Official MCP Registry, Smithery
 *
 * Usage:
 *   node scripts/sync-mcp-servers.mjs                         # Sync all sources
 *   node scripts/sync-mcp-servers.mjs --dry-run               # Preview only
 *   node scripts/sync-mcp-servers.mjs --source mcp-registry   # Only MCP Registry
 *   node scripts/sync-mcp-servers.mjs --source smithery        # Only Smithery
 *   node scripts/sync-mcp-servers.mjs --incremental            # Only new servers
 *   node scripts/sync-mcp-servers.mjs --limit 50               # Limit per source
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { fetchMcpRegistryServers } from "./lib/sources/mcp-registry.mjs";
import { fetchSmitheryServers } from "./lib/sources/smithery.mjs";

const log = createLogger("mcp-sync");

const VALID_SOURCES = ["mcp-registry", "smithery"];

// ─── Slug generation ─────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a slug from qualified name or server name.
 * "owner/repo" → "owner--repo", "my-server" → "my-server"
 */
function makeSlug(name) {
  if (!name) return "";
  if (name.includes("/")) {
    const parts = name.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${slugify(parts[parts.length - 2])}--${slugify(parts[parts.length - 1])}`;
    }
  }
  // For reverse-DNS names like "com.example/server", simplify
  return slugify(name);
}

/**
 * Extract owner from GitHub URL or qualified name.
 */
function extractAuthor(githubUrl, name) {
  if (githubUrl) {
    try {
      const parts = new URL(githubUrl).pathname.split("/").filter(Boolean);
      if (parts[0]) return parts[0];
    } catch { /* fall through */ }
  }
  if (name && name.includes("/")) {
    return name.split("/")[0];
  }
  return "unknown";
}

// ─── Transform sources to DB rows ────────────────────────────────────

function transformRegistryEntry(entry) {
  const slug = makeSlug(entry.name);
  if (!slug) return null;

  return {
    slug,
    name: entry.displayName || entry.name,
    author: extractAuthor(entry.githubUrl, entry.name),
    description: entry.description || "",
    github_url: entry.githubUrl || null,
    version: entry.version || null,
    source: "mcp-registry",
    source_url: entry.remoteUrl || entry.githubUrl || null,
    status: "draft",
    stars: 0,
    forks_count: 0,
    weekly_downloads: 0,
    tools_count: 0,
    quality_score: null,
    discovered_at: entry.publishedAt || new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
}

function transformSmitheryEntry(entry) {
  const slug = makeSlug(entry.name);
  if (!slug) return null;

  return {
    slug,
    name: entry.displayName || entry.name,
    author: extractAuthor(entry.githubUrl, entry.name),
    description: entry.description || "",
    github_url: entry.githubUrl || null,
    source: "smithery",
    source_url: entry.homepage || null,
    is_verified: entry.verified || false,
    status: "draft",
    stars: 0,
    forks_count: 0,
    weekly_downloads: entry.useCount || 0,
    tools_count: 0,
    quality_score: null,
    discovered_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };
}

// ─── Fetch existing servers for dedup ────────────────────────────────

async function fetchExistingServers(supabase) {
  log.info("Fetching existing MCP servers for deduplication...");

  const allSlugs = new Set();
  const allUrls = new Set();
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("slug, github_url")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      allSlugs.add(row.slug);
      if (row.github_url) allUrls.add(row.github_url.toLowerCase());
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  log.info(`Found ${allSlugs.size} existing slugs, ${allUrls.size} existing URLs`);
  return { slugs: allSlugs, urls: allUrls };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const incremental = args.includes("--incremental");
  const sourceIdx = args.indexOf("--source");
  const sourceFilter = sourceIdx !== -1 ? args[sourceIdx + 1] : null;
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;

  if (sourceFilter && !VALID_SOURCES.includes(sourceFilter)) {
    log.error(`Unknown source: ${sourceFilter}. Available: ${VALID_SOURCES.join(", ")}`);
    process.exit(1);
  }

  log.info(`MCP Server Sync -- ${new Date().toISOString()}`);
  log.info(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | Incremental: ${incremental} | Limit: ${limit === Infinity ? "none" : limit}`);
  if (sourceFilter) log.info(`Source filter: ${sourceFilter}`);

  let supabase;
  if (!dryRun) {
    validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
    supabase = createAdminClient();
  }

  // Pre-fetch existing servers for dedup
  let existingSlugs = new Set();
  let existingUrls = new Set();

  if (supabase && incremental) {
    const existing = await fetchExistingServers(supabase);
    existingSlugs = existing.slugs;
    existingUrls = existing.urls;
  }

  // ── Fetch from sources ────────────────────────────────────────────

  const allRows = [];
  const sourceCounts = {};

  // 1. Official MCP Registry
  if (!sourceFilter || sourceFilter === "mcp-registry") {
    log.info(`\n${"=".repeat(60)}`);
    log.info("Source: Official MCP Registry");

    try {
      let entries = await fetchMcpRegistryServers();
      log.info(`Fetched ${entries.length} servers from MCP Registry`);

      if (limit !== Infinity) entries = entries.slice(0, limit);

      for (const entry of entries) {
        const row = transformRegistryEntry(entry);
        if (!row) continue;

        // Incremental dedup
        if (incremental) {
          if (existingSlugs.has(row.slug)) continue;
          if (row.github_url && existingUrls.has(row.github_url.toLowerCase())) continue;
        }

        allRows.push(row);
      }

      sourceCounts["mcp-registry"] = allRows.length;
    } catch (err) {
      log.error(`MCP Registry failed: ${err.message}`);
    }
  }

  // 2. Smithery
  if (!sourceFilter || sourceFilter === "smithery") {
    log.info(`\n${"=".repeat(60)}`);
    log.info("Source: Smithery");

    const prevCount = allRows.length;

    try {
      let entries = await fetchSmitheryServers();
      log.info(`Fetched ${entries.length} servers from Smithery`);

      if (limit !== Infinity) entries = entries.slice(0, limit);

      for (const entry of entries) {
        const row = transformSmitheryEntry(entry);
        if (!row) continue;

        // Incremental dedup
        if (incremental) {
          if (existingSlugs.has(row.slug)) continue;
          if (row.github_url && existingUrls.has(row.github_url.toLowerCase())) continue;
        }

        allRows.push(row);
      }

      sourceCounts["smithery"] = allRows.length - prevCount;
    } catch (err) {
      log.error(`Smithery failed: ${err.message}`);
    }
  }

  // ── Cross-source dedup by slug ────────────────────────────────────

  const slugMap = new Map();
  const dedupedRows = [];

  for (const row of allRows) {
    if (slugMap.has(row.slug)) {
      // Keep the one with more info (github_url wins)
      const existing = slugMap.get(row.slug);
      if (!existing.github_url && row.github_url) {
        // Replace with richer entry
        const idx = dedupedRows.indexOf(existing);
        if (idx !== -1) dedupedRows[idx] = row;
        slugMap.set(row.slug, row);
      }
      continue;
    }
    slugMap.set(row.slug, row);
    dedupedRows.push(row);
  }

  const dupeCount = allRows.length - dedupedRows.length;
  if (dupeCount > 0) {
    log.info(`Cross-source dedup: ${allRows.length} -> ${dedupedRows.length} (${dupeCount} duplicates)`);
  }

  // ── Summary ───────────────────────────────────────────────────────

  log.info(`\n${"=".repeat(60)}`);
  log.info(`Total: ${dedupedRows.length} MCP servers to upsert`);
  for (const [src, count] of Object.entries(sourceCounts)) {
    log.info(`  ${src}: ${count}`);
  }

  if (dryRun) {
    log.info("\n[DRY RUN] Sample servers:");
    for (const row of dedupedRows.slice(0, 15)) {
      log.info(`  ${row.slug}: ${row.name} [${row.source}] ${row.github_url || ""}`);
    }
    log.info(`[DRY RUN] Would upsert ${dedupedRows.length} MCP servers`);
    log.done();
    return;
  }

  if (dedupedRows.length === 0) {
    log.info("No servers to upsert");
    log.done();
    return;
  }

  // ── Batch upsert ──────────────────────────────────────────────────

  const BATCH_SIZE = 100;
  let upserted = 0;
  let errors = 0;

  for (let i = 0; i < dedupedRows.length; i += BATCH_SIZE) {
    const batch = dedupedRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("mcp_servers")
      .upsert(batch, { onConflict: "slug", ignoreDuplicates: true });

    if (error) {
      log.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
      errors++;
    } else {
      upserted += batch.length;
      log.info(`Upsert batch ${Math.floor(i / BATCH_SIZE) + 1}: +${batch.length} (total: ${upserted})`);
    }
  }

  // ── Final summary ─────────────────────────────────────────────────

  const summaryLines = [
    "## MCP Server Sync Summary",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Sources | ${Object.keys(sourceCounts).join(", ")} |`,
    `| Total fetched | ${allRows.length} |`,
    `| After dedup | ${dedupedRows.length} |`,
    `| Upserted | ${upserted} |`,
    `| Errors | ${errors} |`,
    `| Incremental | ${incremental ? "Yes" : "No"} |`,
    "",
    "### By Source",
    "",
    "| Source | Count |",
    "|--------|-------|",
    ...Object.entries(sourceCounts).map(([src, count]) => `| ${src} | ${count} |`),
  ];

  log.summary(summaryLines.join("\n"));
  log.done();

  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
