"use client";

import { useTransition } from "react";
import { useQueryState } from "nuqs";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { articlesSearchParams } from "@/lib/articles-search-params";
import { cn } from "@/lib/utils";

// Category Chinese display labels
const CATEGORY_LABELS: Record<string, string> = {
  news: "新闻",
  tutorial: "教程",
  analysis: "分析",
  review: "评测",
  comparison: "对比",
  weekly: "周刊",
};

interface ArticlesToolbarProps {
  categories: string[];
  totalCount: number;
}

export function ArticlesToolbar({
  categories,
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
            {CATEGORY_LABELS[cat] ?? cat}
          </Button>
        ))}
      </div>

      {/* Results count */}
      <p
        className={cn(
          "text-sm text-muted-foreground transition-opacity",
          isPending && "opacity-50",
        )}
      >
        {q || category
          ? `找到 ${totalCount} 篇文章`
          : `共 ${totalCount} 篇文章`}
      </p>
    </div>
  );
}
