"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { McpServer } from "@/data/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { McpStatusToggle } from "./mcp-status-toggle";
import {
  batchChangeMcpStatus,
  batchDeleteMcpAction,
  batchChangeMcpTier,
} from "@/app/admin/mcp/actions";

interface AdminMcpTableProps {
  servers: McpServer[];
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

const TIER_BADGE_CLASSES: Record<string, string> = {
  S: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  A: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  B: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
  C: "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-500",
};

function truncate(text: string, maxLen: number) {
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

export function AdminMcpTable({ servers }: AdminMcpTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (servers.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        暂无 MCP Server
      </div>
    );
  }

  const allSelected = servers.length > 0 && selected.size === servers.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(servers.map((s) => s.id)));
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

  function handleBatchStatus(status: string) {
    const ids = [...selected];
    if (ids.length === 0) return;

    const formData = new FormData();
    formData.set("ids", JSON.stringify(ids));
    formData.set("status", status);

    startTransition(async () => {
      const result = await batchChangeMcpStatus(formData);
      if (result.ok) {
        toast.success(`已批量更新 ${result.count} 个 MCP Server`);
        setSelected(new Set());
      } else {
        toast.error(`批量操作失败: ${result.error ?? "未知错误"}`);
      }
    });
  }

  function handleBatchDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;

    if (
      !confirm(`确定删除选中的 ${ids.length} 个 MCP Server？此操作不可恢复`)
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("ids", JSON.stringify(ids));

    startTransition(async () => {
      const result = await batchDeleteMcpAction(formData);
      if (result.ok) {
        toast.success(`已删除 ${result.count} 个 MCP Server`);
        setSelected(new Set());
      } else {
        toast.error(`批量删除失败: ${result.error ?? "未知错误"}`);
      }
    });
  }

  function handleBatchTier(tier: string) {
    const ids = [...selected];
    if (ids.length === 0) return;

    const formData = new FormData();
    formData.set("ids", JSON.stringify(ids));
    formData.set("tier", tier);

    startTransition(async () => {
      const result = await batchChangeMcpTier(formData);
      if (result.ok) {
        toast.success(`已将 ${result.count} 个 MCP Server 设为 ${tier} 级`);
        setSelected(new Set());
      } else {
        toast.error(`批量改层级失败: ${result.error ?? "未知错误"}`);
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
            onClick={() => handleBatchStatus("published")}
          >
            批量发布
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBatchStatus("draft")}
          >
            批量转草稿
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBatchStatus("hidden")}
          >
            批量隐藏
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
          {/* Batch tier change */}
          <Select value="" onValueChange={(tier) => handleBatchTier(tier)}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="改层级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S">设为 S 级</SelectItem>
              <SelectItem value="A">设为 A 级</SelectItem>
              <SelectItem value="B">设为 B 级</SelectItem>
            </SelectContent>
          </Select>
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
              <TableHead className="w-[60px]">层级</TableHead>
              <TableHead className="w-[70px]">Stars</TableHead>
              <TableHead className="w-[60px]">Tools</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[140px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(server.id)}
                    onCheckedChange={() => toggleOne(server.id)}
                    aria-label={`选择 ${server.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {truncate(server.nameZh ?? server.name, 40)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {server.name}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {truncate(server.author || "-", 15)}
                </TableCell>
                <TableCell>
                  {server.category && (
                    <Badge variant="outline" className="text-xs">
                      {server.category}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={TIER_BADGE_CLASSES[server.qualityTier] ?? ""}
                  >
                    {server.qualityTier}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {server.stars}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {server.toolsCount}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      STATUS_BADGE_CLASSES[server.status ?? "draft"] ?? ""
                    }
                  >
                    {STATUS_LABELS[server.status ?? "draft"] ?? server.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/mcp/${server.id}/edit`}>编辑</Link>
                    </Button>
                    <McpStatusToggle
                      serverId={server.id}
                      currentStatus={server.status ?? "draft"}
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
