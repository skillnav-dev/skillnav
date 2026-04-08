import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

export interface TrendingTool {
  tool_type: "skill" | "mcp";
  slug: string;
  name: string;
  name_zh: string | null;
  editor_comment_zh: string | null;
  stars: number;
  weekly_stars_delta: number;
  freshness: string;
  url: string;
  github_url: string | null;
}

export interface TrendingResult {
  type: "trending";
  period: "7d";
  last_updated: string;
  tools: TrendingTool[];
}

type RawRow = {
  slug: string;
  name: string;
  name_zh: string | null;
  editor_comment_zh: string | null;
  stars: number;
  weekly_stars_delta: number;
  freshness: string;
  github_url: string | null;
};

const SELECT_FIELDS =
  "slug, name, name_zh, editor_comment_zh, stars, weekly_stars_delta, freshness, github_url";

// Use Supabase REST API directly for mcp_servers to avoid TypeScript type hack
// that caused runtime issues on CF Workers
async function fetchMcpTrending(limit: number): Promise<RawRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const params = new URLSearchParams({
    select: SELECT_FIELDS,
    status: "eq.published",
    weekly_stars_delta: "gte.1",
    github_url: "not.like.*modelcontextprotocol/servers*",
    order: "weekly_stars_delta.desc",
    limit: String(limit),
  });
  const res = await fetch(`${url}/rest/v1/mcp_servers?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getTrendingTools(
  supabase: SupabaseClient<Database>,
  limit = 10,
): Promise<TrendingResult> {
  const queryLimit = limit * 3;
  const [{ data: skills }, mcps] = await Promise.all([
    supabase
      .from("skills")
      .select(SELECT_FIELDS as "slug")
      .gte("weekly_stars_delta" as "slug", 5)
      .eq("status" as "slug", "published")
      .not("github_url" as "slug", "like", "%anthropics/skills%")
      .order("weekly_stars_delta" as "created_at", { ascending: false })
      .limit(queryLimit),
    fetchMcpTrending(queryLimit),
  ]);

  const merged: TrendingTool[] = [
    ...((skills as unknown as RawRow[]) ?? []).map((s) => ({
      ...s,
      tool_type: "skill" as const,
      url: `https://skillnav.dev/skills/${s.slug}`,
    })),
    ...mcps.map((m) => ({
      ...m,
      tool_type: "mcp" as const,
      url: `https://skillnav.dev/mcp/${m.slug}`,
    })),
  ]
    .sort((a, b) => b.weekly_stars_delta - a.weekly_stars_delta)
    .slice(0, limit);

  return {
    type: "trending",
    period: "7d",
    last_updated: new Date().toISOString(),
    tools: merged,
  };
}
