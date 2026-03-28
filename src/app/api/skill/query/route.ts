import { NextRequest, NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";
import {
  getLatestBrief,
  parsePapersFromBriefs,
  type BriefSection,
} from "@/lib/parse-brief";
import { getTrendingTools } from "@/lib/get-trending-tools";
import { SKILL_VERSION } from "@/lib/constants";
import { LEARN_CONCEPTS } from "@/data/learn";

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

const VALID_SECTIONS = ["news", "papers", "tools"] as const;

async function handleBrief(
  supabase: ReturnType<typeof createStaticClient>,
  section?: string,
) {
  const validSection = VALID_SECTIONS.includes(section as BriefSection & string)
    ? (section as BriefSection)
    : undefined;

  const today = getTodayCST();
  const brief = await getLatestBrief(supabase, today, validSection);
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

const ARXIV_ID_RE = /^\d{4}\.\d{4,5}(v\d+)?$/;

async function handlePaper(
  supabase: ReturnType<typeof createStaticClient>,
  id: string,
  q: string,
  limit: number,
) {
  // Mode 1: single paper by arXiv ID
  if (id) {
    if (!ARXIV_ID_RE.test(id)) {
      return errorResponse(
        "INVALID_ID",
        "Invalid arXiv ID format. Expected: YYMM.NNNNN (e.g., 2603.23483)",
        400,
      );
    }

    // Check articles table for full translation
    const arxivUrl = `https://arxiv.org/abs/${id}`;
    const { data: article } = await supabase
      .from("articles" as "skills")
      .select(
        "slug, title, title_zh, summary_zh, source, source_url, published_at, status" as "slug",
      )
      .eq("source_url" as "slug", arxivUrl)
      .limit(1)
      .single();

    type ArticleHit = {
      slug: string;
      title: string;
      title_zh: string | null;
      summary_zh: string | null;
      source: string | null;
      source_url: string | null;
      published_at: string | null;
      status: string;
    };

    const hit = article as unknown as ArticleHit | null;

    // Search recent briefs for导读卡
    const papers = await parsePapersFromBriefs(supabase, 7);
    const briefCard = papers.find((p) => p.url.includes(id));

    const hasTranslation = hit && hit.status === "published";

    return NextResponse.json({
      type: "paper",
      arxiv_id: id,
      has_translation: !!hasTranslation,
      brief_card: briefCard ?? null,
      translation: hasTranslation
        ? {
            title_zh: hit.title_zh,
            summary_zh: hit.summary_zh,
            url: `https://skillnav.dev/articles/${hit.slug}`,
          }
        : null,
      arxiv_url: arxivUrl,
    });
  }

  // Mode 2: keyword search across recent papers
  if (!q) {
    return errorResponse(
      "MISSING_PARAM",
      "Parameter id or q is required for type=paper.",
      400,
    );
  }

  const papers = await parsePapersFromBriefs(supabase, 7);
  const qLower = q.toLowerCase();
  const matched = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(qLower) ||
      p.what.toLowerCase().includes(qLower) ||
      p.implication.toLowerCase().includes(qLower) ||
      p.trend.toLowerCase().includes(qLower),
  );

  return NextResponse.json({
    type: "paper",
    query: q,
    days: 7,
    returned: Math.min(matched.length, limit),
    results: matched.slice(0, limit),
  });
}

async function handleSearch(
  supabase: ReturnType<typeof createStaticClient>,
  q: string,
  limit: number,
) {
  if (!q) {
    return errorResponse(
      "MISSING_QUERY",
      "Parameter q is required for type=search.",
      400,
    );
  }

  const pattern = `%${q}%`;
  const qLower = q.toLowerCase();

  // 1. Concepts — in-memory match (12 items)
  const concepts = LEARN_CONCEPTS.filter(
    (c) =>
      c.term.toLowerCase().includes(qLower) ||
      c.zh.includes(q) ||
      c.oneLiner.includes(q),
  ).map((c) => ({
    result_type: "concept" as const,
    term: c.term,
    zh: c.zh,
    one_liner: c.oneLiner,
    url: `https://skillnav.dev/learn/what-is-${c.slug}`,
  }));

  // 2. MCP + Skills — parallel ILIKE queries
  const [mcpRes, skillRes, articleRes] = await Promise.all([
    supabase
      .from("mcp_servers" as "skills")
      .select(
        "slug, name, name_zh, description_zh, category, editor_comment_zh, stars, install_command" as "slug",
      )
      .eq("status" as "slug", "published")
      .or(
        `name.ilike.${pattern},name_zh.ilike.${pattern},description.ilike.${pattern},description_zh.ilike.${pattern}` as string,
      )
      .order("stars" as "created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("skills")
      .select(
        "slug, name, name_zh, description_zh, category, editor_comment_zh, stars, install_command",
      )
      .eq("status", "published")
      .or(
        `name.ilike.${pattern},name_zh.ilike.${pattern},description.ilike.${pattern},description_zh.ilike.${pattern}`,
      )
      .order("stars", { ascending: false })
      .limit(limit),
    supabase
      .from("articles" as "skills")
      .select(
        "slug, title, title_zh, summary_zh, source, reading_time_minutes, published_at" as "slug",
      )
      .eq("status" as "slug", "published")
      .or(`title.ilike.${pattern},title_zh.ilike.${pattern}` as string)
      .order("published_at" as "created_at", { ascending: false })
      .limit(limit),
  ]);

  type ToolRow = {
    slug: string;
    name: string;
    name_zh: string | null;
    description_zh: string | null;
    category: string | null;
    editor_comment_zh: string | null;
    stars: number;
    install_command: string | null;
  };
  type ArticleRow = {
    slug: string;
    title: string;
    title_zh: string | null;
    summary_zh: string | null;
    source: string | null;
    reading_time_minutes: number | null;
    published_at: string | null;
  };

  const mcpResults = ((mcpRes.data as unknown as ToolRow[]) ?? []).map((r) => ({
    result_type: "mcp" as const,
    name: r.name,
    name_zh: r.name_zh,
    description_zh: r.description_zh,
    editor_comment_zh: r.editor_comment_zh,
    stars: r.stars,
    install_command: r.install_command,
    url: `https://skillnav.dev/mcp/${r.slug}`,
  }));

  const skillResults = ((skillRes.data as unknown as ToolRow[]) ?? []).map(
    (r) => ({
      result_type: "skill" as const,
      name: r.name,
      name_zh: r.name_zh,
      description_zh: r.description_zh,
      editor_comment_zh: r.editor_comment_zh,
      stars: r.stars,
      install_command: r.install_command,
      url: `https://skillnav.dev/skills/${r.slug}`,
    }),
  );

  const articleResults = (
    (articleRes.data as unknown as ArticleRow[]) ?? []
  ).map((r) => ({
    result_type: "article" as const,
    title_zh: r.title_zh ?? r.title,
    summary_zh: r.summary_zh,
    source: r.source,
    reading_time: r.reading_time_minutes,
    url: `https://skillnav.dev/articles/${r.slug}`,
  }));

  // Merge: concept > mcp > skill > article
  const results = [
    ...concepts,
    ...mcpResults,
    ...skillResults,
    ...articleResults,
  ].slice(0, limit);

  return NextResponse.json({
    type: "search",
    query: q,
    returned: results.length,
    results,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isNaN(rawLimit)
    ? 5
    : Math.min(Math.max(rawLimit, 1), 20);

  const validTypes = ["brief", "mcp", "trending", "paper", "search"];
  if (!type || !validTypes.includes(type)) {
    return errorResponse(
      "INVALID_TYPE",
      `Parameter type must be one of: ${validTypes.join(", ")}.`,
      400,
    );
  }

  const supabase = createStaticClient();

  try {
    let response: NextResponse;

    switch (type) {
      case "brief":
        response = await handleBrief(
          supabase,
          searchParams.get("section") ?? undefined,
        );
        break;
      case "mcp":
        response = await handleMcp(supabase, q, limit);
        break;
      case "trending":
        response = await handleTrending(supabase, limit);
        break;
      case "paper":
        response = await handlePaper(
          supabase,
          searchParams.get("id") ?? "",
          q,
          limit,
        );
        break;
      case "search":
        response = await handleSearch(supabase, q, limit);
        break;
      default:
        return errorResponse("INVALID_TYPE", "Unknown type.", 400);
    }

    // Inject meta.skill_version into all successful responses
    const body = await response.json();
    if (!body.error) {
      body.meta = { ...body.meta, skill_version: SKILL_VERSION };
    }
    return NextResponse.json(body, { status: response.status });
  } catch (err) {
    console.error("[skill/query]", err);
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred.",
      500,
    );
  }
}
