import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Newspaper } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { getWeeklyArticles } from "@/lib/data";

export const metadata: Metadata = {
  title: "周刊",
  description:
    "SkillNav 周刊 — 每周精选 AI Agent 工具动态、实战技巧和生态洞察。",
};

export default async function WeeklyPage() {
  const issues = await getWeeklyArticles(50);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "周刊", href: "/weekly" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="周刊"
          description="每周精选 AI Agent 工具动态、实战技巧和生态洞察"
        />

        {issues.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Newspaper className="size-8 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">首期周刊即将发布</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              我们正在筹备第一期 SkillNav
              周刊，精选本周最值得关注的工具、教程和行业动态。
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/articles">先看看最新资讯</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <Link
                key={issue.id}
                href={`/weekly/${issue.slug}`}
                className="group rounded-xl border border-border/40 p-6 transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <time dateTime={issue.publishedAt}>
                    {new Date(issue.publishedAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  {issue.readingTime > 0 && (
                    <span className="ml-auto">{issue.readingTime} 分钟</span>
                  )}
                </div>
                <h2 className="mt-3 text-base font-semibold group-hover:text-primary">
                  {issue.titleZh ?? issue.title}
                </h2>
                {issue.summaryZh && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {issue.summaryZh}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
