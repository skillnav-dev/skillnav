import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import type { Article } from "@/data/types";

const categoryLabels: Record<Article["category"], string> = {
  news: "资讯",
  tutorial: "教程",
  analysis: "深度",
  review: "评测",
  comparison: "对比",
  weekly: "周刊",
};

const categoryColors: Record<Article["category"], string> = {
  news: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  tutorial:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  analysis:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  review:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  comparison:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  weekly: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={categoryColors[article.category]}
          >
            {categoryLabels[article.category]}
          </Badge>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {article.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {article.readingTime} 分钟
            </span>
          </div>
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
