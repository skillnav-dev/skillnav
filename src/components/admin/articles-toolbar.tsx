"use client";

import { useTransition } from "react";
import { useQueryState } from "nuqs";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminArticlesSearchParams } from "@/lib/admin-search-params";
import { ARTICLE_SOURCE_LABELS } from "@/lib/article-constants";

interface AdminArticlesToolbarProps {
  sources: string[];
}

export function AdminArticlesToolbar({ sources }: AdminArticlesToolbarProps) {
  const [, startTransition] = useTransition();

  const [search, setSearch] = useQueryState(
    "search",
    adminArticlesSearchParams.search.withOptions({
      shallow: false,
      throttleMs: 300,
      startTransition,
    }),
  );

  const [source, setSource] = useQueryState(
    "source",
    adminArticlesSearchParams.source.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [, setPage] = useQueryState(
    "page",
    adminArticlesSearchParams.page.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  function handleSearch(value: string) {
    setSearch(value || null);
    setPage(1);
  }

  function handleSourceChange(value: string) {
    setSource(value === "all" ? null : value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索文章标题..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-9 pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Source filter */}
      <Select value={source || "all"} onValueChange={handleSourceChange}>
        <SelectTrigger className="h-9 w-full sm:w-[180px]">
          <SelectValue placeholder="全部来源" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部来源</SelectItem>
          {sources.map((src) => (
            <SelectItem key={src} value={src}>
              {ARTICLE_SOURCE_LABELS[src] ?? src}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
