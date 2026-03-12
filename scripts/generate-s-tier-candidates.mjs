#!/usr/bin/env node

/**
 * Generate S-tier candidate list from published MCP servers.
 *
 * Queries servers with stars >= threshold, outputs a JSON file for
 * editorial review and a console summary with distribution stats.
 *
 * Options:
 *   --min-stars N   Minimum stars threshold (default: 500)
 *
 * Examples:
 *   node scripts/generate-s-tier-candidates.mjs
 *   node scripts/generate-s-tier-candidates.mjs --min-stars 1000
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("s-tier");

// ── CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const starsIdx = args.indexOf("--min-stars");
const MIN_STARS = starsIdx !== -1 ? parseInt(args[starsIdx + 1], 10) : 500;

if (isNaN(MIN_STARS) || MIN_STARS < 0) {
  console.log("Usage: node scripts/generate-s-tier-candidates.mjs [--min-stars N]");
  console.log("  --min-stars N  Minimum stars threshold (default: 500)");
  process.exit(1);
}

// ── Constants ─────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;
const OUTPUT_PATH = resolve("data/s-tier-candidates.json");

// ── DB helpers ────────────────────────────────────────────────────────

/**
 * Fetch published servers with stars >= threshold.
 */
async function fetchHighStarServers(supabase, minStars) {
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("slug, name, stars, tools_count, category, github_url, description, source, is_verified")
      .eq("status", "published")
      .gte("stars", minStars)
      .order("stars", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`DB read: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ── Stats helpers ─────────────────────────────────────────────────────

/**
 * Compute stars distribution buckets.
 */
function starsDistribution(servers) {
  const buckets = {
    "10000+": 0,
    "5000-9999": 0,
    "2000-4999": 0,
    "1000-1999": 0,
    "500-999": 0,
    "< 500": 0,
  };

  for (const s of servers) {
    if (s.stars >= 10000) buckets["10000+"]++;
    else if (s.stars >= 5000) buckets["5000-9999"]++;
    else if (s.stars >= 2000) buckets["2000-4999"]++;
    else if (s.stars >= 1000) buckets["1000-1999"]++;
    else if (s.stars >= 500) buckets["500-999"]++;
    else buckets["< 500"]++;
  }

  return buckets;
}

/**
 * Count servers by source field.
 */
function sourceDistribution(servers) {
  const counts = {};
  for (const s of servers) {
    const src = s.source || "unknown";
    counts[src] = (counts[src] || 0) + 1;
  }
  return counts;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createAdminClient();

  log.info(`S-tier Candidate Generation — ${new Date().toISOString()}`);
  log.info(`Threshold: stars >= ${MIN_STARS}`);

  // ── Step 1: Fetch candidates ───────────────────────────────────────

  log.info("Fetching high-star published servers...");
  const candidates = await fetchHighStarServers(supabase, MIN_STARS);
  log.info(`Found ${candidates.length} candidates`);

  if (candidates.length === 0) {
    log.warn("No candidates found. Try lowering --min-stars threshold.");
    log.done();
    return;
  }

  // ── Step 2: Write JSON output ──────────────────────────────────────

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(candidates, null, 2) + "\n");
  log.success(`Written to ${OUTPUT_PATH}`);

  // ── Step 3: Console summary ────────────────────────────────────────

  const starsDist = starsDistribution(candidates);
  const sourceDist = sourceDistribution(candidates);

  const summaryLines = [
    `\nS-tier Candidates Summary:`,
    `  Total: ${candidates.length}`,
    `  Stars threshold: >= ${MIN_STARS}`,
    ``,
    `  Stars distribution:`,
  ];

  for (const [range, count] of Object.entries(starsDist)) {
    if (count > 0) {
      summaryLines.push(`    ${range}: ${count}`);
    }
  }

  summaryLines.push(``, `  Source distribution:`);
  // Sort sources by count desc
  const sortedSources = Object.entries(sourceDist).sort((a, b) => b[1] - a[1]);
  for (const [src, count] of sortedSources) {
    summaryLines.push(`    ${src}: ${count}`);
  }

  // Top 10 by stars
  summaryLines.push(``, `  Top 10 by stars:`);
  for (const s of candidates.slice(0, 10)) {
    const verified = s.is_verified ? " [verified]" : "";
    summaryLines.push(`    ${s.slug} (stars=${s.stars}, tools=${s.tools_count || 0})${verified}`);
  }

  log.summary(summaryLines.join("\n"));
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
