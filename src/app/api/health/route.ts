import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";

export const revalidate = 300; // 5 min ISR cache

const STALE_HOURS = 36;
const DEGRADED_WINDOW_HOURS = 72;
const DEGRADED_MIN_RUNS = 3; // need at least N runs in window to judge a pipeline

interface PipelineRun {
  started_at: string;
  pipeline: string;
  status: string;
  summary: Record<string, unknown> | null;
}

// Scrape pipelines where summary.upserted === 0 across recent runs signals a dry pipeline
const SCRAPE_PIPELINES = new Set([
  "reddit-signals",
  "x-signals",
  "hn-signals",
  "scrape-signals",
  "sync-articles",
]);

export async function GET() {
  const supabase = createStaticClient();
  const windowStart = new Date(
    Date.now() - DEGRADED_WINDOW_HOURS * 3600 * 1000,
  ).toISOString();

  // pipeline_runs is not in generated types — cast to bypass TS
  const { data, error } = (await (
    supabase as ReturnType<typeof createStaticClient>
  )
    .from("pipeline_runs" as "articles")
    .select("started_at, pipeline, status, summary")
    .gte("started_at", windowStart)
    .order("started_at", { ascending: false })
    .limit(200)) as unknown as {
    data: PipelineRun[] | null;
    error: { message: string } | null;
  };

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 },
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { status: "stale", message: "No pipeline runs found", last_run: null },
      { status: 200 },
    );
  }

  const lastRun = data[0];
  const ageHours =
    (Date.now() - new Date(lastRun.started_at).getTime()) / (1000 * 60 * 60);
  const stale = ageHours >= STALE_HOURS;

  // Degraded detection: for each pipeline, take last N runs; flag if all failed or all dry
  const runsByPipeline = new Map<string, PipelineRun[]>();
  for (const r of data) {
    const list = runsByPipeline.get(r.pipeline) ?? [];
    if (list.length < DEGRADED_MIN_RUNS) list.push(r);
    runsByPipeline.set(r.pipeline, list);
  }

  const degraded: Array<{ pipeline: string; reason: string }> = [];
  for (const [pipeline, runs] of runsByPipeline) {
    if (runs.length < DEGRADED_MIN_RUNS) continue;

    if (runs.every((r) => r.status === "failed")) {
      degraded.push({
        pipeline,
        reason: `last ${DEGRADED_MIN_RUNS} runs all failed`,
      });
      continue;
    }

    if (SCRAPE_PIPELINES.has(pipeline)) {
      const allDry = runs.every((r) => {
        const upserted =
          typeof r.summary?.upserted === "number" ? r.summary.upserted : null;
        const relevant =
          typeof r.summary?.relevant === "number" ? r.summary.relevant : null;
        const inserted =
          typeof r.summary?.inserted === "number" ? r.summary.inserted : null;
        return (
          (upserted !== null && upserted === 0) ||
          (relevant !== null && relevant === 0 && upserted === null) ||
          (inserted !== null && inserted === 0)
        );
      });
      if (allDry)
        degraded.push({
          pipeline,
          reason: `last ${DEGRADED_MIN_RUNS} runs produced no data`,
        });
    }
  }

  const overall = stale ? "stale" : degraded.length > 0 ? "degraded" : "ok";
  const httpStatus = stale || degraded.length > 0 ? 503 : 200;

  return NextResponse.json(
    {
      status: overall,
      last_run: lastRun.started_at,
      pipeline: lastRun.pipeline,
      pipeline_status: lastRun.status,
      age_hours: Math.round(ageHours * 10) / 10,
      degraded,
    },
    { status: httpStatus },
  );
}
