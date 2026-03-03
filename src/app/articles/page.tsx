import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { ArticlesToolbar } from "@/components/articles/articles-toolbar";
import { ArticlesGrid } from "@/components/articles/articles-grid";
import { ArticlesSkeleton } from "@/components/articles/articles-skeleton";
import {
  getArticleCategories,
  getArticlesWithCount,
} from "@/lib/data/articles";
import {
  articlesParamsCache,
  ARTICLES_PAGE_SIZE,
} from "@/lib/articles-search-params";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q, category, page } = await articlesParamsCache.parse(searchParams);
  const parts = ["资讯"];
  if (category) parts.push(category);
  if (q) parts.push(`「${q}」`);
  if (page > 1) parts.push(`第 ${page} 页`);

  return {
    title: parts.join(" - "),
    description: "AI Agent Skills 生态的最新动态、教程和深度分析。",
  };
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { q, category, page } = await articlesParamsCache.parse(searchParams);

  // Parallel fetch: categories (lightweight) + count for toolbar display
  const [categories, { total }] = await Promise.all([
    getArticleCategories(),
    getArticlesWithCount({
      limit: ARTICLES_PAGE_SIZE,
      offset: (Math.max(1, page) - 1) * ARTICLES_PAGE_SIZE,
      category: category || undefined,
      search: q || undefined,
    }),
  ]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "资讯", href: "/articles" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          title="资讯"
          description="AI Agent Skills 生态的最新动态、教程和深度分析"
        />
        <div className="mt-6">
          <ArticlesToolbar categories={categories} totalCount={total} />
        </div>
        <Suspense
          key={`${q}-${category}-${page}`}
          fallback={<ArticlesSkeleton />}
        >
          <ArticlesGrid q={q} category={category} page={page} />
        </Suspense>
      </div>
    </>
  );
}
