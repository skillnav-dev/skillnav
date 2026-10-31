#!/usr/bin/env node

/**
 * Unpublish the Skills / MCP catalog for a strict-quality rebuild (ADR-009).
 *
 * Every published row is switched to status=hidden, except editor picks
 * (quality_tier = 'S'), which stay live until they are re-reviewed.
 * Before any write, a snapshot of the published rows (slug + status + tier)
 * is written to disk so the change can be reverted with --restore.
 *
 * Modes:
 *   --dry-run                 Count what would be hidden, write snapshot, no DB writes
 *   --apply                   Write snapshot, then hide rows
 *   --restore <snapshot.json> Re-publish every slug listed in a snapshot
 *
 * Options:
 *   --table skills|mcp_servers  Limit to one table (default: both)
 *   --out <dir>                 Snapshot directory (default: data/backups)
 *
 * Examples:
 *   node scripts/unpublish-catalog.mjs --dry-run
 *   node scripts/unpublish-catalog.mjs --apply
 *   node scripts/unpublish-catalog.mjs --restore data/backups/unpublish-2026-11-01.json
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("unpublish");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const restoreFile = argValue("--restore");
const tableArg = argValue("--table");
const outDir = argValue("--out") || "data/backups";

const ALL_TABLES = ["skills", "mcp_servers"];
const tables = tableArg ? [tableArg] : ALL_TABLES;

if ([dryRun, applyMode, Boolean(restoreFile)].filter(Boolean).length !== 1) {
  console.log("Usage: node scripts/unpublish-catalog.mjs [--dry-run | --apply | --restore <file>]");
  console.log("       [--table skills|mcp_servers] [--out <dir>]");
  process.exit(1);
}
if (tables.some((t) => !ALL_TABLES.includes(t))) {
  log.error(`Unknown table: ${tableArg}`);
  process.exit(1);
}

// ── Constants ─────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;
const BATCH_SIZE = 200;
const PROTECTED_TIER = "S";

// ── DB helpers ────────────────────────────────────────────────────────

/**
 * Fetch all published rows of a table, ordered by slug for stable paging.
 */
async function fetchPublished(supabase, table) {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("slug, status, quality_tier")
      .eq("status", "published")
      .order("slug", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

/**
 * Set status for a list of slugs in batches. Uses update (not upsert) so
 * NOT NULL columns are never touched.
 */
async function setStatus(supabase, table, slugs, status) {
  let done = 0;
  let errors = 0;

  for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
    const batch = slugs.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).update({ status }).in("slug", batch);
    if (error) {
      log.error(`${table} batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      errors += batch.length;
    } else {
      done += batch.length;
    }
  }

  return { done, errors };
}

// ── Modes ─────────────────────────────────────────────────────────────

async function unpublish(supabase) {
  const snapshot = { createdAt: new Date().toISOString(), tables: {} };
  const plan = {};

  for (const table of tables) {
    const rows = await fetchPublished(supabase, table);
    const toHide = rows.filter((r) => r.quality_tier !== PROTECTED_TIER);
    snapshot.tables[table] = toHide;
    plan[table] = { published: rows.length, kept: rows.length - toHide.length, toHide };
    log.info(
      `${table}: ${rows.length} published → hide ${toHide.length}, keep ${rows.length - toHide.length} (tier ${PROTECTED_TIER})`
    );
  }

  // Snapshot is always written first, even in dry-run, so the file can be reviewed.
  mkdirSync(outDir, { recursive: true });
  const stamp = snapshot.createdAt.replace(/[:.]/g, "-");
  const file = join(outDir, `unpublish-${stamp}.json`);
  writeFileSync(file, JSON.stringify(snapshot, null, 2));
  log.success(`Snapshot written: ${file}`);

  if (dryRun) {
    log.info("[DRY RUN] No DB changes made");
    return 0;
  }

  let totalErrors = 0;
  for (const table of tables) {
    const slugs = plan[table].toHide.map((r) => r.slug);
    const { done, errors } = await setStatus(supabase, table, slugs, "hidden");
    totalErrors += errors;
    log.success(`${table}: hid ${done}, errors ${errors}`);
  }
  return totalErrors;
}

async function restore(supabase) {
  const snapshot = JSON.parse(readFileSync(restoreFile, "utf8"));
  let totalErrors = 0;

  for (const table of tables) {
    const rows = snapshot.tables?.[table] ?? [];
    if (rows.length === 0) continue;
    const slugs = rows.map((r) => r.slug);
    const { done, errors } = await setStatus(supabase, table, slugs, "published");
    totalErrors += errors;
    log.success(`${table}: re-published ${done}, errors ${errors}`);
  }
  return totalErrors;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  log.info(`Mode: ${restoreFile ? `RESTORE from ${restoreFile}` : applyMode ? "APPLY" : "DRY RUN"}`);
  const errors = restoreFile ? await restore(supabase) : await unpublish(supabase);

  log.done();
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
