"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Skill } from "@/data/types";
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
import { saveSkill } from "@/app/admin/skills/[id]/edit/actions";

interface SkillEditorProps {
  skill: Skill;
}

export function SkillEditor({ skill }: SkillEditorProps) {
  const [nameZh, setNameZh] = useState(skill.nameZh ?? "");
  const [descriptionZh, setDescriptionZh] = useState(skill.descriptionZh ?? "");
  const [editorComment, setEditorComment] = useState(
    skill.editorCommentZh ?? "",
  );
  const [status, setStatus] = useState(skill.status ?? "draft");
  const [category, setCategory] = useState(skill.category ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("id", skill.id);
    formData.set("name_zh", nameZh);
    formData.set("description_zh", descriptionZh);
    formData.set("editor_comment_zh", editorComment);
    formData.set("status", status);
    formData.set("category", category);

    startTransition(async () => {
      try {
        await saveSkill(formData);
        toast.success("Skill 已保存");
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
            <span className="text-muted-foreground">英文名：</span>
            <span className="font-medium">{skill.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">作者：</span>
            <span>{skill.author || "-"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">来源：</span>
            <span>{skill.source}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Stars：</span>
            <span className="tabular-nums">{skill.stars}</span>
          </div>
          {skill.githubUrl && (
            <div>
              <a
                href={skill.githubUrl}
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
        {skill.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {skill.description}
          </p>
        )}
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
          </div>
        </div>

        {/* Right side: existing content preview */}
        <div className="space-y-4">
          {skill.content && (
            <div className="space-y-2">
              <Label>SKILL.md 内容</Label>
              <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-background p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {skill.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 flex items-center justify-between border-t bg-background py-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/skills">
            <ArrowLeft className="mr-2 size-4" />
            返回列表
          </Link>
        </Button>
        <Button disabled={isPending} onClick={handleSave}>
          <Save className="mr-2 size-4" />
          保存
        </Button>
      </div>
    </div>
  );
}
