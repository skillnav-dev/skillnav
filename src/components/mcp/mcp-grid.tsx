"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MCPCard } from "@/components/mcp/mcp-card";
import { mcpServers, MCP_CATEGORIES } from "@/data/mcp-servers";

export function MCPGrid() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");

  const filtered = useMemo(() => {
    return mcpServers.filter((s) => {
      // Category filter
      if (category !== "全部" && s.category !== category) return false;
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.nameZh.includes(q) ||
          s.descriptionZh.includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.author.toLowerCase().includes(q)
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
            placeholder="搜索 MCP Server..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MCP_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        共 {filtered.length} 个 MCP Server
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((server) => (
            <MCPCard key={server.slug} server={server} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          没有找到匹配的 MCP Server
        </div>
      )}
    </div>
  );
}
