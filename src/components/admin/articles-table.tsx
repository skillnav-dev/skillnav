"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Article } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  batchChangeArticleStatus,
  batchDeleteArticles,
} from "@/app/admin/articles/actions";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (articles.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">暂无文章</div>
    );
  }

  const allSelected = articles.length > 0 && selected.size === articles.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(articles.map((a) => a.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBatchAction(status: string) {
    const ids = [...selected];
    if (ids.length === 0) return;

    const formData = new FormData();
    formData.set("ids", JSON.stringify(ids));
    formData.set("status", status);

    startTransition(async () => {
      const result = await batchChangeArticleStatus(formData);
      if (result.ok) {
        toast.success(`已批量更新 ${result.count} 篇文章`);
        setSelected(new Set());
      } else {
        toast.error(`批量操作失败: ${result.error ?? "未知错误"}`);
      }
    });
  }

  function handleBatchDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;

    if (!confirm(`确定删除选中的 ${ids.length} 篇文章？此操作不可恢复`)) {
      return;
    }

    const formData = new FormData();
    formData.set("ids", JSON.stringify(ids));

    startTransition(async () => {
      const result = await batchDeleteArticles(formData);
      if (result.ok) {
        toast.success(`已删除 ${result.count} 篇文章`);
        setSelected(new Set());
      } else {
        toast.error(`批量删除失败: ${result.error ?? "未知错误"}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            已选 {selected.size} 项
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBatchAction("published")}
          >
            批量发布
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBatchAction("hidden")}
          >
            批量隐藏
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBatchAction("draft")}
          >
            批量转草稿
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="全选"
                />
              </TableHead>
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
                  <Checkbox
                    checked={selected.has(article.id)}
                    onCheckedChange={() => toggleOne(article.id)}
                    aria-label={`选择 ${article.title}`}
                  />
                </TableCell>
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
    </div>
  );
}
