import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Newspaper } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { createStaticClient } from "@/lib/supabase/static";
import { siteConfig } from "@/lib/constants";

export const revalidate = 300; // 5 min ISR

export const metadata: Metadata = {
  title: "日报",
  description: "SkillNav AI 日报 — 每日精选 AI 行业动态、工具推荐和论文导读。",
  openGraph: {
    title: "日报 | SkillNav",
    description: "每日精选 AI 行业动态、工具推荐和论文导读。",
    url: `${siteConfig.url}/daily`,
  },
  alternates: {
    canonical: `${siteConfig.url}/daily`,
  },
};

interface BriefRow {
  brief_date: string;
  title: string;
  summary: string;
}

async function getDailyBriefs(): Promise<BriefRow[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("daily_briefs" as "skills")
    .select("brief_date, title, summary" as "slug")
    .in("status" as "slug", ["approved", "published"])
    .order("brief_date" as "created_at", { ascending: false })
    .limit(30);

  return (data as unknown as BriefRow[]) ?? [];
}

export default async function DailyPage() {
  const briefs = await getDailyBriefs();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "日报", href: "/daily" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="日报"
          description="每日精选 AI 行业动态、工具推荐和论文导读"
        />

        {briefs.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <Newspaper className="size-8 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold tracking-tight">
              首期日报即将发布
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              我们正在准备 SkillNav AI 日报，每天精选最值得关注的 AI 动态。
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {briefs.map((brief) => (
              <Link
                key={brief.brief_date}
                href={`/daily/${brief.brief_date}`}
                className="group rounded-xl ring-1 ring-gray-950/10 dark:ring-gray-50/10 p-6 transition-all hover:ring-primary/40 hover:bg-muted/30 hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" />
                  <time dateTime={brief.brief_date}>
                    {new Date(
                      brief.brief_date + "T00:00:00",
                    ).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <h2 className="mt-3 text-base font-semibold group-hover:text-primary">
                  {brief.title}
                </h2>
                {brief.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {brief.summary}
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
