#!/usr/bin/env node

/**
 * MCP server governance: auto-tiering based on quality signals.
 *
 * Three-tier model:
 *   A: Quality Auto — stars >= 100 OR tools_count >= 3 OR is_verified
 *   B: Long-tail Index — has description OR has github_url
 *   Hidden: No description AND no github_url (junk)
 *
 * Modes:
 *   --audit       Report distribution only (no DB changes)
 *   --dry-run     Preview per-server changes
 *   --apply       Execute updates to DB
 *
 * Options:
 *   --limit N     Process only first N servers
 *
 * Examples:
 *   node scripts/govern-mcp-servers.mjs --audit
 *   node scripts/govern-mcp-servers.mjs --dry-run --limit 50
 *   node scripts/govern-mcp-servers.mjs --apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("govern-mcp");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const auditMode = args.includes("--audit");
const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const limitCount = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

if (!auditMode && !dryRun && !applyMode) {
  console.log("Usage: node scripts/govern-mcp-servers.mjs [--audit | --dry-run | --apply]");
  console.log("  --audit    Report tier distribution (no DB writes)");
  console.log("  --dry-run  Preview per-server changes");
  console.log("  --apply    Execute updates to DB");
  console.log("  --limit N  Process only first N servers");
  process.exit(1);
}

// ── Classification ────────────────────────────────────────────────────

const A_STAR_THRESHOLD = 100;
const A_TOOLS_THRESHOLD = 3;

/**
 * Classify a server into A / B / hidden tier.
 * @returns {{ status: string; qualityTier: string; reason: string } | null}
 *   null means skip (already published)
 */
function classify(server) {
  // Skip already-published servers
  if (server.status === "published") return null;

  const hasDesc = !!server.description && server.description.trim().length > 0;
  const hasGithub = !!server.github_url;
  const toolsCount = server.tools_count || 0;

  // A-tier: high quality signals
  if (
    server.stars >= A_STAR_THRESHOLD ||
    toolsCount >= A_TOOLS_THRESHOLD ||
    server.is_verified
  ) {
    const reasons = [];
    if (server.stars >= A_STAR_THRESHOLD) reasons.push(`stars=${server.stars}`);
    if (toolsCount >= A_TOOLS_THRESHOLD) reasons.push(`tools=${toolsCount}`);
    if (server.is_verified) reasons.push("verified");
    return {
      status: "published",
      qualityTier: "A",
      reason: reasons.join(", "),
    };
  }

  // B-tier: has basic info
  if (hasDesc || hasGithub) {
    return {
      status: "published",
      qualityTier: "B",
      reason: [hasDesc && "has-desc", hasGithub && "has-github"].filter(Boolean).join(", "),
    };
  }

  // Hidden: junk
  return {
    status: "hidden",
    qualityTier: server.quality_tier || "B",
    reason: "no-desc, no-github",
  };
}

// ── DB helpers ────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;
const BATCH_SIZE = 100;

async function fetchAllDraftServers(supabase) {
  const allRows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("mcp_servers")
      .select("slug, status, quality_tier, stars, tools_count, tools, is_verified, description, github_url")
      .order("stars", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;
    if (error) throw new Error(`DB read: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  log.info(`MCP Server Governance — ${new Date().toISOString()}`);
  log.info(`Mode: ${auditMode ? "AUDIT" : dryRun ? "DRY RUN" : "APPLY"}`);

  // ── Step 1: Fetch all servers ──────────────────────────────────────

  log.info("Fetching MCP servers...");
  let servers = await fetchAllDraftServers(supabase);
  log.info(`Loaded ${servers.length} servers`);

  if (limitCount > 0) {
    servers = servers.slice(0, limitCount);
    log.info(`Limited to first ${limitCount}`);
  }

  // ── Step 2: Backfill tools_count from tools JSONB ──────────────────

  const toolsBackfillUpdates = [];
  for (const s of servers) {
    if (s.tools && Array.isArray(s.tools) && s.tools.length > 0 && (!s.tools_count || s.tools_count === 0)) {
      const newCount = s.tools.length;
      s.tools_count = newCount; // update in-memory for classification
      toolsBackfillUpdates.push({ slug: s.slug, tools_count: newCount });
    }
  }

  if (toolsBackfillUpdates.length > 0) {
    log.info(`Backfilling tools_count for ${toolsBackfillUpdates.length} servers...`);

    if (applyMode) {
      for (let i = 0; i < toolsBackfillUpdates.length; i += BATCH_SIZE) {
        const batch = toolsBackfillUpdates.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
          .from("mcp_servers")
          .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });
        if (error) throw new Error(`Backfill batch: ${error.message}`);
      }
      log.success(`Backfilled tools_count for ${toolsBackfillUpdates.length} servers`);
    } else {
      log.info(`[preview] Would backfill tools_count for ${toolsBackfillUpdates.length} servers`);
    }
  }

  // ── Step 3: Classify ───────────────────────────────────────────────

  const stats = { A: 0, B: 0, hidden: 0, skipped: 0, errors: 0 };
  const updates = [];
  const topA = [];

  for (const s of servers) {
    const result = classify(s);

    if (result === null) {
      stats.skipped++;
      continue;
    }

    if (result.status === "hidden") {
      stats.hidden++;
    } else if (result.qualityTier === "A") {
      stats.A++;
      if (topA.length < 20) {
        topA.push({ slug: s.slug, stars: s.stars, reason: result.reason });
      }
    } else {
      stats.B++;
    }

    updates.push({
      slug: s.slug,
      status: result.status,
      quality_tier: result.qualityTier,
    });

    if (dryRun) {
      const tierLabel = result.status === "hidden" ? "HIDDEN" : result.qualityTier;
      log.info(`  ${s.slug}: ${s.status}→${result.status} tier=${tierLabel} (${result.reason})`);
    }
  }

  // ── Step 4: Apply updates ──────────────────────────────────────────

  if (applyMode && updates.length > 0) {
    log.info(`Applying ${updates.length} updates...`);
    let errors = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("mcp_servers")
        .upsert(batch, { onConflict: "slug", ignoreDuplicates: false });
      if (error) {
        log.error(`Batch ${i / BATCH_SIZE + 1} failed: ${error.message}`);
        errors += batch.length;
        stats.errors += batch.length;
      }
      log.info(`  Progress: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
    }

    log.success(`Applied ${updates.length - errors} updates`);
  }

  // ── Summary ────────────────────────────────────────────────────────

  const mode = auditMode ? "[AUDIT]" : dryRun ? "[DRY RUN]" : "[APPLIED]";
  const summaryLines = [
    `\n${mode} MCP Governance Summary:`,
    `  Total servers: ${servers.length}`,
    `  A-tier (published): ${stats.A}`,
    `  B-tier (published): ${stats.B}`,
    `  Hidden: ${stats.hidden}`,
    `  Skipped (already published): ${stats.skipped}`,
    `  Errors: ${stats.errors}`,
  ];

  if (toolsBackfillUpdates.length > 0) {
    summaryLines.push(`  tools_count backfilled: ${toolsBackfillUpdates.length}`);
  }

  if (topA.length > 0) {
    summaryLines.push(`\n  Top A-tier servers:`);
    for (const a of topA) {
      summaryLines.push(`    ⭐ ${a.slug} (${a.reason})`);
    }
  }

  log.summary(summaryLines.join("\n"));
  log.done();

  if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
