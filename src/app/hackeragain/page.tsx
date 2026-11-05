import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { HackerAgainGrid } from "@/components/hackeragain/hackeragain-grid";

export const metadata: Metadata = {
  title: "HN 灵感站导航",
  description:
    "精选 Hacker News 相关衍生站：视频、书、论文、电影、游戏、工具、播客、博客、代码库等，一站跳转。只做外链推荐，不托管站内资源。",
};

export default function HackerAgainPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "HN 灵感站", href: "/hackeragain" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="HN 灵感站导航"
          description="精选从 Hacker News 衍生出的视频、书、论文、电影、游戏、工具、播客、博客和代码库站点，点卡片即可跳转。本页只做外链推荐，不托管资源。"
        />
        <HackerAgainGrid />
      </div>
    </>
  );
}
