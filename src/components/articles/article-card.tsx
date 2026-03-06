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
import { FallbackImage } from "@/components/shared/fallback-image";

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
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      {/* Cover image or branded placeholder */}
      <Link href={`/articles/${article.slug}`}>
        <div className="aspect-[2/1] overflow-hidden">
          {article.coverImage ? (
            <FallbackImage
              src={article.coverImage}
              alt={article.titleZh ?? article.title}
              className="size-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
              <span className="text-lg font-semibold text-muted-foreground/40">
                {(article.source && ARTICLE_SOURCE_LABELS[article.source]) ||
                  "SkillNav"}
              </span>
            </div>
          )}
        </div>
      </Link>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{article.readingTime} 分钟</span>
        </div>
      </CardContent>
    </Card>
  );
}
