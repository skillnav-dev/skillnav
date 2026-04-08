import { createStaticClient } from "@/lib/supabase/static";
import {
  getTrendingTools,
  type TrendingTool,
  type TrendingResult,
} from "@/lib/get-trending-tools";

// ── Types ────────────────────────────────────────────────────────────

export interface HFPaper {
  id: string;
  title: string;
  upvotes: number;
  org: string;
  githubRepo: string;
  translatedSlug: string | null;
}

export interface ArticleRow {
  slug: string;
  title_zh: string | null;
  title: string;
  source: string;
  published_at: string;
  relevance_score: number | null;
}

export interface CommunitySignal {
  platform: string;
  author_handle: string | null;
  title: string | null;
  content_summary: string | null;
  content_summary_zh: string | null;
  url: string;
  score: number;
  likes: number;
  comments: number;
}

export interface SourceHealth {
  rss: number;
  x: number;
  hn: number;
  hf: boolean;
  totalToday: number;
  lastUpdated: string | null;
}

export interface TrendingData {
  papers: HFPaper[];
  tools: TrendingTool[];
  articles: ArticleRow[];
  communitySignals: CommunitySignal[];
  health: SourceHealth;
}

// ── Source labels ────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  langchain: "LangChain",
  github: "GitHub",
  huggingface: "Hugging Face",
  crewai: "CrewAI",
  simonw: "Simon Willison",
  "latent-space": "Latent Space",
  thenewstack: "The New Stack",
};

// ── Data fetchers ───────────────────────────────────────────────────

async function fetchHFPapers(limit = 10): Promise<HFPaper[]> {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .sort(
        (
          a: { paper?: { upvotes?: number } },
          b: { paper?: { upvotes?: number } },
        ) => (b.paper?.upvotes || 0) - (a.paper?.upvotes || 0),
      )
      .slice(0, limit)
      .map(
        (item: {
          paper?: {
            id?: string;
            title?: string;
            upvotes?: number;
            organization?: { fullname?: string };
            githubRepo?: string;
          };
        }) => ({
          id: item.paper?.id || "",
          title: item.paper?.title || "",
          upvotes: item.paper?.upvotes || 0,
          org: item.paper?.organization?.fullname || "",
          githubRepo: item.paper?.githubRepo || "",
          translatedSlug: null,
        }),
      );
  } catch {
    return [];
  }
}

async function crossRefTranslated(papers: HFPaper[]): Promise<HFPaper[]> {
  if (!papers.length) return papers;
  const supabase = createStaticClient();
  const arxivIds = papers.map((p) => p.id);
  const { data } = await supabase
    .from("articles")
    .select("slug, source_url" as "slug")
    .eq("source" as "slug", "arxiv")
    .eq("status" as "slug", "published")
    .in(
      "source_url" as "slug",
      arxivIds.map((id) => `https://arxiv.org/abs/${id}`),
    );

  const slugMap = new Map<string, string>();
  for (const row of (data as unknown as {
    slug: string;
    source_url: string;
  }[]) ?? []) {
    const id = row.source_url.replace("https://arxiv.org/abs/", "");
    slugMap.set(id, row.slug);
  }

  return papers.map((p) => ({
    ...p,
    translatedSlug: slugMap.get(p.id) || null,
  }));
}

// Known monorepo github URLs — tools sharing these repos have inflated deltas
const MONOREPO_URLS = [
  "github.com/anthropics/skills",
  "github.com/openai/codex",
  "github.com/modelcontextprotocol/servers",
];

function dedupeMonorepo(tools: TrendingTool[]): TrendingTool[] {
  const seen = new Map<string, TrendingTool>();
  return tools.filter((t) => {
    if (MONOREPO_URLS.some((m) => t.url.includes(m))) return false;
    const repoKey = t.url.replace(/\/tree\/.*$/, "").replace(/\/$/, "");
    if (seen.has(repoKey)) return false;
    seen.set(repoKey, t);
    return true;
  });
}

async function fetchArticles(days: number): Promise<ArticleRow[]> {
  const supabase = createStaticClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("articles")
    .select(
      "slug, title_zh, title, source, published_at, relevance_score" as "slug",
    )
    .eq("status" as "slug", "published")
    .neq("source" as "slug", "arxiv")
    .gte("published_at" as "slug", since.toISOString())
    .order("relevance_score" as "created_at", { ascending: false })
    .order("published_at" as "created_at", { ascending: false })
    .limit(10);

  return (data as unknown as ArticleRow[]) ?? [];
}

async function fetchCommunitySignals(days: number): Promise<CommunitySignal[]> {
  const supabase = createStaticClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("community_signals")
    .select(
      "platform, author_handle, title, content_summary, content_summary_zh, url, score, likes, comments",
    )
    .eq("is_hidden", false)
    .gte("signal_date", sinceDate)
    .order("score", { ascending: false })
    .limit(30);

  return (data as CommunitySignal[]) ?? [];
}

async function fetchSourceHealth(
  papers: HFPaper[],
  articles: ArticleRow[],
  signals: CommunitySignal[],
): Promise<SourceHealth> {
  const supabase = createStaticClient();
  const sourcesSet = new Set(articles.map((a) => a.source));
  const xCount = signals.filter((s) => s.platform === "x").length;
  const hnCount = signals.filter((s) => s.platform === "hn").length;

  const { data: lastRun } = await supabase
    .from("pipeline_runs")
    .select("started_at")
    .order("started_at", { ascending: false })
    .limit(1)
    .returns<{ started_at: string }[]>();

  const lastUpdated = lastRun?.[0]?.started_at || null;

  return {
    rss: sourcesSet.size,
    x: xCount,
    hn: hnCount,
    hf: papers.length > 0,
    totalToday: articles.length + signals.length + papers.length,
    lastUpdated,
  };
}

// ── Main data loader ────────────────────────────────────────────────

export async function fetchTrendingData(days: number): Promise<TrendingData> {
  const supabase = createStaticClient();

  // Fetch all four tracks + cross-ref in parallel
  const [rawPapers, trendingResult, articles, communitySignals] =
    await Promise.all([
      fetchHFPapers(10),
      getTrendingTools(supabase, 20),
      fetchArticles(days),
      fetchCommunitySignals(days),
    ]);

  // These two depend on the above, run in parallel with each other
  const [papers, health] = await Promise.all([
    crossRefTranslated(rawPapers),
    fetchSourceHealth(rawPapers, articles, communitySignals),
  ]);

  const tools = dedupeMonorepo(trendingResult.tools).slice(0, 10);

  return { papers, tools, articles, communitySignals, health };
}
