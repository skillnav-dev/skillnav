#!/usr/bin/env node

/**
 * Build a review list of Skills / MCP candidates for the strict rebuild (ADR-009).
 * Read-only: queries the DB and GitHub, writes a Markdown + JSON report, never
 * changes any row.
 *
 * A row passes when its GitHub repo:
 *   - resolves, is not archived, and was pushed within MAX_AGE_DAYS, and
 *   - belongs to an official/vendor org (OFFICIAL_ORGS) or has >= minStars stars.
 * Skills are grouped by repo (one repo usually ships many skills).
 *
 * Usage:
 *   node scripts/catalog-candidates.mjs --table skills [--min-stars 200] [--out dir]
 *   node scripts/catalog-candidates.mjs --table mcp_servers [--min-stars 500]
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubGraphQLBatch } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("candidates");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const table = argValue("--table") || "skills";
if (!["skills", "mcp_servers"].includes(table)) {
  log.error(`Unknown table: ${table}`);
  process.exit(1);
}
const minStars = Number(argValue("--min-stars") || (table === "skills" ? 200 : 500));
const outDir = argValue("--out") || "data/candidates";

// ── Criteria ──────────────────────────────────────────────────────────

const MAX_AGE_DAYS = 180;
const PAGE_SIZE = 1000;

/** Orgs whose repos count as official / vendor-maintained (lowercase). */
const OFFICIAL_ORGS = new Set([
  "anthropics", "modelcontextprotocol", "openai", "google", "google-gemini",
  "googleapis", "microsoft", "github", "vercel", "vercel-labs", "cloudflare",
  "supabase", "neondatabase", "stripe", "getsentry", "huggingface", "aws",
  "awslabs", "upstash", "notionhq", "linear", "figma", "atlassian", "mongodb",
  "redis", "elastic", "grafana", "hashicorp", "docker", "jetbrains", "brave",
  "exa-labs", "firecrawl", "browserbase", "context7", "zapier", "shopify",
]);

// ── Helpers ───────────────────────────────────────────────────────────

function parseGithubUrl(url) {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

async function fetchRows(supabase) {
  const fields =
    table === "skills"
      ? "slug, name, name_zh, description_zh, github_url, status, quality_tier, install_command"
      : "slug, name, name_zh, description_zh, github_url, status, quality_tier, is_verified, tools_count";
  const rows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(fields)
      .not("github_url", "is", null)
      .order("slug", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    // MCP drafts number ~50k; only rows that were ever published or hidden
    // are realistic candidates for a curated list.
    if (table === "mcp_servers") query = query.in("status", ["published", "hidden"]);

    const { data, error } = await query;
    if (error) throw new Error(`Fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

/**
 * Judge one repo against the criteria.
 * @returns {{ pass: boolean, reasons: string[] }}
 */
function judge(owner, gh) {
  if (!gh) return { pass: false, reasons: ["repo not found"] };
  const reasons = [];
  const official = OFFICIAL_ORGS.has(owner.toLowerCase());
  const ageDays = gh.pushedAt ? (Date.now() - Date.parse(gh.pushedAt)) / 86400000 : Infinity;

  if (gh.isArchived) reasons.push("archived");
  if (ageDays > MAX_AGE_DAYS) reasons.push(`no push in ${Math.round(ageDays)}d`);
  if (!official && gh.stargazerCount < minStars) reasons.push(`stars ${gh.stargazerCount} < ${minStars}`);

  return { pass: reasons.length === 0, reasons: official ? ["official", ...reasons] : reasons };
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GITHUB_TOKEN"]);
  const supabase = createAdminClient();

  const rows = await fetchRows(supabase);
  log.info(`${table}: ${rows.length} rows with a GitHub URL`);

  // Group rows by repo
  const groups = new Map();
  for (const row of rows) {
    const parsed = parseGithubUrl(row.github_url);
    if (!parsed) continue;
    const key = `${parsed.owner}/${parsed.repo}`.toLowerCase();
    if (!groups.has(key)) groups.set(key, { ...parsed, rows: [] });
    groups.get(key).rows.push(row);
  }
  log.info(`${groups.size} unique repos`);

  const ghData = await githubGraphQLBatch(
    [...groups.values()].map(({ owner, repo }) => ({ owner, repo }))
  );

  const report = [];
  for (const [key, g] of groups) {
    const gh = ghData.get(`${g.owner}/${g.repo}`) ?? ghData.get(key);
    const { pass, reasons } = judge(g.owner, gh);
    report.push({
      repo: `${g.owner}/${g.repo}`,
      stars: gh?.stargazerCount ?? null,
      pushedAt: gh?.pushedAt?.slice(0, 10) ?? null,
      pass,
      reasons,
      items: g.rows.map((r) => ({
        slug: r.slug,
        name: r.name_zh || r.name,
        status: r.status,
        tier: r.quality_tier,
        hasZh: Boolean(r.description_zh),
      })),
    });
  }
  report.sort((a, b) => Number(b.pass) - Number(a.pass) || (b.stars ?? 0) - (a.stars ?? 0));

  const passing = report.filter((r) => r.pass);
  const passingItems = passing.reduce((n, r) => n + r.items.length, 0);

  // Markdown report
  const lines = [
    `## ${table} candidates (${new Date().toISOString().slice(0, 10)})`,
    "",
    `Criteria: official org or stars >= ${minStars}; pushed within ${MAX_AGE_DAYS} days; not archived.`,
    "",
    `Passing: **${passing.length} repos / ${passingItems} items** (of ${report.length} repos / ${rows.length} items)`,
    "",
    "| Pass | Repo | Stars | Last push | Items | Notes |",
    "|------|------|-------|-----------|-------|-------|",
    ...report.map(
      (r) =>
        `| ${r.pass ? "✅" : "❌"} | ${r.repo} | ${r.stars ?? "-"} | ${r.pushedAt ?? "-"} | ${r.items.length} | ${r.reasons.join("; ")} |`
    ),
  ];
  const md = lines.join("\n");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${table}-candidates.md`), md);
  writeFileSync(join(outDir, `${table}-candidates.json`), JSON.stringify(report, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n");

  log.success(`Passing: ${passing.length} repos / ${passingItems} items → ${outDir}`);
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
