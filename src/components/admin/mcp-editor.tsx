"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { McpServer } from "@/data/types";
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
import {
  saveMcpServer,
  deleteMcpAction,
} from "@/app/admin/mcp/[id]/edit/actions";

interface McpEditorProps {
  server: McpServer;
}

export function McpEditor({ server }: McpEditorProps) {
  const router = useRouter();
  const [nameZh, setNameZh] = useState(server.nameZh ?? "");
  const [descriptionZh, setDescriptionZh] = useState(
    server.descriptionZh ?? "",
  );
  const [editorComment, setEditorComment] = useState(
    server.editorCommentZh ?? "",
  );
  const [status, setStatus] = useState(server.status ?? "draft");
  const [category, setCategory] = useState(server.category ?? "");
  const [qualityTier, setQualityTier] = useState(server.qualityTier ?? "B");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("id", server.id);
    formData.set("name_zh", nameZh);
    formData.set("description_zh", descriptionZh);
    formData.set("editor_comment_zh", editorComment);
    formData.set("status", status);
    formData.set("category", category);
    formData.set("quality_tier", qualityTier);

    startTransition(async () => {
      try {
        await saveMcpServer(formData);
        toast.success("MCP Server 已保存");
      } catch {
        toast.error("保存失败，请重试");
      }
    });
  }

  function handleDelete() {
    if (!confirm("确定删除此 MCP Server？此操作不可恢复")) return;

    startTransition(async () => {
      const result = await deleteMcpAction(server.id);
      if (result.ok) {
        toast.success("MCP Server 已删除");
        router.push("/admin/mcp");
      } else {
        toast.error(`删除失败: ${result.error ?? "未知错误"}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Meta info bar */}
      <div className="rounded-lg bg-muted/60 p-4">
        <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">英文名：</span>
            <span className="font-medium">{server.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">作者：</span>
            <span>{server.author || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">来源：</span>
            <span>{server.source || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stars：</span>
            <span className="tabular-nums">{server.stars}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tools：</span>
            <span className="tabular-nums">{server.toolsCount}</span>
          </div>
          {server.githubUrl && (
            <div>
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                GitHub
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name_zh">中文名称</Label>
            <Input
              id="name_zh"
              value={nameZh}
              onChange={(e) => setNameZh(e.target.value)}
              placeholder="输入中文名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description_zh">中文描述</Label>
            <Textarea
              id="description_zh"
              value={descriptionZh}
              onChange={(e) => setDescriptionZh(e.target.value)}
              placeholder="输入中文描述"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editor_comment">编辑评语</Label>
            <Textarea
              id="editor_comment"
              value={editorComment}
              onChange={(e) => setEditorComment(e.target.value)}
              placeholder="编辑推荐评语"
              rows={3}
            />
          </div>

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
              <Label htmlFor="category">分类</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="分类"
                className="w-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label>质量层级</Label>
              <Select
                value={qualityTier}
                onValueChange={(v) => setQualityTier(v as typeof qualityTier)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Right side: original description preview */}
        <div className="space-y-4">
          {server.description && (
            <div className="space-y-2">
              <Label>原始描述</Label>
              <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-background p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {server.description}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 flex items-center justify-between border-t bg-background py-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/mcp">
            <ArrowLeft className="mr-2 size-4" />
            返回列表
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 size-4" />
            删除
          </Button>
          <Button disabled={isPending} onClick={handleSave}>
            <Save className="mr-2 size-4" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
