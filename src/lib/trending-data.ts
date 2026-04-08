import { createStaticClient } from "@/lib/supabase/static";
import { getTrendingTools, type TrendingTool } from "@/lib/get-trending-tools";

// ── Types ────────────────────────────────────────────────────────────

export interface HFPaper {
  id: string;
  title: string;
  title_zh: string | null;
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
  reddit: number;
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
  anthropic: "Anthropic 官方",
  openai: "OpenAI 官方",
  langchain: "LangChain 官方",
  github: "GitHub 博客",
  huggingface: "Hugging Face 官方",
  crewai: "CrewAI 官方",
  simonw: "Simon Willison 博客",
  "latent-space": "Latent Space 播客",
  thenewstack: "The New Stack 专栏",
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
          title_zh: null as string | null,
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
    .select("slug, title_zh, source_url")
    .eq("source", "arxiv")
    .eq("status", "published")
    .in(
      "source_url",
      arxivIds.map((id) => `https://arxiv.org/abs/${id}`),
    )
    .returns<{ slug: string; title_zh: string | null; source_url: string }[]>();

  const refMap = new Map<string, { slug: string; title_zh: string | null }>();
  for (const row of data ?? []) {
    const id = row.source_url.replace("https://arxiv.org/abs/", "");
    refMap.set(id, { slug: row.slug, title_zh: row.title_zh });
  }

  return papers.map((p) => ({
    ...p,
    translatedSlug: refMap.get(p.id)?.slug || null,
    title_zh: refMap.get(p.id)?.title_zh || null,
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
    .select("slug, title_zh, title, source, published_at, relevance_score")
    .eq("status", "published")
    .neq("source", "arxiv")
    .gte("published_at", since.toISOString())
    .order("relevance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(10)
    .returns<ArticleRow[]>();

  return data ?? [];
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
  const redditCount = signals.filter((s) => s.platform === "reddit").length;

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
    reddit: redditCount,
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
