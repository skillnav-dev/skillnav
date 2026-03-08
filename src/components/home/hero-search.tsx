"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/skills?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative mx-auto max-w-lg">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="搜索 Skills、文章、MCP Server..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-11 pl-9 pr-4"
      />
    </form>
  );
}
