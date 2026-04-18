import Link from "next/link";
import type { HFPaper, ArticleRow, CommunitySignal } from "@/lib/trending-data";
import { SOURCE_LABELS } from "@/lib/trending-data";
import type { TrendingTool } from "@/lib/get-trending-tools";

interface Props {
  papers: HFPaper[];
  tools: TrendingTool[];
  articles: ArticleRow[];
  signals: CommunitySignal[];
  excludeKey: string | null;
}

export function MainFeed({
  papers,
  tools,
  articles,
  signals,
  excludeKey,
}: Props) {
  const kPaper = (p: HFPaper) => `paper:${p.id}`;
  const kTool = (t: TrendingTool) => `tool:${t.slug}`;
  const kArt = (a: ArticleRow) => `news:${a.slug}`;
  const kSig = (s: CommunitySignal) => `community:${s.url}`;

  const papersF = papers.filter((p) => kPaper(p) !== excludeKey);
  const toolsF = tools.filter((t) => kTool(t) !== excludeKey);
  const articlesF = articles.filter((a) => kArt(a) !== excludeKey);
  const signalsF = signals.filter((s) => kSig(s) !== excludeKey);

  let rank = 1;
  const nextRank = () => String(++rank).padStart(2, "0");

  return (
    <>
      <SectionHead
        id="papers"
        ord="I."
        title="研究前沿"
        tail={`PAPERS · ${papers.length} TODAY · ARXIV & HF`}
      />
      {papersF.slice(0, 2).map((p) => (
        <PaperItem key={p.id} paper={p} rank={nextRank()} withThumb={false} />
      ))}
      {papersF.length > 2 && (
        <>
          <MiniGroup
            title="其他精选论文"
            count={`· ${Math.max(papersF.length - 2, 0)} MORE`}
            hint="按热度排序"
          />
          <ul className="v-compact-list">
            {papersF.slice(2, 6).map((p) => (
              <PaperCompact key={p.id} paper={p} idx={nextRank()} />
            ))}
          </ul>
        </>
      )}

      <SectionHead
        id="tools"
        ord="II."
        title="工程与工具"
        tail={`TOOLS · ${tools.length} TODAY · GITHUB & MCP`}
      />
      {toolsF.slice(0, 2).map((t, i) => (
        <ToolItem key={t.slug} tool={t} rank={nextRank()} withThumb={i === 0} />
      ))}
      {toolsF.length > 2 && (
        <>
          <MiniGroup
            title="GitHub Trending · 今日"
            count={`· ${toolsF.length - 2} REPOS`}
            hint="按周新增 STAR"
          />
          <ul className="v-compact-list">
            {toolsF.slice(2, 6).map((t) => (
              <ToolCompact key={t.slug} tool={t} idx={nextRank()} />
            ))}
          </ul>
        </>
      )}

      <SectionHead
        id="news"
        ord="III."
        title="产业资讯"
        tail={`NEWS · ${articles.length} TODAY · CN & EN`}
      />
      {articlesF.slice(0, 2).map((a) => (
        <ArticleItem key={a.slug} article={a} rank={nextRank()} />
      ))}
      {articlesF.length > 2 && (
        <ul className="v-compact-list">
          {articlesF.slice(2, 6).map((a) => (
            <ArticleCompact key={a.slug} article={a} idx={nextRank()} />
          ))}
        </ul>
      )}

      <SectionHead
        id="community"
        ord="IV."
        title="社区热议"
        tail={`COMMUNITY · ${signals.length} THREADS · X / HN / REDDIT`}
      />
      {signalsF.slice(0, 1).map((s, i) => (
        <SignalItem key={`${s.platform}-${i}`} signal={s} rank={nextRank()} />
      ))}
      {signalsF.length > 1 && (
        <ul className="v-compact-list">
          {signalsF.slice(1, 5).map((s, i) => (
            <SignalCompact
              key={`${s.platform}-c-${i}`}
              signal={s}
              idx={nextRank()}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function SectionHead({
  id,
  ord,
  title,
  tail,
}: {
  id: string;
  ord: string;
  title: string;
  tail: string;
}) {
  return (
    <div id={id} className="v-section-head">
      <span className="v-ord">{ord}</span>
      <h2>{title}</h2>
      <span className="v-rule" />
      <span className="v-tail">{tail}</span>
    </div>
  );
}

function MiniGroup({
  title,
  count,
  hint,
}: {
  title: string;
  count: string;
  hint: string;
}) {
  return (
    <div className="v-mini-group">
      <h3>{title}</h3>
      <span className="cnt">{count}</span>
      <span className="v-rule" />
      <span className="cnt">{hint}</span>
    </div>
  );
}

// ── Paper ──────────────────────────────────────────────

function PaperItem({
  paper,
  rank,
}: {
  paper: HFPaper;
  rank: string;
  withThumb?: boolean;
}) {
  const href = paper.translatedSlug
    ? `/articles/${paper.translatedSlug}`
    : `https://arxiv.org/abs/${paper.id}`;
  const external = !paper.translatedSlug;

  return (
    <article className="v-feed-item">
      <div className="v-feed-rank">{rank}</div>
      <div>
        <div className="v-feed-meta">
          <span className="v-track-chip v-track-paper">论文</span>
          <span className="v-source">ARXIV {paper.id}</span>
          {paper.org && <span className="v-source">{paper.org}</span>}
          <span className="v-pill-tags">
            {paper.githubRepo && <span>有代码</span>}
            {paper.translatedSlug && <span>中文翻译</span>}
          </span>
        </div>
        <LinkOrAnchor href={href} external={external} className="v-feed-title">
          <h3 style={{ margin: 0 }}>{paper.title_zh || paper.title}</h3>
        </LinkOrAnchor>
        {paper.title_zh && (
          <p className="v-feed-summary" style={{ opacity: 0.75 }}>
            {paper.title}
          </p>
        )}
        <div className="v-feed-foot">
          <span className="v-stat">
            ♥ <span className="num">{paper.upvotes.toLocaleString()}</span>
          </span>
          {paper.org && <span className="v-stat">{paper.org}</span>}
        </div>
      </div>
    </article>
  );
}

function PaperCompact({ paper, idx }: { paper: HFPaper; idx: string }) {
  const href = paper.translatedSlug
    ? `/articles/${paper.translatedSlug}`
    : `https://arxiv.org/abs/${paper.id}`;
  const external = !paper.translatedSlug;
  return (
    <li className="v-compact-row">
      <span className="idx">{idx}</span>
      <div>
        <LinkOrAnchor href={href} external={external}>
          <p className="v-compact-title">{paper.title_zh || paper.title}</p>
        </LinkOrAnchor>
        <div className="v-compact-sub">
          <span>arXiv {paper.id}</span>
          {paper.org && <span>{paper.org}</span>}
          {paper.githubRepo && <span>Code</span>}
        </div>
      </div>
      <div className="v-compact-right">
        <span className="hot">{paper.upvotes}</span>
        <br />♥ upvotes
      </div>
    </li>
  );
}

// ── Tool ──────────────────────────────────────────────

function ToolItem({
  tool,
  rank,
}: {
  tool: TrendingTool;
  rank: string;
  withThumb?: boolean;
}) {
  const href = `/${tool.tool_type === "skill" ? "skills" : "mcp"}/${tool.slug}`;
  return (
    <article className="v-feed-item">
      <div className="v-feed-rank">{rank}</div>
      <div>
        <div className="v-feed-meta">
          <span className="v-track-chip v-track-tool">工具</span>
          <span className="v-source">
            {tool.tool_type === "skill" ? "SKILL" : "MCP"} · {tool.slug}
          </span>
          <span className="v-timestamp">{tool.freshness}</span>
        </div>
        <Link href={href}>
          <h3 className="v-feed-title" style={{ margin: 0 }}>
            <span className="en">{tool.slug}</span>
            {tool.name_zh && ` · ${tool.name_zh}`}
          </h3>
        </Link>
        {tool.editor_comment_zh && (
          <p className="v-feed-summary">{tool.editor_comment_zh}</p>
        )}
        <div className="v-feed-foot">
          <span className="v-stat">
            ★ <span className="num">{tool.stars.toLocaleString()}</span>
            {tool.weekly_stars_delta > 0 && (
              <span style={{ color: "var(--v-accent)" }}>
                {" "}
                +{tool.weekly_stars_delta} 本周
              </span>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

function ToolCompact({ tool, idx }: { tool: TrendingTool; idx: string }) {
  const href = `/${tool.tool_type === "skill" ? "skills" : "mcp"}/${tool.slug}`;
  return (
    <li className="v-compact-row">
      <span className="idx">{idx}</span>
      <div>
        <Link href={href}>
          <p className="v-compact-title">{tool.name_zh || tool.name}</p>
        </Link>
        <div className="v-compact-sub">
          <span>{tool.tool_type === "skill" ? "Skill" : "MCP"}</span>
          <span>{tool.slug}</span>
        </div>
      </div>
      <div className="v-compact-right">
        <span className="hot">+{tool.weekly_stars_delta}★</span>
        <br />
        total {tool.stars.toLocaleString()}
      </div>
    </li>
  );
}

// ── Article ───────────────────────────────────────────

function ArticleItem({ article, rank }: { article: ArticleRow; rank: string }) {
  return (
    <article className="v-feed-item">
      <div className="v-feed-rank">{rank}</div>
      <div>
        <div className="v-feed-meta">
          <span className="v-track-chip v-track-news">资讯</span>
          <span className="v-source">
            {SOURCE_LABELS[article.source] || article.source}
          </span>
          <span className="v-timestamp">
            {formatDate(article.published_at)}
          </span>
          {article.relevance_score != null && (
            <span className="v-pill-tags">
              <span>相关度 {article.relevance_score.toFixed(1)}</span>
            </span>
          )}
        </div>
        <Link href={`/articles/${article.slug}`}>
          <h3 className="v-feed-title" style={{ margin: 0 }}>
            {article.title_zh || article.title}
          </h3>
        </Link>
        {article.title_zh && article.title !== article.title_zh && (
          <p className="v-feed-summary" style={{ opacity: 0.75 }}>
            {article.title}
          </p>
        )}
      </div>
    </article>
  );
}

function ArticleCompact({
  article,
  idx,
}: {
  article: ArticleRow;
  idx: string;
}) {
  return (
    <li className="v-compact-row">
      <span className="idx">{idx}</span>
      <div>
        <Link href={`/articles/${article.slug}`}>
          <p className="v-compact-title">{article.title_zh || article.title}</p>
        </Link>
        <div className="v-compact-sub">
          <span>{SOURCE_LABELS[article.source] || article.source}</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
      </div>
      <div className="v-compact-right">
        {article.relevance_score != null && (
          <>
            <span className="hot">{article.relevance_score.toFixed(1)}</span>
            <br />
            相关度
          </>
        )}
      </div>
    </li>
  );
}

// ── Signal ────────────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
  x: "X / Twitter",
  hn: "Hacker News",
  reddit: "Reddit",
};

function SignalItem({
  signal,
  rank,
}: {
  signal: CommunitySignal;
  rank: string;
}) {
  const title =
    signal.content_summary_zh ||
    signal.title ||
    signal.content_summary?.slice(0, 80) ||
    "社区热议";
  const safe = isSafeUrl(signal.url);
  return (
    <article className="v-feed-item">
      <div className="v-feed-rank">{rank}</div>
      <div>
        <div className="v-feed-meta">
          <span className="v-track-chip v-track-comm">社区</span>
          <span className="v-source">
            {PLATFORM_LABEL[signal.platform] || signal.platform}
          </span>
          {signal.author_handle && (
            <span className="v-source">@{signal.author_handle}</span>
          )}
        </div>
        {safe ? (
          <a href={signal.url} target="_blank" rel="noopener noreferrer">
            <h3 className="v-feed-title" style={{ margin: 0 }}>
              {title}
            </h3>
          </a>
        ) : (
          <h3 className="v-feed-title" style={{ margin: 0 }}>
            {title}
          </h3>
        )}
        {signal.content_summary && signal.content_summary_zh && (
          <p className="v-feed-summary" style={{ opacity: 0.75 }}>
            {signal.content_summary.slice(0, 220)}
          </p>
        )}
        <div className="v-feed-foot">
          <span className="v-stat">
            ▲{" "}
            <span className="num">
              {(signal.score || signal.likes).toLocaleString()}
            </span>
          </span>
          <span className="v-stat">
            💬 <span className="num">{signal.comments}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function SignalCompact({
  signal,
  idx,
}: {
  signal: CommunitySignal;
  idx: string;
}) {
  const title =
    signal.content_summary_zh ||
    signal.title ||
    signal.content_summary?.slice(0, 60) ||
    "—";
  const safe = isSafeUrl(signal.url);
  return (
    <li className="v-compact-row">
      <span className="idx">{idx}</span>
      <div>
        {safe ? (
          <a href={signal.url} target="_blank" rel="noopener noreferrer">
            <p className="v-compact-title">{title}</p>
          </a>
        ) : (
          <p className="v-compact-title">{title}</p>
        )}
        <div className="v-compact-sub">
          <span>{PLATFORM_LABEL[signal.platform] || signal.platform}</span>
          {signal.author_handle && <span>@{signal.author_handle}</span>}
        </div>
      </div>
      <div className="v-compact-right">
        <span className="hot">
          {(signal.score || signal.likes).toLocaleString()}
        </span>
        <br />
        {signal.comments} 讨论
      </div>
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────

function LinkOrAnchor({
  href,
  external,
  className,
  children,
}: {
  href: string;
  external: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function isSafeUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
