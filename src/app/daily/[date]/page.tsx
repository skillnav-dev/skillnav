import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Rss } from "lucide-react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ArticleContent } from "@/components/articles/article-content";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { createStaticClient } from "@/lib/supabase/static";

export const revalidate = 300; // 5 min ISR

interface BriefRow {
  brief_date: string;
  title: string;
  summary: string;
  content_md: string;
}

interface PageProps {
  params: Promise<{ date: string }>;
}

async function getBriefByDate(date: string): Promise<BriefRow | null> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("daily_briefs" as "skills")
    .select("brief_date, title, summary, content_md" as "slug")
    .in("status" as "slug", ["approved", "published"])
    .eq("brief_date" as "slug", date)
    .limit(1)
    .single();

  return (data as unknown as BriefRow) ?? null;
}

async function getAdjacentDates(
  date: string,
): Promise<{ newer: string | null; older: string | null }> {
  const supabase = createStaticClient();

  const [{ data: newerData }, { data: olderData }] = await Promise.all([
    supabase
      .from("daily_briefs" as "skills")
      .select("brief_date" as "slug")
      .in("status" as "slug", ["approved", "published"])
      .gt("brief_date" as "slug", date)
      .order("brief_date" as "created_at", { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from("daily_briefs" as "skills")
      .select("brief_date" as "slug")
      .in("status" as "slug", ["approved", "published"])
      .lt("brief_date" as "slug", date)
      .order("brief_date" as "created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  type DateRow = { brief_date: string };
  return {
    newer: (newerData as unknown as DateRow)?.brief_date ?? null,
    older: (olderData as unknown as DateRow)?.brief_date ?? null,
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { date } = await params;
  const brief = await getBriefByDate(date);
  if (!brief) return {};

  return {
    title: `${brief.title} — AI 日报`,
    description: brief.summary,
    alternates: {
      canonical: `${siteConfig.url}/daily/${date}`,
    },
    openGraph: {
      title: `${brief.title} | SkillNav AI 日报`,
      description: brief.summary,
      type: "article",
      url: `${siteConfig.url}/daily/${date}`,
    },
  };
}

export default async function DailyDetailPage({ params }: PageProps) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const brief = await getBriefByDate(date);
  if (!brief) notFound();

  const { newer, older } = await getAdjacentDates(date);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "日报", href: "/daily" },
          { name: brief.title, href: `/daily/${date}` },
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "日报", href: "/daily" },
            { label: formatDate(date) },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {brief.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <time dateTime={date}>{formatDate(date)}</time>
          <span className="text-border">|</span>
          <Link
            href="/api/rss/daily"
            className="inline-flex items-center gap-1 hover:text-primary"
          >
            <Rss className="size-3.5" />
            RSS
          </Link>
        </div>

        <div className="mt-8">
          <ArticleContent content={brief.content_md} />
        </div>

        {/* Prev / Next navigation */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-border/40 pt-8">
          {older ? (
            <Link
              href={`/daily/${older}`}
              className="group flex items-start gap-2 rounded-lg ring-1 ring-gray-950/10 dark:ring-gray-50/10 p-4 transition-colors hover:ring-primary/40"
            >
              <ChevronLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">上一期</p>
                <p className="mt-1 text-sm font-medium group-hover:text-primary">
                  {formatDate(older)}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {newer ? (
            <Link
              href={`/daily/${newer}`}
              className="group flex items-end gap-2 rounded-lg ring-1 ring-gray-950/10 dark:ring-gray-50/10 p-4 text-right transition-colors hover:ring-primary/40"
            >
              <div>
                <p className="text-xs text-muted-foreground">下一期</p>
                <p className="mt-1 text-sm font-medium group-hover:text-primary">
                  {formatDate(newer)}
                </p>
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </>
  );
}
