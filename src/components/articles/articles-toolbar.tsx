"use client";

import { useTransition } from "react";
import { useQueryState } from "nuqs";
import { Search, X, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { articlesSearchParams } from "@/lib/articles-search-params";
import {
  ARTICLE_TYPE_LABELS,
  ARTICLE_SOURCE_LABELS,
} from "@/lib/article-constants";
import { ScrollFade } from "@/components/shared/scroll-fade";
import { cn } from "@/lib/utils";

interface ArticlesToolbarProps {
  categories: string[];
  sources: string[];
  totalCount: number;
}

export function ArticlesToolbar({
  categories,
  sources,
  totalCount,
}: ArticlesToolbarProps) {
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useQueryState(
    "q",
    articlesSearchParams.q.withOptions({
      shallow: false,
      throttleMs: 300,
      startTransition,
    }),
  );

  const [category, setCategory] = useQueryState(
    "category",
    articlesSearchParams.category.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [source, setSource] = useQueryState(
    "source",
    articlesSearchParams.source.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [sort, setSort] = useQueryState(
    "sort",
    articlesSearchParams.sort.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [, setPage] = useQueryState(
    "page",
    articlesSearchParams.page.withOptions({
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

  function handleSource(value: string) {
    setSource(value === "all" ? null : value);
    setPage(1);
  }

  function handleSort(value: string) {
    setSort(value === "latest" ? null : value);
    setPage(1);
  }

  function handleClear() {
    setQ(null);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Search + sort + source */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索文章..."
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
        <div className="flex w-full gap-2 sm:w-auto">
          {sources.length > 0 && (
            <Select value={source || "all"} onValueChange={handleSource}>
              <SelectTrigger className="h-10 w-full sm:w-[140px]">
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
          )}
          <Select value={sort || "latest"} onValueChange={handleSort}>
            <SelectTrigger className="h-10 w-full sm:w-[120px]">
              <ArrowUpDown className="mr-1 size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新优先</SelectItem>
              <SelectItem value="oldest">最早优先</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category filters */}
      <ScrollFade>
        <Button
          variant={!category ? "default" : "outline"}
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
            {ARTICLE_TYPE_LABELS[cat as keyof typeof ARTICLE_TYPE_LABELS] ??
              cat}
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
        {q || category || source
          ? `找到 ${totalCount} 篇文章`
          : `共 ${totalCount} 篇文章`}
      </p>
    </div>
  );
}
