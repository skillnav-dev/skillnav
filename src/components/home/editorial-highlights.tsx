import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { ArticleCard } from "@/components/articles/article-card";
import { getWeeklyArticles, getEditorialArticles } from "@/lib/data";

export async function EditorialHighlights() {
  const [weeklies, editorials] = await Promise.all([
    getWeeklyArticles(1),
    getEditorialArticles(3),
  ]);

  const latestWeekly = weeklies[0] ?? null;
  const displayEditorials = latestWeekly ? editorials.slice(0, 2) : editorials;
  const hasContent = latestWeekly || displayEditorials.length > 0;

  if (!hasContent) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="编辑精选"
            description="本周值得关注的工具与文章"
          />
          <Link
            href="/articles"
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            查看全部
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div
          className={latestWeekly ? "mt-6 grid gap-6 lg:grid-cols-5" : "mt-6"}
        >
          {/* Large weekly card */}
          {latestWeekly && (
            <Link
              href={`/weekly/${latestWeekly.slug}`}
              className="group relative flex flex-col justify-end overflow-hidden rounded-xl ring-1 ring-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 transition-shadow hover:shadow-md lg:col-span-2"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                {new Date(latestWeekly.publishedAt).toLocaleDateString(
                  "zh-CN",
                  { month: "long", day: "numeric" },
                )}
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                {latestWeekly.titleZh ?? latestWeekly.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {latestWeekly.introZh ??
                  latestWeekly.summaryZh ??
                  latestWeekly.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                阅读完整周刊
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}
          {/* Editorial articles list */}
          <div
            className={
              latestWeekly
                ? "grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1"
                : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {displayEditorials.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            查看全部
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
