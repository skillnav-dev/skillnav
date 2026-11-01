import { createStaticClient } from "@/lib/supabase/static";

/** Source coverage recorded by scripts/generate-daily.mjs (daily_briefs.coverage). */
export interface CoverageSource {
  name: string;
  label: string;
  group: string;
  ok: boolean;
  count?: number;
}

export interface BriefCoverage {
  total: number;
  ok: number;
  generated_at?: string;
  sources: CoverageSource[];
}

function isCoverage(value: unknown): value is BriefCoverage {
  const v = value as BriefCoverage | null;
  return !!v && typeof v.ok === "number" && Array.isArray(v.sources);
}

/**
 * Coverage per brief date. Queried separately and failure-tolerant so that
 * pages keep working before the coverage column exists; briefs generated
 * before the column was added simply have no entry.
 */
export async function getBriefCoverage(
  dates: string[],
): Promise<Map<string, BriefCoverage>> {
  const map = new Map<string, BriefCoverage>();
  if (dates.length === 0) return map;

  const { data, error } = await createStaticClient()
    .from("daily_briefs" as "skills")
    .select("brief_date, coverage" as "slug")
    .in("brief_date" as "slug", dates);
  if (error || !data) return map;

  for (const row of data as unknown as {
    brief_date: string;
    coverage: unknown;
  }[]) {
    if (isCoverage(row.coverage)) map.set(row.brief_date, row.coverage);
  }
  return map;
}
