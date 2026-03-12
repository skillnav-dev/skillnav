"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Skill } from "@/data/types";
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
import { SKILL_SOURCE_LABELS } from "@/lib/skill-constants";
import { SkillStatusToggle } from "./skill-status-toggle";
import { batchChangeSkillStatus } from "@/app/admin/skills/actions";

interface AdminSkillsTableProps {
  skills: Skill[];
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

export function AdminSkillsTable({ skills }: AdminSkillsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (skills.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">暂无 Skill</div>
    );
  }

  const allSelected = skills.length > 0 && selected.size === skills.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(skills.map((s) => s.id)));
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
      const result = await batchChangeSkillStatus(formData);
      if (result.ok) {
        toast.success(`已批量更新 ${result.count} 个 Skill`);
        setSelected(new Set());
      } else {
        toast.error(`批量操作失败: ${result.error ?? "未知错误"}`);
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
              <TableHead className="min-w-[200px]">名称</TableHead>
              <TableHead className="w-[100px]">作者</TableHead>
              <TableHead className="w-[100px]">分类</TableHead>
              <TableHead className="w-[100px]">来源</TableHead>
              <TableHead className="w-[70px]">Stars</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.map((skill) => (
              <TableRow key={skill.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(skill.id)}
                    onCheckedChange={() => toggleOne(skill.id)}
                    aria-label={`选择 ${skill.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {truncate(skill.nameZh ?? skill.name, 40)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {skill.name}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {truncate(skill.author || "-", 15)}
                </TableCell>
                <TableCell>
                  {skill.category && (
                    <Badge variant="outline" className="text-xs">
                      {skill.category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {SKILL_SOURCE_LABELS[skill.source] ?? skill.source}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {skill.stars}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      STATUS_BADGE_CLASSES[skill.status ?? "draft"] ?? ""
                    }
                  >
                    {STATUS_LABELS[skill.status ?? "draft"] ?? skill.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/skills/${skill.id}/edit`}>编辑</Link>
                    </Button>
                    <SkillStatusToggle
                      skillId={skill.id}
                      currentStatus={skill.status ?? "draft"}
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
