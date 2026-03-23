#!/usr/bin/env node

/**
 * Refresh tool metadata (stars, forks, activity) from GitHub GraphQL API.
 * Updates skills and mcp_servers tables with latest repo stats.
 *
 * Usage:
 *   node scripts/refresh-tool-metadata.mjs              # Daily: update stars/activity
 *   node scripts/refresh-tool-metadata.mjs --snapshot    # Weekly: write snapshot + trending
 *   node scripts/refresh-tool-metadata.mjs --dry-run     # Preview only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createAdminClient } from "./lib/supabase-admin.mjs";
import { githubGraphQLBatch } from "./lib/github.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("refresh");
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SNAPSHOT = args.includes("--snapshot");

// ─── Freshness classification ─────────────────────────────────────────

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

/**
 * Compute freshness status based on pushed_at and is_archived.
 * @param {string|null} pushedAt
 * @param {boolean} isArchived
 * @returns {'fresh'|'active'|'stale'|'archived'}
 */
function computeFreshness(pushedAt, isArchived) {
  if (isArchived) return "archived";
  if (!pushedAt) return "stale";
  const age = Date.now() - new Date(pushedAt).getTime();
  if (age < THIRTY_DAYS) return "fresh";
  if (age < SIX_MONTHS) return "active";
  return "stale";
}

// ─── GitHub URL parser ────────────────────────────────────────────────

/**
 * Extract owner/repo from a GitHub URL.
 * Handles standard and monorepo (tree/...) URLs.
 * @param {string} url
 * @returns {{ owner: string; repo: string } | null}
 */
function parseGithubUrl(url) {
  if (!url) return null;
  const match = url.match(
    /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// ─── DB helpers ───────────────────────────────────────────────────────

/**
 * Fetch all rows from a table with pagination.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} table
 * @param {string} selectFields
 * @returns {Promise<any[]>}
 */
async function fetchAllRows(supabase, table, selectFields) {
  const PAGE_SIZE = 1000;
  const allRows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectFields)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`DB read ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  validateEnv([
    "GITHUB_TOKEN",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);

  const supabase = createAdminClient();
  const stats = {
    skillsUpdated: 0,
    mcpUpdated: 0,
    skipped: 0,
    freshnessChanges: 0,
    trendingCount: 0,
    snapshotsWritten: 0,
    errors: 0,
  };

  // ── Step 1: Fetch skills with github_url ──────────────────────────

  log.info("Fetching skills from DB...");
  const skills = await fetchAllRows(
    supabase,
    "skills",
    "slug, github_url, stars, freshness, status"
  );

  // Filter to non-hidden skills with github_url
  const activeSkills = skills.filter(
    (s) => s.github_url && s.status !== "hidden"
  );
  log.info(`Found ${activeSkills.length} skills with GitHub URLs (of ${skills.length} total)`);

  // ── Step 2: Fetch MCP servers with github_url ─────────────────────

  let activeMcps = [];
  try {
    const mcps = await fetchAllRows(
      supabase,
      "mcp_servers",
      "slug, github_url, stars, freshness"
    );
    activeMcps = mcps.filter((m) => m.github_url);
    log.info(`Found ${activeMcps.length} MCP servers with GitHub URLs`);
  } catch {
    log.warn("mcp_servers table not found or empty — skipping MCP refresh");
  }

  // ── Step 3: Build repo list and batch query ───────────────────────

  /** @type {Map<string, { type: 'skill'|'mcp'; slug: string; oldStars: number; oldFreshness: string|null }>} */
  const repoMap = new Map();

  for (const s of activeSkills) {
    const parsed = parseGithubUrl(s.github_url);
    if (!parsed) {
      stats.skipped++;
      continue;
    }
    const key = `${parsed.owner}/${parsed.repo}`;
    if (!repoMap.has(key)) {
      repoMap.set(key, {
        type: "skill",
        slug: s.slug,
        oldStars: s.stars ?? 0,
        oldFreshness: s.freshness ?? null,
      });
    }
  }

  for (const m of activeMcps) {
    const parsed = parseGithubUrl(m.github_url);
    if (!parsed) {
      stats.skipped++;
      continue;
    }
    const key = `${parsed.owner}/${parsed.repo}`;
    if (!repoMap.has(key)) {
      repoMap.set(key, {
        type: "mcp",
        slug: m.slug,
        oldStars: m.stars ?? 0,
        oldFreshness: m.freshness ?? null,
      });
    }
  }

  const repos = [...repoMap.keys()].map((key) => {
    const [owner, repo] = key.split("/");
    return { owner, repo };
  });

  log.info(
    `Querying GitHub GraphQL for ${repos.length} unique repos...`
  );

  if (repos.length === 0) {
    log.warn("No repos to query. Exiting.");
    return;
  }

  const ghData = await githubGraphQLBatch(repos);
  log.success(`Got data for ${ghData.size} repos`);

  // ── Step 4: Update skills ─────────────────────────────────────────

  log.info("Updating skills...");
  for (const s of activeSkills) {
    const parsed = parseGithubUrl(s.github_url);
    if (!parsed) continue;
    const key = `${parsed.owner}/${parsed.repo}`;
    const gh = ghData.get(key);
    if (!gh) {
      stats.skipped++;
      continue;
    }

    const freshness = computeFreshness(gh.pushedAt, gh.isArchived);
    const oldFreshness = s.freshness ?? null;
    if (freshness !== oldFreshness) stats.freshnessChanges++;

    const updatePayload = {
      stars: gh.stargazerCount,
      forks_count: gh.forkCount,
      pushed_at: gh.pushedAt,
      is_archived: gh.isArchived,
      freshness,
      last_synced_at: new Date().toISOString(),
    };

    if (DRY_RUN) {
      log.info(
        `  [dry-run] skill ${s.slug}: stars ${s.stars ?? 0} -> ${gh.stargazerCount}, freshness: ${oldFreshness} -> ${freshness}`
      );
    } else {
      const { error } = await supabase
        .from("skills")
        .update(updatePayload)
        .eq("slug", s.slug);

      if (error) {
        log.error(`  Failed to update skill ${s.slug}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.skillsUpdated++;
  }

  // ── Step 5: Update MCP servers ────────────────────────────────────

  if (activeMcps.length > 0) {
    log.info("Updating MCP servers...");
    for (const m of activeMcps) {
      const parsed = parseGithubUrl(m.github_url);
      if (!parsed) continue;
      const key = `${parsed.owner}/${parsed.repo}`;
      const gh = ghData.get(key);
      if (!gh) {
        stats.skipped++;
        continue;
      }

      const freshness = computeFreshness(gh.pushedAt, gh.isArchived);
      const oldFreshness = m.freshness ?? null;
      if (freshness !== oldFreshness) stats.freshnessChanges++;

      const updatePayload = {
        stars: gh.stargazerCount,
        forks_count: gh.forkCount,
        pushed_at: gh.pushedAt,
        is_archived: gh.isArchived,
        freshness,
        last_synced_at: new Date().toISOString(),
      };

      if (DRY_RUN) {
        log.info(
          `  [dry-run] mcp ${m.slug}: stars ${m.stars ?? 0} -> ${gh.stargazerCount}, freshness: ${oldFreshness} -> ${freshness}`
        );
      } else {
        const { error } = await supabase
          .from("mcp_servers")
          .update(updatePayload)
          .eq("slug", m.slug);

        if (error) {
          log.error(`  Failed to update MCP ${m.slug}: ${error.message}`);
          stats.errors++;
          continue;
        }
      }
      stats.mcpUpdated++;
    }
  }

  // ── Step 6: Snapshot mode ─────────────────────────────────────────

  if (SNAPSHOT) {
    log.info("Writing snapshots...");

    const snapshotRows = [];

    // Skill snapshots
    for (const s of activeSkills) {
      const parsed = parseGithubUrl(s.github_url);
      if (!parsed) continue;
      const gh = ghData.get(`${parsed.owner}/${parsed.repo}`);
      if (!gh) continue;

      snapshotRows.push({
        tool_type: "skill",
        tool_slug: s.slug,
        stars_count: gh.stargazerCount,
        forks_count: gh.forkCount,
        pushed_at: gh.pushedAt,
      });
    }

    // MCP snapshots
    for (const m of activeMcps) {
      const parsed = parseGithubUrl(m.github_url);
      if (!parsed) continue;
      const gh = ghData.get(`${parsed.owner}/${parsed.repo}`);
      if (!gh) continue;

      snapshotRows.push({
        tool_type: "mcp",
        tool_slug: m.slug,
        stars_count: gh.stargazerCount,
        forks_count: gh.forkCount,
        pushed_at: gh.pushedAt,
      });
    }

    if (!DRY_RUN && snapshotRows.length > 0) {
      const { error } = await supabase
        .from("stars_snapshots")
        .upsert(snapshotRows, {
          onConflict: "tool_type,tool_slug,snapshot_date",
        });

      if (error) {
        log.error(`Failed to write snapshots: ${error.message}`);
        stats.errors++;
      } else {
        stats.snapshotsWritten = snapshotRows.length;
        log.success(`Wrote ${snapshotRows.length} snapshots`);
      }
    } else if (DRY_RUN) {
      log.info(`  [dry-run] Would write ${snapshotRows.length} snapshots`);
      stats.snapshotsWritten = snapshotRows.length;
    }

    // ── Step 7: Compute weekly delta and trending ─────────────────

    log.info("Computing weekly trending...");

    // Fetch last week's snapshots
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().slice(0, 10);

    const prevSnapshots = await fetchAllRows(
      supabase,
      "stars_snapshots",
      "tool_type, tool_slug, stars_count, snapshot_date"
    );
    // Filter to snapshots on or before last week (fetchAllRows handles pagination)
    const filteredSnapshots = prevSnapshots.filter(
      (s) => s.snapshot_date <= lastWeekStr
    );
    // Sort descending so the first occurrence per tool is the most recent
    filteredSnapshots.sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));
    const snapErr = null;

    if (snapErr) {
      log.error(`Failed to fetch previous snapshots: ${snapErr.message}`);
    } else {
      // Build a map of previous stars (most recent snapshot per tool)
      /** @type {Map<string, number>} */
      const prevStarsMap = new Map();
      for (const snap of filteredSnapshots) {
        const key = `${snap.tool_type}:${snap.tool_slug}`;
        if (!prevStarsMap.has(key)) {
          prevStarsMap.set(key, snap.stars_count);
        }
      }

      // Calculate delta and trending for skills
      for (const s of activeSkills) {
        const parsed = parseGithubUrl(s.github_url);
        if (!parsed) continue;
        const gh = ghData.get(`${parsed.owner}/${parsed.repo}`);
        if (!gh) continue;

        const prevStars = prevStarsMap.get(`skill:${s.slug}`);
        if (prevStars === undefined) continue;

        const delta = gh.stargazerCount - prevStars;
        const growthRate =
          prevStars > 0 ? (delta / prevStars) * 100 : 0;
        const isTrending = delta > 10 || growthRate > 5;

        if (isTrending) stats.trendingCount++;

        if (!DRY_RUN) {
          await supabase
            .from("skills")
            .update({
              weekly_stars_delta: delta,
              is_trending: isTrending,
            })
            .eq("slug", s.slug);
        } else {
          if (isTrending) {
            log.info(
              `  [dry-run] skill ${s.slug} TRENDING: delta=${delta}, growth=${growthRate.toFixed(1)}%`
            );
          }
        }
      }

      // Calculate delta and trending for MCP servers
      for (const m of activeMcps) {
        const parsed = parseGithubUrl(m.github_url);
        if (!parsed) continue;
        const gh = ghData.get(`${parsed.owner}/${parsed.repo}`);
        if (!gh) continue;

        const prevStars = prevStarsMap.get(`mcp:${m.slug}`);
        if (prevStars === undefined) continue;

        const delta = gh.stargazerCount - prevStars;
        const growthRate =
          prevStars > 0 ? (delta / prevStars) * 100 : 0;
        const isTrending = delta > 10 || growthRate > 5;

        if (isTrending) stats.trendingCount++;

        if (!DRY_RUN) {
          await supabase
            .from("mcp_servers")
            .update({
              weekly_stars_delta: delta,
              is_trending: isTrending,
            })
            .eq("slug", m.slug);
        }
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────

  const mode = DRY_RUN ? "[DRY RUN] " : "";
  const summaryLines = [
    `\n${mode}Refresh Summary:`,
    `  Skills updated: ${stats.skillsUpdated}`,
    `  MCP updated: ${stats.mcpUpdated}`,
    `  Skipped (no URL/data): ${stats.skipped}`,
    `  Freshness changes: ${stats.freshnessChanges}`,
    `  Errors: ${stats.errors}`,
  ];

  if (SNAPSHOT) {
    summaryLines.push(`  Snapshots written: ${stats.snapshotsWritten}`);
    summaryLines.push(`  Trending tools: ${stats.trendingCount}`);
  }

  log.summary(summaryLines.join("\n"));
  log.setOutput("skills_updated", stats.skillsUpdated);
  log.setOutput("mcp_updated", stats.mcpUpdated);
  log.setOutput("errors", stats.errors);
  log.done();
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
