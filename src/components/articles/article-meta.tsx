import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import type { Article } from "@/data/types";

const categoryLabels: Record<Article["category"], string> = {
  news: "资讯",
  tutorial: "教程",
  analysis: "深度",
  release: "发布",
  review: "评测",
  comparison: "对比",
  weekly: "周刊",
};

interface ArticleMetaProps {
  article: Article;
}

export function ArticleMeta({ article }: ArticleMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <Badge variant="secondary">{categoryLabels[article.category]}</Badge>
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
