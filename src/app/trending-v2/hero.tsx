import Link from "next/link";
import type { TopOne, TopOneTrack } from "./compute-top-one";

const TRACK_LABEL: Record<TopOneTrack, string> = {
  paper: "论文",
  tool: "工具",
  news: "资讯",
  community: "社区",
};

export function Hero({ top }: { top: TopOne | null }) {
  if (!top) {
    return (
      <section className="v-hero">
        <div className="v-hero-label">
          <span className="v-kicker">★ 今 日 跨 赛 道 头 条</span>
          <span className="v-rule" />
          <span className="v-meta">暂无数据</span>
        </div>
      </section>
    );
  }

  const variant = resolveVariant(top);

  return (
    <section className="v-hero">
      <div className="v-hero-label">
        <span className="v-kicker">★ 今 日 跨 赛 道 头 条</span>
        <span className="v-rule" />
        <span className="v-meta">
          TOP 1 · EDITOR&apos;S PICK · {TRACK_LABEL[top.track].toUpperCase()}
        </span>
      </div>

      <div className="v-hero-grid">
        <div>
          <div className="v-hero-track">
            <span className="v-chip">{TRACK_LABEL[top.track]}</span>
            {variant.kicker}
          </div>
          {variant.href ? (
            <Link href={variant.href}>
              <h1 className="v-hero-title">
                {renderTitleWithEn(variant.title)}
              </h1>
            </Link>
          ) : (
            <h1 className="v-hero-title">{renderTitleWithEn(variant.title)}</h1>
          )}
          {variant.dek && <p className="v-hero-dek">{variant.dek}</p>}
          <div className="v-hero-byline">
            {variant.byline.map((b, i) => (
              <div key={i}>
                <span className="k">{b.k}</span>
                <span className={b.big ? "v big" : "v"}>
                  {b.v}
                  {b.delta && <span className="delta">{b.delta}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="v-hero-visual">
          <div className="caption">{variant.visualCaption}</div>
          <div className="v-big-num">
            {String(top.rankInTrack).padStart(2, "0")}
            <sub>/ {String(top.totalInTrack).padStart(2, "0")}</sub>
          </div>
          <div className="tags">
            {variant.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Render a title: Latin words get wrapped in <span class="en"> for italic serif.
// Keeps the bundle's visual trick without demanding pre-formatted title strings.
function renderTitleWithEn(title: string) {
  const parts = title.split(
    /(\s+[A-Za-z][A-Za-z0-9\-.:]*(?:\s+[A-Za-z][A-Za-z0-9\-.:]*)*)/,
  );
  return parts.map((p, i) => {
    if (i % 2 === 1)
      return (
        <span key={i} className="en">
          {p}
        </span>
      );
    return <span key={i}>{p}</span>;
  });
}

interface HeroVariant {
  kicker: string;
  title: string;
  dek?: string;
  href?: string;
  byline: { k: string; v: string; big?: boolean; delta?: string }[];
  visualCaption: string;
  tags: string[];
}

function resolveVariant(top: TopOne): HeroVariant {
  if (top.track === "paper" && top.paper) {
    const p = top.paper;
    return {
      kicker: `arXiv ${p.id}${p.org ? ` · ${p.org}` : ""}`,
      title: p.title_zh || p.title,
      dek: p.title_zh ? p.title : "HuggingFace Daily Papers 今日精选",
      href: p.translatedSlug ? `/articles/${p.translatedSlug}` : undefined,
      byline: [
        { k: "热度指数", v: p.upvotes.toLocaleString(), big: true },
        { k: "来源", v: "HuggingFace Daily" },
        { k: "代码", v: p.githubRepo ? "GitHub 已开源" : "—" },
        { k: "中文翻译", v: p.translatedSlug ? "已上线" : "待译" },
      ],
      visualCaption: `arXiv · ${p.id}`,
      tags: splitTags(p.org, "LLM", "Paper"),
    };
  }
  if (top.track === "tool" && top.tool) {
    const t = top.tool;
    return {
      kicker: `${t.tool_type.toUpperCase()} · ${t.slug}`,
      title: t.name_zh || t.name,
      dek:
        t.editor_comment_zh ||
        `${t.tool_type === "skill" ? "Claude Skill" : "MCP Server"} · GitHub ${t.stars.toLocaleString()} ★`,
      href: `/${t.tool_type === "skill" ? "skills" : "mcp"}/${t.slug}`,
      byline: [
        {
          k: "周新增 Star",
          v: `+${t.weekly_stars_delta.toLocaleString()}`,
          big: true,
          delta: t.freshness ? `↗ ${t.freshness}` : undefined,
        },
        { k: "累计 Star", v: t.stars.toLocaleString() },
        {
          k: "类型",
          v: t.tool_type === "skill" ? "Claude Skill" : "MCP Server",
        },
        { k: "仓库", v: t.github_url ? "GitHub" : "—" },
      ],
      visualCaption: `GitHub · ${t.tool_type.toUpperCase()}`,
      tags: splitTags(t.tool_type.toUpperCase(), "Trending", "OSS"),
    };
  }
  if (top.track === "news" && top.article) {
    const a = top.article;
    return {
      kicker: `${a.source.toUpperCase()} · 资讯精选`,
      title: a.title_zh || a.title,
      dek: a.title_zh ? a.title : undefined,
      href: `/articles/${a.slug}`,
      byline: [
        {
          k: "相关度",
          v: (a.relevance_score ?? 0).toFixed(1),
          big: true,
        },
        { k: "来源", v: a.source },
        { k: "发布", v: formatRelative(a.published_at) },
        { k: "语言", v: a.title_zh ? "中文已译" : "原文" },
      ],
      visualCaption: `NEWS · ${a.source.toUpperCase()}`,
      tags: splitTags(a.source, "AI", "News"),
    };
  }
  if (top.track === "community" && top.signal) {
    const s = top.signal;
    return {
      kicker: `${s.platform.toUpperCase()}${s.author_handle ? ` · @${s.author_handle}` : ""}`,
      title:
        s.content_summary_zh ||
        s.title ||
        s.content_summary?.slice(0, 80) ||
        "社区热议",
      dek:
        s.content_summary && s.content_summary_zh
          ? s.content_summary.slice(0, 200)
          : undefined,
      href: s.url,
      byline: [
        { k: "热度", v: (s.score || s.likes).toLocaleString(), big: true },
        { k: "讨论", v: s.comments.toLocaleString() },
        { k: "平台", v: s.platform.toUpperCase() },
        { k: "作者", v: s.author_handle ? `@${s.author_handle}` : "—" },
      ],
      visualCaption: `COMMUNITY · ${s.platform.toUpperCase()}`,
      tags: splitTags(s.platform.toUpperCase(), "Discussion", "Live"),
    };
  }
  // Should not reach
  return {
    kicker: "",
    title: "暂无头条",
    byline: [],
    visualCaption: "—",
    tags: [],
  };
}

function splitTags(...parts: (string | null | undefined)[]): string[] {
  return parts.filter((p): p is string => !!p && p.length > 0).slice(0, 4);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "刚刚";
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
}
