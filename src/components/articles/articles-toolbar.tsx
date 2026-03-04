"use client";

import { useTransition } from "react";
import { useQueryState } from "nuqs";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { articlesSearchParams } from "@/lib/articles-search-params";
import {
  ARTICLE_TYPE_LABELS,
  ARTICLE_SOURCE_LABELS,
} from "@/lib/article-constants";
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

  function handleSource(src: string) {
    setSource(src === source ? null : src || null);
    setPage(1);
  }

  function handleClear() {
    setQ(null);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
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
      </div>

      {/* Source filters */}
      {sources.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Button
            variant={!source ? "default" : "outline"}
            size="sm"
            onClick={() => handleSource("")}
            className="shrink-0"
          >
            全部来源
          </Button>
          {sources.map((src) => (
            <Button
              key={src}
              variant={src === source ? "default" : "outline"}
              size="sm"
              onClick={() => handleSource(src)}
              className="shrink-0"
            >
              {ARTICLE_SOURCE_LABELS[src] ?? src}
            </Button>
          ))}
        </div>
      )}

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
