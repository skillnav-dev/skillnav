import { createAdminClient } from "./supabase-admin.mjs";

let _startTime = null;
let _runId = null;

/** Call at script entry to record actual start time. */
export function markStart() {
  _startTime = Date.now();
}

/**
 * Claim a pipeline run in DB (INSERT with duration_s=null).
 * This enables concurrency lock detection in run-pipeline.mjs.
 * Returns the run ID, or null on failure. Never throws.
 */
export async function claimRun(pipeline) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return null;

  const startedAt = _startTime
    ? new Date(_startTime).toISOString()
    : new Date().toISOString();

  try {
    const supabase = createAdminClient();
    let timer;
    const result = await Promise.race([
      supabase.from("pipeline_runs").insert({
        pipeline,
        status: "success", // placeholder — updated by reportRun
        started_at: startedAt,
        duration_s: null, // null = running (lock signal)
        summary: {},
      }).select("id"),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("claim timeout")), 5000);
      }),
    ]);
    clearTimeout(timer);
    if (result?.error) {
      console.warn(`[report] Claim failed: ${result.error.message}`);
      return null;
    }
    _runId = result.data?.[0]?.id ?? null;
    return _runId;
  } catch (e) {
    console.warn(`[report] Claim skipped: ${e.message}`);
    return null;
  }
}

/**
 * Finalize a pipeline run in DB.
 * If claimRun was called, UPDATEs the existing record.
 * Otherwise, INSERTs a new record (backward compat).
 * 5s timeout. Never throws — failure is silently logged.
 */
export async function reportRun(
  pipeline,
  status,
  summary = {},
  errorMsg = null
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return;

  const now = Date.now();
  const durationS = _startTime
    ? parseFloat(((now - _startTime) / 1000).toFixed(1))
    : null;

  try {
    const supabase = createAdminClient();
    let timer;
    let result;

    if (_runId) {
      // Update the claimed record
      result = await Promise.race([
        supabase.from("pipeline_runs").update({
          status,
          summary,
          error_msg: errorMsg?.slice(0, 500) ?? null,
          duration_s: durationS,
        }).eq("id", _runId),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("report timeout")), 5000);
        }),
      ]);
    } else {
      // Fallback: single INSERT (no prior claim)
      const startedAt = _startTime
        ? new Date(_startTime).toISOString()
        : new Date(now).toISOString();
      result = await Promise.race([
        supabase.from("pipeline_runs").insert({
          pipeline,
          status,
          summary,
          error_msg: errorMsg?.slice(0, 500) ?? null,
          started_at: startedAt,
          duration_s: durationS,
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("report timeout")), 5000);
        }),
      ]);
    }

    clearTimeout(timer);
    if (result?.error) {
      console.warn(`[report] DB ${_runId ? "update" : "insert"} failed: ${result.error.message}`);
    }
  } catch (e) {
    console.warn(`[report] Pipeline run report skipped: ${e.message}`);
  }
}
