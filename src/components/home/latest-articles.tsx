import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { ArticleCard } from "@/components/articles/article-card";
import { getLatestArticles } from "@/lib/data";

export async function LatestArticles() {
  const latest = await getLatestArticles();

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="最新资讯"
            description="AI Agent 生态的前沿动态"
          />
          <Link
            href="/articles"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            全部资讯
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            查看全部资讯
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
