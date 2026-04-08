import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Wrench,
  Newspaper,
  MessageCircle,
  ExternalLink,
  Star,
  TrendingUp,
  ArrowUp,
  Heart,
  MessageSquare,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { createStaticClient } from "@/lib/supabase/static";
import { getTrendingTools, type TrendingTool } from "@/lib/get-trending-tools";

export const revalidate = 300; // ISR: 5 min

export const metadata: Metadata = {
  title: "热度",
  description: "AI 开发者生态热度看板 — 论文、工具、资讯、社区四赛道实时热点。",
  openGraph: {
    title: "热度 | SkillNav",
    description: "AI 开发者生态热度看板",
    url: `${siteConfig.url}/trending`,
  },
  alternates: {
    canonical: `${siteConfig.url}/trending`,
  },
};

// ── Types ────────────────────────────────────────────────────────────

interface HFPaper {
  id: string;
  title: string;
  upvotes: number;
  org: string;
  githubRepo: string;
  translatedSlug: string | null;
}

interface ArticleRow {
  slug: string;
  title_zh: string | null;
  title: string;
  source: string;
  published_at: string;
  relevance_score: number | null;
}

interface CommunitySignal {
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

// ── Source labels ────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
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
    // Skip known monorepos entirely
    if (MONOREPO_URLS.some((m) => t.url.includes(m))) return false;
    // Dedupe by github URL prefix (same repo → keep highest delta)
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
    .from("community_signals" as "skills")
    .select(
      "platform, author_handle, title, content_summary, content_summary_zh, url, score, likes, comments" as "slug",
    )
    .eq("is_hidden" as "slug", false)
    .gte("signal_date" as "slug", sinceDate)
    .order("score" as "created_at", { ascending: false })
    .limit(30);

  return (data as unknown as CommunitySignal[]) ?? [];
}

// ── Track Components ────────────────────────────────────────────────

function PapersTrack({ papers }: { papers: HFPaper[] }) {
  if (!papers.length) {
    return <EmptyTrack message="今日暂无显著热点" />;
  }
  return (
    <div className="space-y-3">
      {papers.map((p, i) => (
        <div
          key={p.id}
          className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:bg-card"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {p.translatedSlug ? (
                <Link
                  href={`/papers/${p.translatedSlug}`}
                  className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
                >
                  {p.title}
                </Link>
              ) : (
                <a
                  href={`https://arxiv.org/abs/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
                >
                  {p.title}
                  <ExternalLink className="ml-1 inline h-3 w-3 text-muted-foreground" />
                </a>
              )}
              <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <ArrowUp className="h-3 w-3" />
                {p.upvotes}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {p.org && <span>{p.org}</span>}
              {p.githubRepo && (
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">
                  有代码
                </span>
              )}
              {p.translatedSlug && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                  中文翻译
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToolsTrack({ tools }: { tools: TrendingTool[] }) {
  if (!tools.length) {
    return <EmptyTrack message="今日暂无显著热点" />;
  }
  return (
    <div className="space-y-3">
      {tools.map((t, i) => (
        <div
          key={t.slug}
          className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:bg-card"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/${t.tool_type === "skill" ? "skills" : "mcp"}/${t.slug}`}
                className="text-sm font-medium leading-snug hover:text-primary"
              >
                {t.name_zh || t.name}
              </Link>
              <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />+{t.weekly_stars_delta}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 uppercase">
                {t.tool_type}
              </span>
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3" />
                {t.stars.toLocaleString()}
              </span>
              {t.editor_comment_zh && (
                <span className="line-clamp-1">{t.editor_comment_zh}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticlesTrack({ articles }: { articles: ArticleRow[] }) {
  if (!articles.length) {
    return <EmptyTrack message="今日暂无显著热点" />;
  }
  return (
    <div className="space-y-3">
      {articles.map((a, i) => (
        <div
          key={a.slug}
          className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:bg-card"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/articles/${a.slug}`}
              className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
            >
              {a.title_zh || a.title}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{SOURCE_LABELS[a.source] || a.source}</span>
              <span>
                {new Date(a.published_at).toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityTrack({ signals }: { signals: CommunitySignal[] }) {
  if (!signals.length) {
    return <EmptyTrack message="今日暂无显著热点" />;
  }

  const byPlatform: Record<string, CommunitySignal[]> = {};
  for (const s of signals) {
    if (!byPlatform[s.platform]) byPlatform[s.platform] = [];
    byPlatform[s.platform].push(s);
  }

  const platformLabel: Record<string, string> = {
    x: "X/Twitter",
    hn: "Hacker News",
    reddit: "Reddit",
  };

  return (
    <div className="space-y-4">
      {Object.entries(byPlatform).map(([platform, items]) => (
        <div key={platform}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {platformLabel[platform] || platform}
          </h4>
          <div className="space-y-2">
            {items.slice(0, 8).map((s, i) => (
              <a
                key={`${platform}-${i}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:bg-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-snug">
                    {platform === "x" ? (
                      <>
                        <span className="font-medium text-primary">
                          @{s.author_handle}
                        </span>{" "}
                        {s.content_summary_zh ||
                          s.content_summary?.slice(0, 120)}
                      </>
                    ) : (
                      <span className="font-medium">
                        {s.content_summary_zh || s.title}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {platform === "x" ? (
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" />
                        {s.likes}
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <ArrowUp className="h-3 w-3" />
                        {s.score}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" />
                      {s.comments}
                    </span>
                  </div>
                </div>
                <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTrack({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TrackSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

// ── Source Health Bar ────────────────────────────────────────────────

interface SourceHealth {
  rss: number;
  newsletters: number;
  x: number;
  hn: number;
  hf: boolean;
  totalToday: number;
  lastUpdated: string | null;
}

async function fetchSourceHealth(
  papers: HFPaper[],
  articles: ArticleRow[],
  signals: CommunitySignal[],
): Promise<SourceHealth> {
  const supabase = createStaticClient();

  // Count distinct article sources as proxy for RSS health
  const sourcesSet = new Set(articles.map((a) => a.source));

  // Count community signal platforms
  const xCount = signals.filter((s) => s.platform === "x").length;
  const hnCount = signals.filter((s) => s.platform === "hn").length;

  // Last pipeline run
  const { data: lastRun } = await supabase
    .from("pipeline_runs" as "skills")
    .select("started_at" as "slug")
    .order("started_at" as "created_at", { ascending: false })
    .limit(1);

  const lastUpdated =
    (lastRun as unknown as { started_at: string }[])?.[0]?.started_at || null;

  return {
    rss: sourcesSet.size,
    newsletters: 5,
    x: xCount,
    hn: hnCount,
    hf: papers.length > 0,
    totalToday: articles.length + signals.length + papers.length,
    lastUpdated,
  };
}

function SourceHealthBar({ health }: { health: SourceHealth }) {
  const items = [
    { label: `${health.rss} RSS`, ok: health.rss > 0 },
    { label: "5 Newsletter", ok: health.newsletters > 0 },
    { label: `X ${health.x}条`, ok: health.x > 0 },
    { label: `HN ${health.hn}条`, ok: health.hn > 0 },
    { label: "HF Papers", ok: health.hf },
  ];

  const timeAgo = health.lastUpdated
    ? formatTimeAgo(new Date(health.lastUpdated))
    : "未知";

  return (
    <div className="mt-10 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">感知网络</span>
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${item.ok ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {item.label}
          </span>
        ))}
        <span className="ml-auto">
          今日 {health.totalToday} 条 · 最后更新 {timeAgo}
        </span>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

// ── Page ─────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = params.period === "week" ? "week" : "today";
  const days = period === "week" ? 7 : 1;

  const supabase = createStaticClient();

  // Fetch all four tracks in parallel
  const [rawPapers, trendingResult, articles, communitySignals] =
    await Promise.all([
      fetchHFPapers(10),
      getTrendingTools(supabase, 20),
      fetchArticles(days),
      fetchCommunitySignals(days),
    ]);

  const papers = await crossRefTranslated(rawPapers);
  const tools = dedupeMonorepo(trendingResult.tools).slice(0, 10);
  const health = await fetchSourceHealth(papers, articles, communitySignals);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "热度", href: "/trending" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            as="h1"
            title="AI 开发者生态热度"
            description="四赛道实时热点，数据驱动的生态脉搏"
          />
          <div className="flex shrink-0 gap-1 rounded-lg border border-border/60 p-0.5">
            <Link
              href="/trending"
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                period === "today"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              今日
            </Link>
            <Link
              href="/trending?period=week"
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                period === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              本周
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <TrackSection
            icon={<FileText className="h-5 w-5 text-blue-500" />}
            title="论文"
          >
            <PapersTrack papers={papers} />
          </TrackSection>

          <TrackSection
            icon={<Wrench className="h-5 w-5 text-emerald-500" />}
            title="工具"
          >
            <ToolsTrack tools={tools} />
          </TrackSection>

          <TrackSection
            icon={<Newspaper className="h-5 w-5 text-orange-500" />}
            title="资讯"
          >
            <ArticlesTrack articles={articles} />
          </TrackSection>

          <TrackSection
            icon={<MessageCircle className="h-5 w-5 text-purple-500" />}
            title="社区热议"
          >
            <CommunityTrack signals={communitySignals} />
          </TrackSection>
        </div>

        <SourceHealthBar health={health} />
      </div>
    </>
  );
}
