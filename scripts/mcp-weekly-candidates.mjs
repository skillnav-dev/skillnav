#!/usr/bin/env node

/**
 * Weekly MCP candidate scan (ADR-009). Replaces the bulk registry sync.
 *
 * 1. Fetch servers updated in the Official MCP Registry over the last N days
 *    (latest version only).
 * 2. Keep repos that are not in mcp_servers at all yet (anything already in the
 *    DB was reviewed in an earlier round).
 * 3. Judge each repo with the catalog criteria (official org or >= minStars,
 *    pushed within 180 days, not archived).
 * 4. Insert the passing servers as drafts and write a review list. Nothing is
 *    published: approved repos go into scripts/catalog/mcp_servers-whitelist.json
 *    and are published with the Publish Whitelist workflow.
 *
 * Usage:
 *   node scripts/mcp-weekly-candidates.mjs [--since-days 8] [--min-stars 500] [--dry-run]
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { appendFileSync } from "node:fs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubGraphQLBatch } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { fetchMcpRegistryServers } from "./lib/sources/mcp-registry.mjs";
import { transformRegistryEntry } from "./lib/mcp-transform.mjs";
import { MAX_AGE_DAYS, judgeRepo, parseGithubUrl } from "./lib/catalog-criteria.mjs";

const log = createLogger("mcp-candidates");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const dryRun = args.includes("--dry-run");
const sinceDays = Number(argValue("--since-days") || 8);
const minStars = Number(argValue("--min-stars") || 500);
const PAGE_SIZE = 1000;

// ── Helpers ───────────────────────────────────────────────────────────

const repoKey = (url) => {
  const p = parseGithubUrl(url);
  return p ? `${p.owner}/${p.repo}`.toLowerCase() : null;
};

/** Every repo and slug already in mcp_servers, any status. */
async function fetchKnown(supabase) {
  const repos = new Set();
  const slugs = new Set();
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("slug, github_url")
      .order("slug", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`Fetch mcp_servers: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      slugs.add(row.slug);
      const key = repoKey(row.github_url);
      if (key) repos.add(key);
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return { repos, slugs };
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GITHUB_TOKEN"]);
  const supabase = createAdminClient();

  const updatedSince = new Date(Date.now() - sinceDays * 86400000).toISOString();
  log.info(`Mode: ${dryRun ? "DRY RUN" : "LIVE"} | since ${updatedSince} | min stars ${minStars}`);

  const [entries, known] = await Promise.all([
    fetchMcpRegistryServers({ updatedSince, latestOnly: true }),
    fetchKnown(supabase),
  ]);
  log.info(`Registry: ${entries.length} servers | DB: ${known.repos.size} known repos`);

  // New repos only, grouped (one repo can ship several servers)
  const groups = new Map();
  for (const entry of entries) {
    const row = transformRegistryEntry(entry);
    const key = row && repoKey(row.github_url);
    if (!key || known.repos.has(key) || known.slugs.has(row.slug)) continue;
    if (!groups.has(key)) groups.set(key, { ...parseGithubUrl(row.github_url), rows: [] });
    groups.get(key).rows.push(row);
  }
  log.info(`${groups.size} new repos to check on GitHub`);

  const ghData = groups.size
    ? await githubGraphQLBatch([...groups.values()].map(({ owner, repo }) => ({ owner, repo })))
    : new Map();

  const passing = [];
  for (const [key, g] of groups) {
    const gh = ghData.get(`${g.owner}/${g.repo}`) ?? ghData.get(key);
    const { pass, reasons } = judgeRepo(g.owner, gh, minStars);
    if (!pass) continue;
    for (const row of g.rows) {
      row.stars = gh.stargazerCount;
      row.forks_count = gh.forkCount;
      row.pushed_at = gh.pushedAt;
      row.is_archived = gh.isArchived;
    }
    passing.push({ repo: `${g.owner}/${g.repo}`, stars: gh.stargazerCount, reasons, rows: g.rows });
  }
  passing.sort((a, b) => b.stars - a.stars);

  // Insert passing servers as drafts so an approved repo can be published later
  const rows = passing.flatMap((p) => p.rows);
  let inserted = 0;
  if (!dryRun && rows.length) {
    const { error } = await supabase
      .from("mcp_servers")
      .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
    if (error) throw new Error(`Insert drafts: ${error.message}`);
    inserted = rows.length;
  }

  const md = [
    `## New MCP candidates (${new Date().toISOString().slice(0, 10)}, last ${sinceDays} days)`,
    "",
    `Criteria: official org or stars >= ${minStars}; pushed within ${MAX_AGE_DAYS} days; not archived; repo not in DB before.`,
    "",
    `Registry servers scanned: ${entries.length} | new repos: ${groups.size} | **passing: ${passing.length}**${dryRun ? " (dry run, nothing inserted)" : ` | drafts inserted: ${inserted}`}`,
    "",
    "To approve: add the repo to scripts/catalog/mcp_servers-whitelist.json, backfill Chinese copy, then run Publish Whitelist.",
    "",
    "| Repo | Stars | Servers | Notes |",
    "|------|-------|---------|-------|",
    ...passing.map(
      (p) => `| ${p.repo} | ${p.stars} | ${p.rows.map((r) => r.slug).join(", ")} | ${p.reasons.join("; ")} |`
    ),
  ].join("\n");

  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");
  log.setOutput("passing", passing.length);
  log.success(`${passing.length} candidates`);
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
