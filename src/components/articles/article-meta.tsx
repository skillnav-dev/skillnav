import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import type { Article } from "@/data/types";
import {
  ARTICLE_TYPE_LABELS,
  ARTICLE_TYPE_COLORS,
  ARTICLE_SOURCE_LABELS,
} from "@/lib/article-constants";

interface ArticleMetaProps {
  article: Article;
}

export function ArticleMeta({ article }: ArticleMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <Badge
        variant="secondary"
        className={ARTICLE_TYPE_COLORS[article.category]}
      >
        {ARTICLE_TYPE_LABELS[article.category]}
      </Badge>
      {article.source && ARTICLE_SOURCE_LABELS[article.source] && (
        <span>{ARTICLE_SOURCE_LABELS[article.source]}</span>
      )}
      <span className="flex items-center gap-1">
        <Calendar className="size-3.5" />
        {article.publishedAt}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="size-3.5" />
        {article.readingTime} 分钟阅读
      </span>
    </div>
  );
}
