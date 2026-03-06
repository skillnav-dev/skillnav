import Link from "next/link";
import type { Article } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARTICLE_SOURCE_LABELS } from "@/lib/article-constants";
import { StatusToggleForm } from "./status-toggle-form";

interface AdminArticlesTableProps {
  articles: Article[];
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  hidden: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  published: "已发布",
  draft: "草稿",
  hidden: "已隐藏",
};

function truncate(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function AdminArticlesTable({ articles }: AdminArticlesTableProps) {
  if (articles.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">暂无文章</div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[300px]">标题</TableHead>
            <TableHead className="w-[100px]">来源</TableHead>
            <TableHead className="w-[60px]">评分</TableHead>
            <TableHead className="w-[80px]">状态</TableHead>
            <TableHead className="w-[100px]">发布时间</TableHead>
            <TableHead className="w-[140px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <TableRow key={article.id}>
              <TableCell>
                <div className="font-medium">
                  {truncate(article.titleZh ?? article.title, 50)}
                </div>
              </TableCell>
              <TableCell>
                {article.source && (
                  <Badge variant="outline" className="text-xs">
                    {ARTICLE_SOURCE_LABELS[article.source] ?? article.source}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {article.relevanceScore != null ? (
                  <span className="text-sm tabular-nums">
                    {article.relevanceScore}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={STATUS_BADGE_CLASSES[article.status] ?? ""}
                >
                  {STATUS_LABELS[article.status] ?? article.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(article.publishedAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/articles/${article.id}/edit`}>
                      编辑
                    </Link>
                  </Button>
                  <StatusToggleForm
                    articleId={article.id}
                    currentStatus={article.status}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
