import type { Metadata } from "next";
import { siteConfig } from "@/lib/constants";
import { fetchTrendingData } from "@/lib/trending-data";
import { computeTopOne } from "./compute-top-one";
import { ThemeShell } from "./theme-shell";
import { Masthead } from "./masthead";
import { Hero } from "./hero";
import { MainFeed } from "./main-feed";
import { Aside } from "./aside";
import "./trending-v2.css";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "脉·Pulse — AI 热点聚合",
  description:
    "AI 行业每日热点聚合：论文 / 工具 / 资讯 / 社区 四赛道 · 今日跨赛道头条 · 热度风向",
  openGraph: {
    title: "脉·Pulse — AI 热点聚合 | SkillNav",
    description: "AI 开发者每日热点：论文 / 工具 / 资讯 / 社区",
    url: `${siteConfig.url}/trending-v2`,
  },
  alternates: { canonical: `${siteConfig.url}/trending-v2` },
};

export default async function TrendingV2Page() {
  const data = await fetchTrendingData(1);
  const top = computeTopOne(data);
  const excludeKey = topOneKey(top);

  const counts = {
    all:
      data.papers.length +
      data.tools.length +
      data.articles.length +
      data.communitySignals.length,
    paper: data.papers.length,
    tool: data.tools.length,
    news: data.articles.length,
    community: data.communitySignals.length,
  };

  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 3600_000);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const dateLabel = `${cst.getUTCFullYear()} / ${String(cst.getUTCMonth() + 1).padStart(2, "0")} / ${String(cst.getUTCDate()).padStart(2, "0")} · 周${weekdays[cst.getUTCDay()]}`;

  const liveSources = [
    data.health.hf && "HF",
    data.health.rss > 0 && "RSS",
    data.health.x > 0 && "X",
    data.health.hn > 0 && "HN",
    data.health.reddit > 0 && "Reddit",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ThemeShell>
      <Masthead
        counts={counts}
        dateLabel={dateLabel}
        pingLabel={liveSources ? `实时抓取中 · ${liveSources}` : "数据更新中"}
        totalLabel={`本期收录 ${counts.all} 条 · 经编辑筛选`}
      />

      <div className="v-page">
        <main>
          <Hero top={top} />
          <MainFeed
            papers={data.papers}
            tools={data.tools}
            articles={data.articles}
            signals={data.communitySignals}
            excludeKey={excludeKey}
          />
        </main>

        <Aside
          papers={data.papers}
          tools={data.tools}
          articles={data.articles}
          signals={data.communitySignals}
        />
      </div>

      <footer className="v-footer">
        <span>PULSE · AI TRENDING DAILY · SKILLNAV</span>
        <span>
          数据源：arXiv · HuggingFace · GitHub · HN · Reddit · X · RSS
        </span>
        <span>ISR · 5min</span>
      </footer>
    </ThemeShell>
  );
}

function topOneKey(top: ReturnType<typeof computeTopOne>): string | null {
  if (!top) return null;
  if (top.paper) return `paper:${top.paper.id}`;
  if (top.tool) return `tool:${top.tool.slug}`;
  if (top.article) return `news:${top.article.slug}`;
  if (top.signal) return `community:${top.signal.url}`;
  return null;
}
