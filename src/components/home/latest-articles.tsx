import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { getLatestArticles } from "@/lib/data";

const TYPE_LABELS: Record<string, string> = {
  tutorial: "教程",
  analysis: "分析",
  guide: "指南",
};

export async function LatestArticles() {
  const latest = await getLatestArticles();

  // Build freshness signal from latest article date
  const freshDate = latest[0]?.publishedAt
    ? new Date(latest[0].publishedAt).toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="最新资讯"
            description={
              freshDate
                ? `AI Agent 生态的前沿动态 · ${freshDate} 更新`
                : "AI Agent 生态的前沿动态"
            }
          />
          <Link
            href="/articles"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            全部资讯
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6">
          {latest.map((article) => {
            const date = new Date(article.publishedAt).toLocaleDateString(
              "zh-CN",
              { month: "short", day: "numeric" },
            );
            return (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group flex items-center gap-3 border-b border-border/40 px-1 py-2.5 transition-colors hover:bg-muted/40"
              >
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {TYPE_LABELS[article.category] ?? article.category}
                </Badge>
                <div className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-primary">
                    {article.titleZh ?? article.title}
                  </span>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {article.summaryZh ?? article.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">{date}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-4 text-center sm:hidden">
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
