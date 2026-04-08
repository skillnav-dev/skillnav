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

const SKILL_FIELDS =
  "slug, name, name_zh, editor_comment_zh, stars, weekly_stars_delta, freshness, github_url" as "slug";
const MCP_FIELDS =
  "slug, name, name_zh, editor_comment_zh, stars, weekly_stars_delta, freshness, github_url" as "slug";

export async function getTrendingTools(
  supabase: SupabaseClient<Database>,
  limit = 10,
): Promise<TrendingResult> {
  const [{ data: skills }, { data: mcps }] = await Promise.all([
    supabase
      .from("skills")
      .select(SKILL_FIELDS)
      .gte("weekly_stars_delta" as "slug", 5)
      .eq("status" as "slug", "published")
      .order("weekly_stars_delta" as "created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("mcp_servers" as "skills")
      .select(MCP_FIELDS)
      .gte("weekly_stars_delta" as "slug", 5)
      .eq("status" as "slug", "published")
      .order("weekly_stars_delta" as "created_at", { ascending: false })
      .limit(limit),
  ]);

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

  const merged: TrendingTool[] = [
    ...((skills as unknown as RawRow[]) ?? []).map((s) => ({
      ...s,
      tool_type: "skill" as const,
      url: `https://skillnav.dev/skills/${s.slug}`,
    })),
    ...((mcps as unknown as RawRow[]) ?? []).map((m) => ({
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
