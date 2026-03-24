import { NextRequest, NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";
import { getLatestBrief } from "@/lib/parse-brief";
import { getTrendingTools } from "@/lib/get-trending-tools";

export const revalidate = 300; // 5 min ISR cache

function errorResponse(
  code: string,
  message: string,
  status: number,
  fallback: unknown = null,
) {
  return NextResponse.json({ error: code, message, fallback }, { status });
}

function getTodayCST(): string {
  const now = new Date();
  // CST = UTC+8
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().slice(0, 10);
}

async function handleBrief(supabase: ReturnType<typeof createStaticClient>) {
  const today = getTodayCST();
  const brief = await getLatestBrief(supabase, today);
  if (!brief) {
    return errorResponse("NO_BRIEF", "No published brief available.", 404);
  }
  return NextResponse.json(brief);
}

async function handleMcp(
  supabase: ReturnType<typeof createStaticClient>,
  q: string,
  limit: number,
) {
  if (!q) {
    return errorResponse(
      "MISSING_QUERY",
      "Parameter q is required for type=mcp.",
      400,
    );
  }

  // PGroonga full-text search
  const { data: pgroongaResults, error: pgError } = await supabase
    .from("mcp_servers" as "skills")
    .select(
      "slug, name, name_zh, description_zh, category, editor_comment_zh, stars, install_command, github_url, quality_score" as "slug",
    )
    .eq("status" as "slug", "published")
    .textSearch("name" as "slug", q, { type: "websearch" })
    .order("quality_score" as "created_at", { ascending: false })
    .order("stars" as "created_at", { ascending: false })
    .limit(limit);

  type McpRow = {
    slug: string;
    name: string;
    name_zh: string | null;
    description_zh: string | null;
    category: string | null;
    editor_comment_zh: string | null;
    stars: number;
    install_command: string | null;
    github_url: string | null;
    quality_score: number | null;
  };

  let results = (pgroongaResults as unknown as McpRow[]) ?? [];
  let searchMethod = "pgroonga";

  // ILIKE fallback if PGroonga returns 0 results
  if (results.length === 0 || pgError) {
    const pattern = `%${q}%`;
    const { data: ilikeResults } = await supabase
      .from("mcp_servers" as "skills")
      .select(
        "slug, name, name_zh, description_zh, category, editor_comment_zh, stars, install_command, github_url, quality_score" as "slug",
      )
      .eq("status" as "slug", "published")
      .or(
        `name.ilike.${pattern},description.ilike.${pattern},tags.cs.{${q}}` as string,
      )
      .order("quality_score" as "created_at", { ascending: false })
      .order("stars" as "created_at", { ascending: false })
      .limit(limit);

    results = (ilikeResults as unknown as McpRow[]) ?? [];
    searchMethod = "ilike";
  }

  // If we hit the limit, there may be more matches
  const hasMore = results.length >= limit;

  return NextResponse.json({
    type: "mcp",
    query: q,
    returned: results.length,
    has_more: hasMore,
    search_method: searchMethod,
    results: results.map((r) => ({
      name: r.name,
      name_zh: r.name_zh,
      description_zh: r.description_zh,
      category: r.category,
      editor_comment_zh: r.editor_comment_zh,
      stars: r.stars,
      install_command: r.install_command,
      github_url: r.github_url,
      url: `https://skillnav.dev/mcp/${r.slug}`,
    })),
  });
}

async function handleTrending(
  supabase: ReturnType<typeof createStaticClient>,
  limit: number,
) {
  const result = await getTrendingTools(supabase, limit);
  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isNaN(rawLimit)
    ? 5
    : Math.min(Math.max(rawLimit, 1), 20);

  if (!type || !["brief", "mcp", "trending"].includes(type)) {
    return errorResponse(
      "INVALID_TYPE",
      "Parameter type must be one of: brief, mcp, trending.",
      400,
    );
  }

  const supabase = createStaticClient();

  try {
    switch (type) {
      case "brief":
        return await handleBrief(supabase);
      case "mcp":
        return await handleMcp(supabase, q, limit);
      case "trending":
        return await handleTrending(supabase, limit);
      default:
        return errorResponse("INVALID_TYPE", "Unknown type.", 400);
    }
  } catch (err) {
    console.error("[skill/query]", err);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred.",
      500,
    );
  }
}
