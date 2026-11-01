#!/usr/bin/env node

/**
 * Publish the curated catalog from a reviewed whitelist (ADR-009).
 *
 * Every row whose github_url points at a whitelisted repo becomes published.
 * Rows missing a Chinese name or description are reported and, unless
 * --allow-missing-zh is passed, left unpublished so they can be backfilled first.
 *
 * Modes:
 *   --dry-run   Report what would be published (no DB writes)
 *   --apply     Publish matching rows
 *
 * Options:
 *   --table skills|mcp_servers   Default: skills
 *   --list <file>                Default: scripts/catalog/<table>-whitelist.json
 *   --allow-missing-zh           Publish rows even without name_zh / description_zh
 *
 * Examples:
 *   node scripts/publish-whitelist.mjs --dry-run
 *   node scripts/publish-whitelist.mjs --apply
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { appendFileSync, readFileSync } from "node:fs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("whitelist");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const dryRun = args.includes("--dry-run");
const applyMode = args.includes("--apply");
const allowMissingZh = args.includes("--allow-missing-zh");
const table = argValue("--table") || "skills";
const listFile = argValue("--list") || `scripts/catalog/${table}-whitelist.json`;

if (dryRun === applyMode) {
  console.log("Usage: node scripts/publish-whitelist.mjs [--dry-run | --apply] [--table t] [--list f] [--allow-missing-zh]");
  process.exit(1);
}
if (!["skills", "mcp_servers"].includes(table)) {
  log.error(`Unknown table: ${table}`);
  process.exit(1);
}

const PAGE_SIZE = 1000;
const BATCH_SIZE = 200;

// ── Helpers ───────────────────────────────────────────────────────────

function repoKey(url) {
  const m = url?.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}`.toLowerCase() : null;
}

async function fetchRows(supabase) {
  const rows = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("slug, name, name_zh, description_zh, github_url, status")
      .not("github_url", "is", null)
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

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  const whitelist = new Set(
    JSON.parse(readFileSync(listFile, "utf8")).repos.map((r) => r.toLowerCase())
  );
  log.info(`Mode: ${applyMode ? "APPLY" : "DRY RUN"} | ${table} | ${whitelist.size} repos from ${listFile}`);

  const rows = await fetchRows(supabase);
  const byRepo = new Map([...whitelist].map((r) => [r, []]));
  for (const row of rows) {
    const key = repoKey(row.github_url);
    if (key && byRepo.has(key)) byRepo.get(key).push(row);
  }

  const toPublish = [];
  const missingZh = [];
  const lines = [
    `## Whitelist publish — ${table} (${applyMode ? "apply" : "dry-run"})`,
    "",
    "| Repo | Rows | Already published | Missing zh |",
    "|------|------|-------------------|------------|",
  ];

  for (const [repo, repoRows] of byRepo) {
    const missing = repoRows.filter((r) => !r.name_zh || !r.description_zh);
    const ready = allowMissingZh ? repoRows : repoRows.filter((r) => r.name_zh && r.description_zh);
    toPublish.push(...ready.filter((r) => r.status !== "published"));
    missingZh.push(...missing);
    const published = repoRows.filter((r) => r.status === "published").length;
    lines.push(`| ${repo} | ${repoRows.length} | ${published} | ${missing.length} |`);
  }

  const notFound = [...byRepo].filter(([, r]) => r.length === 0).map(([repo]) => repo);
  const summary = [
    "",
    `To publish: **${toPublish.length}** rows`,
    `Missing Chinese name/description: ${missingZh.length} rows${allowMissingZh ? " (published anyway)" : " (skipped)"}`,
    notFound.length ? `Repos with no rows in DB: ${notFound.join(", ")}` : "All whitelisted repos have rows in DB",
    "",
    missingZh.length ? `Missing zh slugs: ${missingZh.map((r) => r.slug).join(", ")}` : "",
  ];
  const md = [...lines, ...summary].join("\n");
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");

  if (dryRun) {
    log.info("[DRY RUN] No DB changes made");
    log.done();
    return;
  }

  let errors = 0;
  const slugs = toPublish.map((r) => r.slug);
  for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
    const batch = slugs.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).update({ status: "published" }).in("slug", batch);
    if (error) {
      log.error(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      errors += batch.length;
    }
  }
  log.success(`Published ${slugs.length - errors}, errors ${errors}`);
  log.done();
  if (errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
