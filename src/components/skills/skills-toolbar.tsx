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
import { cn } from "@/lib/utils";

interface SkillsToolbarProps {
  categories: string[];
  platforms: string[];
  totalCount: number;
}

const TAB_OPTIONS = [
  { value: "", label: "全部" },
  { value: "featured", label: "精选" },
  { value: "latest", label: "最新" },
];

const PLATFORM_OPTIONS = [
  { value: "all", label: "全部平台" },
  { value: "claude", label: "Claude" },
  { value: "codex", label: "Codex" },
  { value: "universal", label: "Universal" },
];

export function SkillsToolbar({
  categories,
  platforms,
  totalCount,
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

  const [platform, setPlatform] = useQueryState(
    "platform",
    skillsSearchParams.platform.withOptions({
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

  function handlePlatform(p: string) {
    setPlatform(p === "all" ? null : p);
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
            <button
              key={opt.value}
              onClick={() => handleTab(opt.value)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                (tab || "") === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + platform + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {platforms.length > 0 && (
            <Select value={platform || "all"} onValueChange={handlePlatform}>
              <SelectTrigger className="h-10 w-[140px]">
                <SelectValue placeholder="全部平台" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={sort === "latest" ? "latest" : "stars"}
            onValueChange={handleSort}
          >
            <SelectTrigger className="h-10 w-[120px]">
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
            {cat}
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
        {q || category || platform || tab
          ? `找到 ${totalCount} 个 Skills`
          : `共 ${totalCount} 个 Skills`}
      </p>
    </div>
  );
}
