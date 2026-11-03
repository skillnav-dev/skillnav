"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HackerAgainCard } from "@/components/hackeragain/hackeragain-card";
import {
  HACKERAGAIN_CATEGORIES,
  HACKERAGAIN_REFERENCE,
  hackerAgainSites,
  type HackerAgainCategoryFilter,
} from "@/data/hackeragain-sites";

export function HackerAgainGrid() {
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<HackerAgainCategoryFilter>("全部");

  const filtered = useMemo(() => {
    return hackerAgainSites.filter((site) => {
      if (category !== "全部" && site.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        site.nameZh.toLowerCase().includes(q) ||
        (site.nameEn?.toLowerCase().includes(q) ?? false) ||
        site.blurbZh.toLowerCase().includes(q) ||
        site.category.includes(q) ||
        site.url.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索站名、简介、品类..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {HACKERAGAIN_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        共 {filtered.length} 个站点
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((site) => (
            <HackerAgainCard key={site.slug} site={site} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          没有找到匹配的站点
        </div>
      )}

      <p className="border-t pt-6 text-sm text-muted-foreground">
        延伸阅读：
        <a
          href={HACKERAGAIN_REFERENCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-foreground underline-offset-2 hover:underline"
        >
          {HACKERAGAIN_REFERENCE.titleZh}
        </a>
      </p>
    </div>
  );
}
