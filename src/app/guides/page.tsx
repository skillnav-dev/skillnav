import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, User, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { getGuideSeries } from "@/data/series";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `专栏 - ${siteConfig.name}`,
  description: "精选深度技术专栏，系统化学习 AI Agent 工程实践。",
};

export default function GuidesPage() {
  const series = getGuideSeries();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeader
        title="专栏"
        description="精选深度技术专栏，系统化学习 AI Agent 工程实践"
        as="h1"
      />

      <div className="mt-8 grid gap-6">
        {series.map((s) => (
          <Link
            key={s.slug}
            href={`/guides/${s.slug}`}
            className="group rounded-lg border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary">
                  {s.titleZh}
                </h2>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                {s.descriptionZh && (
                  <p className="text-muted-foreground">{s.descriptionZh}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
                  {s.author && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {s.author}
                    </span>
                  )}
                  {s.chapters && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {s.chapters.reduce(
                        (sum, ch) => sum + ch.range[1] - ch.range[0] + 1,
                        0,
                      )}{" "}
                      篇
                    </span>
                  )}
                  {s.sourceUrl && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" />
                      原文系列
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {series.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p>专栏内容筹备中，敬请期待。</p>
        </div>
      )}
    </div>
  );
}
