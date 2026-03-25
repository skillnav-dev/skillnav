#!/usr/bin/env node

/**
 * Local failover: check pipeline freshness, run collection if stale.
 * Designed to run via macOS launchd (hourly).
 * Uses pipeline_runs table (not GitHub API) to detect staleness.
 * Reuses concurrency lock from run-pipeline.mjs — won't double-run with CI.
 */

import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

import { createAdminClient } from "./lib/supabase-admin.mjs";

const STALE_HOURS = 36;

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("[failover] No Supabase credentials, skipping.");
    return;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("started_at, pipeline")
    .order("started_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`[failover] DB query failed: ${error.message}`);
    process.exit(1);
  }

  if (data && data.length > 0) {
    const ageMs = Date.now() - new Date(data[0].started_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    console.log(`[failover] Last run: ${data[0].started_at} (${Math.round(ageHours)}h ago)`);

    if (ageHours < STALE_HOURS) {
      console.log("[failover] Pipeline is fresh. No action needed.");
      return;
    }
    console.log(`[failover] Pipeline stale (>${STALE_HOURS}h). Starting local collection...`);
  } else {
    console.log("[failover] No pipeline runs found. Starting local collection...");
  }

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
