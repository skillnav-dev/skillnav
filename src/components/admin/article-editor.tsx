"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import type { Article } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArticlePreview } from "./article-preview";
import { ArticleOriginal } from "./article-original";
import { saveArticle } from "@/app/admin/articles/[id]/edit/actions";

interface ArticleEditorProps {
  article: Article;
}

export function ArticleEditor({ article }: ArticleEditorProps) {
  const [titleZh, setTitleZh] = useState(article.titleZh ?? "");
  const [summaryZh, setSummaryZh] = useState(article.summaryZh ?? "");
  const [contentZh, setContentZh] = useState(article.contentZh ?? "");
  const [status, setStatus] = useState(article.status);
  const [relevanceScore, setRelevanceScore] = useState(
    String(article.relevanceScore ?? 3),
  );
  const [isPending, startTransition] = useTransition();

  function handleSave(publish: boolean) {
    const formData = new FormData();
    formData.set("id", article.id);
    formData.set("title_zh", titleZh);
    formData.set("summary_zh", summaryZh);
    formData.set("content_zh", contentZh);
    formData.set("status", publish ? "published" : status);
    formData.set("relevance_score", relevanceScore);

    startTransition(async () => {
      try {
        await saveArticle(formData);
        toast.success(publish ? "文章已发布" : "文章已保存");
      } catch {
        toast.error("保存失败，请重试");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Meta info bar */}
      <div className="rounded-lg bg-muted/60 p-4">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">原文标题：</span>
            <span className="font-medium">{article.title}</span>
          </div>
          <div>
            <span className="text-muted-foreground">来源：</span>
            <span>{article.source ?? "unknown"}</span>
          </div>
          {article.sourceUrl && (
            <div>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                查看原文
              </a>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">发布时间：</span>
            <span>
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("zh-CN")
                : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Original content collapsible */}
      <ArticleOriginal title={article.title} content={article.content} />

      {/* Editor + Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Edit area */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title_zh">中文标题</Label>
            <Input
              id="title_zh"
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
              placeholder="输入中文标题"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary_zh">中文摘要</Label>
            <Textarea
              id="summary_zh"
              value={summaryZh}
              onChange={(e) => setSummaryZh(e.target.value)}
              placeholder="输入中文摘要"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_zh">中文内容（Markdown）</Label>
            <Textarea
              id="content_zh"
              value={contentZh}
              onChange={(e) => setContentZh(e.target.value)}
              placeholder="输入 Markdown 内容"
              className="min-h-[500px] font-mono text-sm"
            />
          </div>

          {/* Status + relevance */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as typeof status)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="hidden">隐藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>相关性评分</Label>
              <Select value={relevanceScore} onValueChange={setRelevanceScore}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right: Preview area */}
        <div className="space-y-2">
          <Label>预览</Label>
          <div className="h-[calc(100vh-320px)] min-h-[500px] overflow-y-auto rounded-lg border bg-background p-4">
            <ArticlePreview content={contentZh} />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 flex items-center justify-between border-t bg-background py-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/articles">
            <ArrowLeft className="mr-2 size-4" />
            返回列表
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => handleSave(false)}
          >
            <Save className="mr-2 size-4" />
            保存草稿
          </Button>
          <Button disabled={isPending} onClick={() => handleSave(true)}>
            <Send className="mr-2 size-4" />
            保存并发布
          </Button>
        </div>
      </div>
    </div>
  );
}
