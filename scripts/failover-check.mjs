#!/usr/bin/env node

/**
 * Local failover: check pipeline freshness AND yield, run collection if needed.
 * Designed to run via macOS launchd (hourly).
 * Triggers:
 *   1. Stale: no pipeline_runs at all for >36h → run sync-articles
 *   2. Dry sync-articles: 0 inserts for >24h → run sync-articles
 *   3. Dry community-signals (reddit/x/hn): 0 upserted across recent runs → log warning
 *      (no auto-trigger; community sources often blocked at IP/auth layer which local run won't fix)
 * Reuses concurrency lock from run-pipeline.mjs — won't double-run with CI.
 */

import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

import { createAdminClient } from "./lib/supabase-admin.mjs";

const STALE_HOURS = 36;
const DRY_HOURS = 24;
const DRY_MIN_RUNS = 3;

const COMMUNITY_PIPELINES = ["reddit-signals", "x-signals", "hn-signals"];

async function isPipelineDry(supabase, pipeline, metric) {
  const cutoff = new Date(Date.now() - DRY_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("started_at, status, summary")
    .eq("pipeline", pipeline)
    .gte("started_at", cutoff)
    .order("started_at", { ascending: false });

  if (error || !data || data.length < DRY_MIN_RUNS) return { dry: false, runs: data?.length ?? 0, total: 0 };

  const total = data.reduce((sum, r) => sum + (r.summary?.[metric] ?? 0), 0);
  return { dry: total === 0, runs: data.length, total };
}

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

  // Check 2: sync-articles dry (auto-trigger local run)
  if (!reason) {
    const { dry, runs, total } = await isPipelineDry(supabase, "sync-articles", "inserted");
    if (runs > 0) {
      console.log(`[failover] sync-articles last ${DRY_HOURS}h: ${runs} runs, ${total} inserted.`);
    }
    if (dry) {
      reason = "dry-sync";
      console.log(`[failover] Dry sync-articles: ${runs} runs with 0 inserts.`);
    }
  }

  // Check 3: community-signals dry (warn only, no auto-trigger)
  for (const pipeline of COMMUNITY_PIPELINES) {
    const { dry, runs, total } = await isPipelineDry(supabase, pipeline, "upserted");
    if (runs > 0) {
      console.log(`[failover] ${pipeline} last ${DRY_HOURS}h: ${runs} runs, ${total} upserted.`);
    }
    if (dry) {
      console.warn(
        `[failover] ⚠ DRY ${pipeline}: ${runs} runs with 0 upserted. Likely IP/auth issue — not auto-triggering local run.`
      );
    }
  }

  if (!reason) {
    console.log("[failover] No sync-articles action needed.");
    return;
  }

  console.log(`[failover] Trigger: ${reason}. Starting local sync-articles...`);

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
