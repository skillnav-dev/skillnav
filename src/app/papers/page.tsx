import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/constants";
import { ArticleCard } from "@/components/articles/article-card";
import { ArticlesSkeleton } from "@/components/articles/articles-skeleton";
import { ArticlesPagination } from "@/components/articles/articles-pagination";
import { getPapersWithCount } from "@/lib/data/articles";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "论文",
  description:
    "AI 前沿论文中文翻译与导读，覆盖智能体、多模态、具身智能等方向。",
  openGraph: {
    title: "论文",
    description: "AI 前沿论文中文翻译与导读",
    url: `${siteConfig.url}/papers`,
  },
  alternates: {
    canonical: `${siteConfig.url}/papers`,
  },
};

export const revalidate = 300; // ISR: 5 min

async function PapersList({ page }: { page: number }) {
  const validPage = Math.max(1, page);
  const offset = (validPage - 1) * PAGE_SIZE;

  const { articles, total } = await getPapersWithCount({
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground">暂无论文</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <ArticlesPagination
            currentPage={validPage}
            totalPages={totalPages}
            buildPageUrl={(p) => (p > 1 ? `/papers?page=${p}` : "/papers")}
          />
        </div>
      )}
    </div>
  );
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PapersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "首页", href: "/" },
          { name: "论文", href: "/papers" },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHeader
          as="h1"
          title="论文"
          description="AI 前沿论文中文翻译与导读，覆盖智能体、多模态、具身智能等方向"
        />
        <Suspense key={`papers-${page}`} fallback={<ArticlesSkeleton />}>
          <PapersList page={page} />
        </Suspense>
      </div>
    </>
  );
}
