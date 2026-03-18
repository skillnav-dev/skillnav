import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { SERIES_META, type Chapter } from "@/data/series";
import type { Article } from "@/data/types";
import { getAllSeriesArticles } from "@/lib/data/articles";
import { siteConfig } from "@/lib/constants";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = SERIES_META[slug];
  if (!meta?.isGuide) return {};

  return {
    title: `${meta.titleZh} - 专栏`,
    description: meta.descriptionZh ?? meta.description,
    alternates: {
      canonical: `${siteConfig.url}/guides/${slug}`,
    },
  };
}

export function generateStaticParams() {
  return Object.entries(SERIES_META)
    .filter(([, meta]) => meta.isGuide)
    .map(([slug]) => ({ slug }));
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const meta = SERIES_META[slug];
  if (!meta?.isGuide) notFound();

  const articles = await getAllSeriesArticles(slug);
  // Exclude announcement posts (seriesNumber === 0)
  const numbered = articles.filter((a) => a.seriesNumber && a.seriesNumber > 0);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "专栏", href: "/guides" },
          { name: meta.titleZh, href: `/guides/${slug}` },
        ]}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[{ label: "专栏", href: "/guides" }, { label: meta.titleZh }]}
        />

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {meta.titleZh}
          </h1>
          <p className="text-lg text-muted-foreground">{meta.title}</p>
          {meta.descriptionZh && (
            <p className="text-muted-foreground">{meta.descriptionZh}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {meta.author && <span>作者：{meta.author}</span>}
            <span>{numbered.length} 篇</span>
            {meta.sourceUrl && (
              <a
                href={meta.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                原文系列
              </a>
            )}
          </div>
        </div>

        {/* Chapter TOC */}
        <div className="mt-10 space-y-8">
          {meta.chapters ? (
            meta.chapters.map((chapter) => (
              <ChapterSection
                key={chapter.title}
                chapter={chapter}
                articles={numbered}
              />
            ))
          ) : (
            // No chapters defined — flat list
            <ol className="space-y-3">
              {numbered.map((article) => (
                <ArticleItem key={article.id} article={article} />
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}

function ChapterSection({
  chapter,
  articles,
}: {
  chapter: Chapter;
  articles: Article[];
}) {
  const chapterArticles = articles.filter(
    (a) =>
      a.seriesNumber != null &&
      a.seriesNumber >= chapter.range[0] &&
      a.seriesNumber <= chapter.range[1],
  );

  if (chapterArticles.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">
        {chapter.titleZh}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {chapter.title}
        </span>
      </h2>
      <ol className="space-y-3">
        {chapterArticles.map((article) => (
          <ArticleItem key={article.id} article={article} />
        ))}
      </ol>
    </section>
  );
}

function ArticleItem({ article }: { article: Article }) {
  return (
    <li className="group flex items-baseline gap-3">
      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
        {String(article.seriesNumber ?? 0).padStart(2, "0")}
      </span>
      <Link
        href={`/articles/${article.slug}`}
        className="text-foreground transition-colors group-hover:text-primary"
      >
        {article.titleZh || article.title}
      </Link>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
        {article.readingTime} 分钟
      </span>
    </li>
  );
}
