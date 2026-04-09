import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Wrench, Newspaper, MessageCircle } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { fetchTrendingData } from "@/lib/trending-data";
import {
  PapersTrack,
  ToolsTrack,
  ArticlesTrack,
  CommunityTrack,
  TrackSection,
} from "@/components/trending/track-components";
import { SourceHealthBar } from "@/components/trending/source-health-bar";

export const revalidate = 300; // ISR: 5 min

export const metadata: Metadata = {
  title: "热度",
  description: "AI 开发者生态热度看板 — 论文、工具、资讯、社区四赛道每日热点。",
  openGraph: {
    title: "热度 | SkillNav",
    description: "AI 开发者生态热度看板",
    url: `${siteConfig.url}/trending`,
  },
  alternates: {
    canonical: `${siteConfig.url}/trending`,
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrendingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = params.period === "week" ? "week" : "today";
  const days = period === "week" ? 7 : 1;

  const { papers, tools, articles, communitySignals, health, trackUpdatedAt } =
    await fetchTrendingData(days);

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
            description="四赛道每日热点，数据驱动的生态脉搏"
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
            updatedAt={trackUpdatedAt.papers}
          >
            <PapersTrack papers={papers} />
          </TrackSection>

          <TrackSection
            icon={<Wrench className="h-5 w-5 text-emerald-500" />}
            title="工具"
            updatedAt={trackUpdatedAt.tools}
          >
            <ToolsTrack tools={tools} />
          </TrackSection>

          <TrackSection
            icon={<Newspaper className="h-5 w-5 text-orange-500" />}
            title="资讯"
            updatedAt={trackUpdatedAt.articles}
          >
            <ArticlesTrack articles={articles} />
          </TrackSection>

          <TrackSection
            icon={<MessageCircle className="h-5 w-5 text-purple-500" />}
            title="社区热议"
            updatedAt={trackUpdatedAt.community}
          >
            <CommunityTrack signals={communitySignals} />
          </TrackSection>
        </div>

        <SourceHealthBar health={health} />
      </div>
    </>
  );
}
