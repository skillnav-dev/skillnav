import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";

export const revalidate = 300; // 5 min ISR cache

const STALE_HOURS = 36;

interface PipelineRun {
  started_at: string;
  pipeline: string;
  status: string;
}

export async function GET() {
  const supabase = createStaticClient();

  // pipeline_runs is not in generated types — cast to bypass TS
  const { data, error } = (await (
    supabase as ReturnType<typeof createStaticClient>
  )
    .from("pipeline_runs" as "articles")
    .select("started_at, pipeline, status")
    .order("started_at", { ascending: false })
    .limit(1)) as unknown as {
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
  const ageMs = Date.now() - new Date(lastRun.started_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  const healthy = ageHours < STALE_HOURS;

  return NextResponse.json({
    status: healthy ? "ok" : "stale",
    last_run: lastRun.started_at,
    pipeline: lastRun.pipeline,
    pipeline_status: lastRun.status,
    age_hours: Math.round(ageHours * 10) / 10,
  });
}
