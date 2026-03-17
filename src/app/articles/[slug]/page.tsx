import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ArticleMeta } from "@/components/articles/article-meta";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { FallbackImage } from "@/components/shared/fallback-image";
import { InlineNewsletterCta } from "@/components/shared/inline-newsletter-cta";
import { ShareButtons } from "@/components/shared/share-buttons";
import { GiscusComments } from "@/components/shared/giscus-comments";
import { SkillCard } from "@/components/skills/skill-card";
import { siteConfig } from "@/lib/constants";
import {
  getArticleBySlug,
  getArticles,
  getAllArticleSlugs,
  getSeriesArticles,
} from "@/lib/data";
import { getSkills } from "@/lib/data/skills";
import { SERIES_META } from "@/data/series";
import { SeriesNav } from "@/components/articles/series-nav";
import { LEARN_CONCEPTS } from "@/data/learn";
import Link from "next/link";

// Extract the most meaningful keyword from an article title for skill matching.
// Picks the longest CJK segment or the longest word (>3 chars) from the title.
function extractKeywords(title: string): string {
  // Try CJK segments first (Chinese title)
  const cjkSegments = title.match(/[\u4e00-\u9fff]{2,}/g);
  if (cjkSegments && cjkSegments.length > 0) {
    return cjkSegments.sort((a, b) => b.length - a.length)[0];
  }
  // Fallback: longest English word (skip common words)
  const skip = new Set([
    "the",
    "and",
    "for",
    "with",
    "how",
    "what",
    "your",
    "from",
    "this",
    "that",
  ]);
  const words = title
    .split(/\s+/)
    .filter((w) => w.length > 3 && !skip.has(w.toLowerCase()));
  return words[0] ?? title.slice(0, 20);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.titleZh ?? article.title;
  const description = article.summaryZh ?? article.summary;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.publishedAt,
      url: `${siteConfig.url}/articles/${article.slug}`,
      ...(article.coverImage && {
        images: [{ url: article.coverImage }],
      }),
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  // Parallel fetch: related articles + related skills + series siblings
  const articleTitle = article.titleZh ?? article.title;
  const seriesSlug = article.series;
  const isContentSeries = seriesSlug && seriesSlug !== "weekly";
  const seriesMeta = isContentSeries ? SERIES_META[seriesSlug] : undefined;

  const [candidates, relatedSkills, seriesSiblings] = await Promise.all([
    getArticles({ limit: 3, category: article.category }),
    getSkills({ search: extractKeywords(articleTitle), limit: 3 }),
    isContentSeries
      ? getSeriesArticles(seriesSlug, article.id)
      : Promise.resolve([]),
  ]);
  const related = candidates.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <>
      <ArticleJsonLd
        title={article.titleZh ?? article.title}
        description={article.summaryZh ?? article.summary}
        url={`${siteConfig.url}/articles/${article.slug}`}
        publishedAt={article.publishedAt}
        image={article.coverImage}
        sourceUrl={article.sourceUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "资讯", href: "/articles" },
          {
            name: article.titleZh ?? article.title,
            href: `/articles/${article.slug}`,
          },
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <PageBreadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "资讯", href: "/articles" },
            { label: article.titleZh ?? article.title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {article.titleZh ?? article.title}
        </h1>
        <div className="mt-4 flex items-center justify-between gap-4">
          <ArticleMeta article={article} />
          <ShareButtons
            url={`/articles/${article.slug}`}
            title={articleTitle}
          />
        </div>
        {/* Hero image */}
        {article.coverImage && (
          <div className="mt-6 overflow-hidden rounded-lg">
            <FallbackImage
              src={article.coverImage}
              alt={article.titleZh ?? article.title}
              className="aspect-[2/1] w-full object-cover"
            />
          </div>
        )}
        {article.introZh && (
          <div className="mt-6 rounded-md border-l-4 border-primary/40 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {article.introZh}
          </div>
        )}
        {seriesMeta && seriesSiblings.length > 0 && (
          <div className="mt-6">
            <SeriesNav
              current={article}
              siblings={seriesSiblings}
              meta={seriesMeta}
            />
          </div>
        )}
        <div className="mt-8">
          <ArticleContent content={article.contentZh ?? article.content} />
        </div>
        {/* Copyright attribution for translated articles */}
        {article.sourceUrl && (
          <div className="mt-10 rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            本文编译自{" "}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {article.title}
            </a>
            ，版权归原作者所有。
          </div>
        )}
        {/* Bottom share buttons */}
        <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
          <p className="text-sm text-muted-foreground">
            觉得有用？分享给更多人
          </p>
          <ShareButtons
            url={`/articles/${article.slug}`}
            title={articleTitle}
          />
        </div>
      </article>
      {/* Inline newsletter CTA */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <InlineNewsletterCta />
      </div>
      {/* Related learn concepts */}
      {(() => {
        const text =
          `${articleTitle} ${article.contentZh ?? article.content}`.toLowerCase();
        const keywords: Record<string, string[]> = {
          agent: ["agent", "智能体", "agentic"],
          mcp: ["mcp", "model context protocol"],
          rag: ["rag", "检索增强", "retrieval-augmented"],
        };
        const matched = LEARN_CONCEPTS.filter((c) =>
          keywords[c.slug]?.some((kw) => text.includes(kw)),
        );
        if (matched.length === 0) return null;
        return (
          <section className="border-t border-border/40">
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
              <h2 className="mb-6 text-xl font-bold">概念速查</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {matched.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/learn/what-is-${c.slug}`}
                    className="rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <p className="font-medium">{c.zh}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {c.oneLiner}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}
      {/* Related tools mentioned in this article */}
      {relatedSkills.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-xl font-bold">相关工具</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedSkills.map((s) => (
                <SkillCard key={s.id} skill={s} />
              ))}
            </div>
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-xl font-bold">相关文章</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Comments */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <GiscusComments />
        </div>
      </section>
    </>
  );
}
