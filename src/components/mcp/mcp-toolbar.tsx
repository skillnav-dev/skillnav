"use client";

import { useQueryState } from "nuqs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mcpSearchParams } from "@/lib/mcp-search-params";

interface MCPToolbarProps {
  categories: string[];
  totalCount: number;
}

export function MCPToolbar({ categories, totalCount }: MCPToolbarProps) {
  const [q, setQ] = useQueryState("q", mcpSearchParams.q);
  const [category, setCategory] = useQueryState(
    "category",
    mcpSearchParams.category,
  );
  const [sort, setSort] = useQueryState("sort", mcpSearchParams.sort);

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索 MCP Server..."
          value={q}
          onChange={(e) => setQ(e.target.value || null)}
          className="h-10 pl-9"
        />
      </div>
      <Select
        value={category || "all"}
        onValueChange={(v) => setCategory(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="全部分类" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部分类</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sort || "stars"}
        onValueChange={(v) => setSort(v === "stars" ? null : v)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="排序" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="stars">Stars</SelectItem>
          <SelectItem value="latest">最新</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
