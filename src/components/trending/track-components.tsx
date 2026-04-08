import Link from "next/link";
import {
  ExternalLink,
  Star,
  TrendingUp,
  ArrowUp,
  Heart,
  MessageSquare,
} from "lucide-react";
import type { TrendingTool } from "@/lib/get-trending-tools";
import type {
  HFPaper,
  ArticleRow,
  CommunitySignal,
  SourceHealth,
} from "@/lib/trending-data";
import { SOURCE_LABELS } from "@/lib/trending-data";

// ── Shared ──────────────────────────────────────────────────────────

function EmptyTrack({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function TrackSection({
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

const RANK_STYLE =
  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary";
const CARD_STYLE =
  "flex items-start gap-3 rounded-lg border border-border/40 bg-card/50 p-3 transition-colors hover:bg-card";

// ── Papers ──────────────────────────────────────────────────────────

export function PapersTrack({ papers }: { papers: HFPaper[] }) {
  if (!papers.length) return <EmptyTrack message="今日暂无显著热点" />;
  return (
    <div className="space-y-3">
      {papers.map((p, i) => (
        <div key={p.id} className={CARD_STYLE}>
          <span className={RANK_STYLE}>{i + 1}</span>
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

// ── Tools ───────────────────────────────────────────────────────────

export function ToolsTrack({ tools }: { tools: TrendingTool[] }) {
  if (!tools.length) return <EmptyTrack message="今日暂无显著热点" />;
  return (
    <div className="space-y-3">
      {tools.map((t, i) => (
        <div key={t.slug} className={CARD_STYLE}>
          <span className={RANK_STYLE}>{i + 1}</span>
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

// ── Articles ────────────────────────────────────────────────────────

export function ArticlesTrack({ articles }: { articles: ArticleRow[] }) {
  if (!articles.length) return <EmptyTrack message="今日暂无显著热点" />;
  return (
    <div className="space-y-3">
      {articles.map((a, i) => (
        <div key={a.slug} className={CARD_STYLE}>
          <span className={RANK_STYLE}>{i + 1}</span>
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

// ── Community ───────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  x: "X/Twitter",
  hn: "Hacker News",
  reddit: "Reddit",
};

function isSafeUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://");
}

export function CommunityTrack({ signals }: { signals: CommunitySignal[] }) {
  if (!signals.length) return <EmptyTrack message="今日暂无显著热点" />;

  const byPlatform: Record<string, CommunitySignal[]> = {};
  for (const s of signals) {
    if (!byPlatform[s.platform]) byPlatform[s.platform] = [];
    byPlatform[s.platform].push(s);
  }

  return (
    <div className="space-y-4">
      {Object.entries(byPlatform).map(([platform, items]) => (
        <div key={platform}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {PLATFORM_LABELS[platform] || platform}
          </h4>
          <div className="space-y-2">
            {items.slice(0, 8).map((s, i) => {
              const href = isSafeUrl(s.url) ? s.url : "#";
              return (
                <a
                  key={`${platform}-${i}`}
                  href={href}
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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Source Health Bar ────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export function SourceHealthBar({ health }: { health: SourceHealth }) {
  const items = [
    { label: `${health.rss} 信息源`, ok: health.rss > 0 },
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
          覆盖 {health.totalToday} 条 · 最后更新 {timeAgo}
        </span>
      </div>
    </div>
  );
}
