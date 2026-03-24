import { createAdminClient } from "./supabase-admin.mjs";

let _startTime = null;

/** Call at script entry to record actual start time. */
export function markStart() {
  _startTime = Date.now();
}

/**
 * Report pipeline run to DB. Single INSERT with computed duration.
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
  const startedAt = _startTime
    ? new Date(_startTime).toISOString()
    : new Date(now).toISOString();
  const durationS = _startTime
    ? parseFloat(((now - _startTime) / 1000).toFixed(1))
    : null;

  try {
    const supabase = createAdminClient();
    let timer;
    const result = await Promise.race([
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
    clearTimeout(timer);
    if (result?.error) {
      console.warn(`[report] DB insert failed: ${result.error.message}`);
    }
  } catch (e) {
    console.warn(`[report] Pipeline run report skipped: ${e.message}`);
  }
}
