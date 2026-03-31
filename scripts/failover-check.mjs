#!/usr/bin/env node

/**
 * Local failover: check pipeline freshness AND yield, run collection if needed.
 * Designed to run via macOS launchd (hourly).
 * Two triggers:
 *   1. Stale: no pipeline_runs at all for >36h
 *   2. Dry: CI is running but inserting 0 articles for >24h
 * Reuses concurrency lock from run-pipeline.mjs — won't double-run with CI.
 */

import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

import { createAdminClient } from "./lib/supabase-admin.mjs";

const STALE_HOURS = 36;
const DRY_HOURS = 24; // trigger if 0 inserts for this long
const DRY_MIN_RUNS = 3; // need at least N runs to judge

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("[failover] No Supabase credentials, skipping.");
    return;
  }

  const supabase = createAdminClient();

  // Check 1: overall pipeline freshness
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("started_at, pipeline")
    .order("started_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`[failover] DB query failed: ${error.message}`);
    process.exit(1);
  }

  let reason = null;

  if (!data || data.length === 0) {
    reason = "no-runs";
    console.log("[failover] No pipeline runs found.");
  } else {
    const ageMs = Date.now() - new Date(data[0].started_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    console.log(`[failover] Last run: ${data[0].started_at} (${Math.round(ageHours)}h ago)`);

    if (ageHours >= STALE_HOURS) {
      reason = "stale";
      console.log(`[failover] Pipeline stale (>${STALE_HOURS}h).`);
    }
  }

  // Check 2: CI running but producing nothing (dry pipeline)
  if (!reason) {
    const cutoff = new Date(Date.now() - DRY_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentRuns, error: recentErr } = await supabase
      .from("pipeline_runs")
      .select("started_at, summary")
      .eq("pipeline", "sync-articles")
      .eq("status", "success")
      .gte("started_at", cutoff)
      .order("started_at", { ascending: false });

    if (!recentErr && recentRuns && recentRuns.length >= DRY_MIN_RUNS) {
      const totalInserted = recentRuns.reduce(
        (sum, r) => sum + (r.summary?.inserted ?? 0),
        0
      );
      console.log(
        `[failover] Last ${DRY_HOURS}h: ${recentRuns.length} sync runs, ${totalInserted} articles inserted.`
      );
      if (totalInserted === 0) {
        reason = "dry";
        console.log(
          `[failover] Dry pipeline: ${recentRuns.length} runs with 0 inserts in ${DRY_HOURS}h.`
        );
      }
    }
  }

  if (!reason) {
    console.log("[failover] Pipeline is healthy. No action needed.");
    return;
  }

  console.log(`[failover] Trigger: ${reason}. Starting local collection...`);


  // Dynamically import and run sync-articles
  // The concurrency lock in run-pipeline.mjs prevents double-run
  const { execSync } = await import("node:child_process");
  const scriptDir = new URL(".", import.meta.url).pathname;
  try {
    execSync("node sync-articles.mjs", {
      cwd: scriptDir,
      stdio: "inherit",
      timeout: 600_000, // 10 min max
    });
    console.log("[failover] Local collection completed.");
  } catch (e) {
    console.error(`[failover] Local collection failed: ${e.message}`);
    process.exit(1);
  }
}

main();
