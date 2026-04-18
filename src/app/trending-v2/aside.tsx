import Link from "next/link";
import type { HFPaper, ArticleRow, CommunitySignal } from "@/lib/trending-data";
import type { TrendingTool } from "@/lib/get-trending-tools";

interface Props {
  papers: HFPaper[];
  tools: TrendingTool[];
  articles: ArticleRow[];
  signals: CommunitySignal[];
}

export function Aside({ papers, tools, articles, signals }: Props) {
  const momentum = computeMomentum({ papers, tools, articles, signals });
  const tags = computeKeywords({ papers, tools, articles, signals });

  return (
    <aside className="v-aside">
      <div className="v-aside-block">
        <div className="v-aside-head">
          <h4>
            热度风向 <span className="en">Momentum</span>
          </h4>
        </div>
        {momentum.map((m) => (
          <div className="v-sparkrow" key={m.label}>
            <span className="v-sp-label">{m.label}</span>
            <span
              className="v-sp-bar"
              style={{ "--w": `${m.width}%` } as React.CSSProperties}
            />
            <span className="v-sp-val">{m.val}</span>
          </div>
        ))}
      </div>

      <div className="v-aside-block">
        <div className="v-aside-head">
          <h4>
            arXiv 今日 <span className="en">Daily</span>
          </h4>
          <Link href="/papers" className="more">
            {papers.length} 篇 →
          </Link>
        </div>
        {papers.slice(0, 5).map((p, i) => (
          <PaperRow key={p.id} paper={p} idx={i + 1} />
        ))}
      </div>

      <div className="v-aside-block">
        <div className="v-aside-head">
          <h4>
            热门工具 <span className="en">Trending</span>
          </h4>
          <Link href="/trending" className="more">
            {tools.length} →
          </Link>
        </div>
        {tools.slice(0, 5).map((t, i) => (
          <ToolRow key={t.slug} tool={t} idx={i + 1} />
        ))}
      </div>

      <div className="v-aside-block">
        <div className="v-aside-head">
          <h4>
            正在热议 <span className="en">Talking</span>
          </h4>
          <Link href="/trending-v2#community" className="more">
            {signals.length} 条 →
          </Link>
        </div>
        {signals.slice(0, 5).map((s, i) => (
          <SignalRow key={`${s.platform}-${i}`} signal={s} />
        ))}
      </div>

      {tags.length > 0 && (
        <div className="v-aside-block">
          <div className="v-aside-head">
            <h4>
              关键词云 <span className="en">Keywords</span>
            </h4>
          </div>
          <div className="v-tagcloud">
            {tags.map((t) => (
              <span key={t.tag} className={t.hot ? "hot" : undefined}>
                {t.tag}
                <span className="n" style={{ marginLeft: 4, opacity: 0.7 }}>
                  {t.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function PaperRow({ paper, idx }: { paper: HFPaper; idx: number }) {
  const href = paper.translatedSlug
    ? `/articles/${paper.translatedSlug}`
    : `https://arxiv.org/abs/${paper.id}`;
  const external = !paper.translatedSlug;
  const title = paper.title_zh || paper.title;
  const Inner = (
    <>
      <span className="ai">{String(idx).padStart(2, "0")}</span>
      <div className="at">
        {title}
        <span className="domain">{paper.id}</span>
      </div>
      <span className="av">{paper.upvotes}</span>
    </>
  );
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="v-aside-item"
    >
      {Inner}
    </a>
  ) : (
    <Link href={href} className="v-aside-item">
      {Inner}
    </Link>
  );
}

function ToolRow({ tool, idx }: { tool: TrendingTool; idx: number }) {
  const href = `/${tool.tool_type === "skill" ? "skills" : "mcp"}/${tool.slug}`;
  return (
    <Link href={href} className="v-aside-item">
      <span className="ai">{String(idx).padStart(2, "0")}</span>
      <div className="at">
        {tool.name_zh || tool.name}
        <span className="domain">{tool.tool_type.toUpperCase()}</span>
      </div>
      <span className="av">+{tool.weekly_stars_delta}</span>
    </Link>
  );
}

function SignalRow({ signal }: { signal: CommunitySignal }) {
  const title =
    signal.content_summary_zh ||
    signal.title ||
    signal.content_summary?.slice(0, 60) ||
    "—";
  const safe = signal.url.startsWith("http");
  const platformShort =
    { x: "X", hn: "HN", reddit: "RD" }[signal.platform] ||
    signal.platform.toUpperCase();
  const Inner = (
    <>
      <span className="ai">{platformShort}</span>
      <div className="at">{title}</div>
      <span className="av">
        {(signal.score || signal.likes).toLocaleString()}
      </span>
    </>
  );
  return safe ? (
    <a
      href={signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="v-aside-item"
    >
      {Inner}
    </a>
  ) : (
    <div className="v-aside-item">{Inner}</div>
  );
}

// ── Computed ──────────────────────────────────────────

interface Momentum {
  label: string;
  width: number;
  val: string;
}

function computeMomentum({ papers, tools, signals }: Props): Momentum[] {
  // Simple heuristic: count keyword occurrences across titles/summaries, scale to max.
  const keywords = ["Agent", "MCP", "RAG", "长上下文", "Diffusion", "评测"];
  const corpus = [
    ...papers.map((p) => `${p.title} ${p.title_zh || ""}`),
    ...tools.map(
      (t) => `${t.name} ${t.name_zh || ""} ${t.editor_comment_zh || ""}`,
    ),
    ...signals.map(
      (s) =>
        `${s.title || ""} ${s.content_summary_zh || ""} ${s.content_summary || ""}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  const counts = keywords.map((k) => ({
    label: k,
    count: matchCount(corpus, k.toLowerCase()),
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return counts
    .filter((c) => c.count > 0)
    .map((c) => ({
      label: c.label,
      width: Math.round((c.count / max) * 100),
      val: `${c.count} 次`,
    }));
}

function matchCount(corpus: string, needle: string): number {
  if (!needle) return 0;
  // Word-boundary for short English keys; substring for Chinese.
  if (/^[a-z0-9\-]+$/.test(needle) && needle.length <= 4) {
    const re = new RegExp(`\\b${needle}\\b`, "gi");
    return (corpus.match(re) || []).length;
  }
  let i = 0;
  let n = 0;
  while ((i = corpus.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

interface TagWeight {
  tag: string;
  count: number;
  hot: boolean;
}

function computeKeywords(props: Props): TagWeight[] {
  const pool = [
    "Agent",
    "MCP",
    "RAG",
    "长上下文",
    "Diffusion",
    "评测",
    "开源",
    "推理",
    "多模态",
    "芯片",
    "中文",
    "Python",
    "TypeScript",
  ];
  const corpus = [
    ...props.papers.map((p) => `${p.title} ${p.title_zh || ""}`),
    ...props.tools.map(
      (t) => `${t.name} ${t.name_zh || ""} ${t.editor_comment_zh || ""}`,
    ),
    ...props.articles.map((a) => `${a.title} ${a.title_zh || ""}`),
    ...props.signals.map(
      (s) => `${s.title || ""} ${s.content_summary_zh || ""}`,
    ),
  ]
    .join(" ")
    .toLowerCase();

  const weights = pool
    .map((tag) => ({ tag, count: matchCount(corpus, tag.toLowerCase()) }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count);

  const top2 = new Set(weights.slice(0, 2).map((w) => w.tag));
  return weights.map((w) => ({ ...w, hot: top2.has(w.tag) }));
}
