import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { Article } from "@/data/types";
import {
  ARTICLE_TYPE_LABELS,
  ARTICLE_TYPE_COLORS,
  ARTICLE_SOURCE_LABELS,
} from "@/lib/article-constants";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="secondary"
            className={ARTICLE_TYPE_COLORS[article.category]}
          >
            {ARTICLE_TYPE_LABELS[article.category]}
          </Badge>
          {article.source && ARTICLE_SOURCE_LABELS[article.source] && (
            <span>{ARTICLE_SOURCE_LABELS[article.source]}</span>
          )}
          {formattedDate && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span>{formattedDate}</span>
            </>
          )}
          {article.readingTime > 0 && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {article.readingTime} 分钟
              </span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link
          href={`/articles/${article.slug}`}
          className="line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary"
        >
          {article.titleZh ?? article.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {article.summaryZh ?? article.summary}
        </p>
      </CardContent>
    </Card>
  );
}
