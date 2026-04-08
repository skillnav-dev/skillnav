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

// Normalize github_url to repo-level key (strip /tree/... suffix)
function repoKey(url: string | null): string {
  if (!url) return "";
  return url.replace(/\/tree\/.*$/, "").replace(/\/$/, "");
}

// Keep only the top entry per repo (highest delta wins)
function dedupeByRepo(tools: TrendingTool[]): TrendingTool[] {
  const seen = new Set<string>();
  return tools.filter((t) => {
    const key = repoKey(t.github_url) || t.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getTrendingTools(
  supabase: SupabaseClient<Database>,
  limit = 10,
): Promise<TrendingResult> {
  const queryLimit = limit * 5;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [skillsResult, mcpResult] = await Promise.all([
    supabase
      .from("skills")
      .select(SELECT_FIELDS as "slug")
      .gte("weekly_stars_delta" as "slug", 1)
      .eq("status" as "slug", "published")
      .order("weekly_stars_delta" as "created_at", { ascending: false })
      .limit(queryLimit),
    sb
      .from("mcp_servers")
      .select(SELECT_FIELDS)
      .gte("weekly_stars_delta", 1)
      .eq("status", "published")
      .order("weekly_stars_delta", { ascending: false })
      .limit(queryLimit),
  ]);

  const skills = skillsResult.data;
  const mcps = mcpResult.data;

  if (mcpResult.error) {
    console.error(
      "[trending] MCP query error:",
      JSON.stringify(mcpResult.error),
    );
  }

  // Dedupe each track by repo, then compose: half skills + half MCPs
  const half = Math.ceil(limit / 2);

  const dedupedSkills = dedupeByRepo(
    ((skills as unknown as RawRow[]) ?? []).map((s) => ({
      ...s,
      tool_type: "skill" as const,
      url: `https://skillnav.dev/skills/${s.slug}`,
    })),
  ).slice(0, half);

  const dedupedMcps = dedupeByRepo(
    ((mcps as RawRow[]) ?? []).map((m) => ({
      ...m,
      tool_type: "mcp" as const,
      url: `https://skillnav.dev/mcp/${m.slug}`,
    })),
  ).slice(0, half);

  // Merge, sort by delta, trim to limit
  const merged = [...dedupedSkills, ...dedupedMcps]
    .sort((a, b) => b.weekly_stars_delta - a.weekly_stars_delta)
    .slice(0, limit);

  return {
    type: "trending",
    period: "7d",
    last_updated: new Date().toISOString(),
    tools: merged,
  };
}
