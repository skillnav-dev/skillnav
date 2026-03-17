import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { InlineNewsletterCta } from "@/components/shared/inline-newsletter-cta";
import { ShareButtons } from "@/components/shared/share-buttons";
import { siteConfig } from "@/lib/constants";
import {
  getWeeklyBySlug,
  getWeeklyArticles,
  getAllWeeklySlugs,
} from "@/lib/data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllWeeklySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getWeeklyBySlug(slug);
  if (!issue) return {};

  const title = issue.titleZh ?? issue.title;
  const description =
    issue.summaryZh ?? issue.summary ?? `SkillNav 周刊 — ${title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: issue.publishedAt,
      url: `${siteConfig.url}/weekly/${issue.slug}`,
    },
  };
}

export default async function WeeklyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const issue = await getWeeklyBySlug(slug);
  if (!issue) notFound();

  // Fetch all issues to find prev/next
  const allIssues = await getWeeklyArticles(50);
  const currentIdx = allIssues.findIndex((i) => i.slug === slug);
  // allIssues is sorted by series_number DESC, so "prev" = older = next in array
  const newerIssue = currentIdx > 0 ? allIssues[currentIdx - 1] : null;
  const olderIssue =
    currentIdx < allIssues.length - 1 ? allIssues[currentIdx + 1] : null;

  const title = issue.titleZh ?? issue.title;

  return (
    <>
      <ArticleJsonLd
        title={title}
        description={issue.summaryZh ?? issue.summary}
        url={`${siteConfig.url}/weekly/${issue.slug}`}
        publishedAt={issue.publishedAt}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "周刊", href: "/weekly" },
          { name: title, href: `/weekly/${slug}` },
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "周刊", href: "/weekly" },
            { label: title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <time dateTime={issue.publishedAt}>
              {new Date(issue.publishedAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {issue.readingTime > 0 && <span>{issue.readingTime} 分钟阅读</span>}
          </div>
          <ShareButtons url={`/weekly/${issue.slug}`} title={title} />
        </div>

        <div className="mt-8">
          <ArticleContent content={issue.contentZh ?? issue.content} />
        </div>

        {/* Prev / Next navigation */}
        <nav className="mt-12 grid grid-cols-2 gap-4 border-t border-border/40 pt-8">
          {olderIssue ? (
            <Link
              href={`/weekly/${olderIssue.slug}`}
              className="group flex items-start gap-2 rounded-lg border border-border/40 p-4 transition-colors hover:border-primary/40"
            >
              <ChevronLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">上一期</p>
                <p className="mt-1 text-sm font-medium group-hover:text-primary">
                  {olderIssue.titleZh ?? olderIssue.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {newerIssue ? (
            <Link
              href={`/weekly/${newerIssue.slug}`}
              className="group flex items-end gap-2 rounded-lg border border-border/40 p-4 text-right transition-colors hover:border-primary/40"
            >
              <div>
                <p className="text-xs text-muted-foreground">下一期</p>
                <p className="mt-1 text-sm font-medium group-hover:text-primary">
                  {newerIssue.titleZh ?? newerIssue.title}
                </p>
              </div>
              <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>

      {/* Newsletter CTA */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <InlineNewsletterCta />
      </div>
    </>
  );
}
