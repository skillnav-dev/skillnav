"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GitHubCard } from "@/components/github/github-card";
import { githubProjects, GITHUB_CATEGORIES } from "@/data/github-projects";

export function GitHubGrid() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");

  const filtered = useMemo(() => {
    return githubProjects.filter((p) => {
      // Category filter
      if (category !== "全部" && p.category !== category) return false;
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.nameZh.includes(q) ||
          p.descriptionZh.includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.repo.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [search, category]);

  return (
    <div className="mt-6 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索项目名、描述、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {GITHUB_CATEGORIES.map((cat) => (
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        共 {filtered.length} 个项目
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <GitHubCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          没有找到匹配的项目
        </div>
      )}
    </div>
  );
}
