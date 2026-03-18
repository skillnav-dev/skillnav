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
import { skillsSearchParams } from "@/lib/skills-search-params";
import { ScrollFade } from "@/components/shared/scroll-fade";
import { cn } from "@/lib/utils";

interface SkillsToolbarProps {
  categories: string[];
  totalCount: number;
  isRepoView?: boolean;
}

const TAB_OPTIONS = [
  { value: "", label: "按仓库" },
  { value: "featured", label: "精选" },
  { value: "latest", label: "最新" },
];

export function SkillsToolbar({
  categories,
  totalCount,
  isRepoView,
}: SkillsToolbarProps) {
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useQueryState(
    "q",
    skillsSearchParams.q.withOptions({
      shallow: false,
      throttleMs: 300,
      startTransition,
    }),
  );

  const [category, setCategory] = useQueryState(
    "category",
    skillsSearchParams.category.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [tab, setTab] = useQueryState(
    "tab",
    skillsSearchParams.tab.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [sort, setSort] = useQueryState(
    "sort",
    skillsSearchParams.sort.withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [, setPage] = useQueryState(
    "page",
    skillsSearchParams.page.withOptions({
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

  function handleTab(t: string) {
    setTab(t || null);
    // When switching to "latest" tab, also set sort to latest
    if (t === "latest") {
      setSort("latest");
    } else if (sort === "latest" && t !== "latest") {
      setSort(null);
    }
    setPage(1);
  }

  function handleSort(value: string) {
    setSort(value === "latest" ? "latest" : null);
    setPage(1);
  }

  function handleClear() {
    setQ(null);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Tabs row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-md bg-muted p-1">
          {TAB_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={(tab || "") === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTab(opt.value)}
              className="rounded-sm"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search + sort — hidden in repo index view */}
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center",
          isRepoView && "hidden",
        )}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索 Skills..."
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
          <Select
            value={sort === "latest" ? "latest" : "stars"}
            onValueChange={handleSort}
          >
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
      </div>

      {/* Category filters — hidden in repo index view */}
      <ScrollFade className={isRepoView ? "hidden" : undefined}>
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
            {cat}
          </Button>
        ))}
      </ScrollFade>

      {/* Results count — hidden in repo index view */}
      {!isRepoView && (
        <p
          className={cn(
            "text-sm text-muted-foreground transition-opacity",
            isPending && "opacity-50",
          )}
        >
          {q || category || tab
            ? `找到 ${totalCount} 个 Skills`
            : `共 ${totalCount} 个 Skills`}
        </p>
      )}
    </div>
  );
}
