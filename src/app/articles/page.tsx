import type { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { ArticleCard } from "@/components/articles/article-card";
import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { mockArticles } from "@/data/mock-articles";

export const metadata: Metadata = {
  title: "资讯",
  description: "AI Agent Skills 生态的最新动态、教程和深度分析。",
};

export default function ArticlesPage() {
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {mockArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </>
  );
}
