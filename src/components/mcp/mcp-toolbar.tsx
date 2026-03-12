"use client";

import { useTransition } from "react";
import { useQueryState } from "nuqs";
import { Search, X, ArrowUpDown, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mcpSearchParams } from "@/lib/mcp-search-params";
import { ScrollFade } from "@/components/shared/scroll-fade";
import { cn } from "@/lib/utils";

interface MCPToolbarProps {
  categories: string[];
  totalCount: number;
}

export function MCPToolbar({ categories, totalCount }: MCPToolbarProps) {
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useQueryState(
    "q",
    mcpSearchParams.q.withOptions({
      shallow: false,
      throttleMs: 300,
      startTransition,
    }),
  );

  const [category, setCategory] = useQueryState(
    "category",
    mcpSearchParams.category.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [sort, setSort] = useQueryState(
    "sort",
    mcpSearchParams.sort.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [tier, setTier] = useQueryState(
    "tier",
    mcpSearchParams.tier.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [, setPage] = useQueryState(
    "page",
    mcpSearchParams.page.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  function handleSearch(value: string) {
    setQ(value || null);
    setPage(1);
  }

  function handleCategory(cat: string) {
    setCategory(cat === category ? null : cat || null);
    setPage(1);
  }

  function handleSort(value: string) {
    setSort(value === "stars" ? null : value);
    setPage(1);
  }

  function handleTier() {
    setTier(tier === "S" ? null : "S");
    setPage(1);
  }

  function handleClear() {
    setQ(null);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索 MCP Server..."
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 pl-9 pr-9"
          />
          {q && (
            <button
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select value={sort || "stars"} onValueChange={handleSort}>
          <SelectTrigger className="h-10 w-full sm:w-[120px]">
            <ArrowUpDown className="mr-1 size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stars">Stars 排序</SelectItem>
            <SelectItem value="latest">最新优先</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category filters */}
      <ScrollFade>
        <Button
          variant={tier === "S" ? "default" : "outline"}
          size="sm"
          onClick={handleTier}
          className={cn(
            "shrink-0",
            tier === "S" &&
              "border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
          )}
        >
          <Award className="mr-1 size-3.5" />
          编辑精选
        </Button>
        <Button
          variant={!category && tier !== "S" ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategory("")}
          className="shrink-0"
        >
          全部
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={cat === category ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategory(cat)}
            className="shrink-0"
          >
            {cat}
          </Button>
        ))}
      </ScrollFade>

      {/* Results count */}
      <p
        className={cn(
          "text-sm text-muted-foreground transition-opacity",
          isPending && "opacity-50",
        )}
      >
        {q || category
          ? `找到 ${totalCount} 个 MCP Server`
          : `共 ${totalCount} 个 MCP Server`}
      </p>
    </div>
  );
}
