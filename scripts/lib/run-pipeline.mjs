import { markStart, claimRun, reportRun } from "./report-run.mjs";
import { createAdminClient } from "./supabase-admin.mjs";

const LOCK_WINDOW_MIN = 30; // skip if another run started within 30min

/**
 * Check pipeline_runs for an active (unfinished) run of the same pipeline.
 * A run is "active" if duration_s is null and started within LOCK_WINDOW_MIN.
 * Returns true if the pipeline is locked (should skip).
 */
async function isPipelineLocked(pipeline) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - LOCK_WINDOW_MIN * 60_000).toISOString();
    const { data, error } = await supabase
      .from("pipeline_runs")
      .select("id, started_at")
      .eq("pipeline", pipeline)
      .is("duration_s", null)
      .gte("started_at", cutoff)
      .limit(1);
    if (error) {
      console.warn(`[lock] Failed to check lock: ${error.message}`);
      return false; // fail open — don't block on lock check failure
    }
    return data && data.length > 0;
  } catch (e) {
    console.warn(`[lock] Lock check error: ${e.message}`);
    return false;
  }
}

/**
 * Universal pipeline runner.
 *
 * main() should return:
 *   { pipeline?, status, summary, errorMsg?, exitCode }
 *
 * On throw, catches and reports as failure.
 * dry-run skips DB reporting and lock check.
 */
export async function runPipeline(
  mainFn,
  { logger, defaultPipeline, dryRunFlag = "--dry-run" }
) {
  markStart();
  const dryRun = process.argv.includes(dryRunFlag);
  const pipeline = defaultPipeline;

  // Concurrency lock: skip if another instance is running
  if (!dryRun) {
    const locked = await isPipelineLocked(pipeline);
    if (locked) {
      logger.warn(`Pipeline "${pipeline}" is already running (started within ${LOCK_WINDOW_MIN}min). Skipping.`);
      logger.done();
      return;
    }
    // Claim the run (INSERT with duration_s=null) so other instances see the lock
    await claimRun(pipeline);
  }

  let result;

  try {
    result = await mainFn();
    if (!result)
      result = { status: "success", summary: {}, exitCode: 0 };
  } catch (e) {
    logger.error(e.message);
    result = {
      status: "failure",
      summary: {},
      errorMsg: e.message,
      exitCode: 1,
    };
  }

  const finalPipeline = result.pipeline || pipeline;

  if (!dryRun) {
    await reportRun(
      finalPipeline,
      result.status,
      result.summary || {},
      result.errorMsg || null
    );
  }

  logger.done();
  if (result.exitCode) process.exit(result.exitCode);
}
