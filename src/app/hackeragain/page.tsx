import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { HackerAgainGrid } from "@/components/hackeragain/hackeragain-grid";
import { hackerAgainSites } from "@/data/hackeragain-sites";

export const metadata: Metadata = {
  title: "HN 灵感站聚合导航",
  description:
    "中文版 HackerAgain：Hacker News 灵感衍生站的「索引的索引」。外链导航视频、书、论文、电影、工具、播客等，标出 MCP 与数据包；不镜像第三方数据。",
};

export default function HackerAgainPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "HN 聚合导航", href: "/hackeragain" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="HN 灵感站聚合导航"
          description={`这是 Hacker News 灵感衍生站的「索引的索引」——灵感来自 HackerAgain，收录与中文文案由 SkillNav 自编；只做外链导航，不镜像第三方整站数据。当前收录 ${hackerAgainSites.length} 站。`}
        />
        <HackerAgainGrid />
      </div>
    </>
  );
}
