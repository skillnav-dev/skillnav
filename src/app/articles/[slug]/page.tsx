import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { ArticleMeta } from "@/components/articles/article-meta";
import { ArticleContent } from "@/components/articles/article-content";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { FallbackImage } from "@/components/shared/fallback-image";
import { siteConfig } from "@/lib/constants";
import { getArticleBySlug, getArticles, getAllArticleSlugs } from "@/lib/data";

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

  const candidates = await getArticles({
    limit: 3,
    category: article.category,
  });
  const related = candidates.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <>
      <ArticleJsonLd
        title={article.titleZh ?? article.title}
        description={article.summaryZh ?? article.summary}
        url={`${siteConfig.url}/articles/${article.slug}`}
        publishedAt={article.publishedAt}
        image={article.coverImage}
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
        <div className="mt-4">
          <ArticleMeta article={article} />
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
      </article>
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
    </>
  );
}
