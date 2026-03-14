"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Wrench } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { formatNumber } from "@/lib/utils";
import type { Skill, McpServer } from "@/data/types";

const TABS = [
  { key: "skills", label: "Skills", href: "/skills" },
  { key: "mcp", label: "MCP Servers", href: "/mcp" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface FeaturedToolsProps {
  skills: Skill[];
  mcpServers: McpServer[];
}

// Extract initials: "Filesystem MCP" → "FM", "supabase" → "SU"
function getInitials(name: string): string {
  const words = name.split(/[\s\-_/]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function FeaturedTools({ skills, mcpServers }: FeaturedToolsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("skills");
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <SectionHeader
            title="精选工具"
            description="编辑推荐的高质量 AI Agent 工具"
          />
          <Link
            href={currentTab.href}
            className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
          >
            查看全部
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Tab switcher */}
        <div className="mt-6 flex gap-1 border-b border-border/40">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skills list */}
        <div className={activeTab === "skills" ? "mt-1" : "hidden"}>
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.slug}`}
              className="group flex items-center gap-3 border-b border-border/30 px-1 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(skill.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                    {skill.nameZh ?? skill.name}
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    by {skill.author}
                  </span>
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {skill.introZh ?? skill.descriptionZh ?? skill.description}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                {skill.stars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    {formatNumber(skill.stars)}
                  </span>
                )}
                <ArrowRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* MCP list */}
        <div className={activeTab === "mcp" ? "mt-1" : "hidden"}>
          {mcpServers.map((server) => (
            <Link
              key={server.id}
              href={`/mcp/${server.slug}`}
              className="group flex items-center gap-3 border-b border-border/30 px-1 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(server.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                    {server.nameZh ?? server.name}
                  </span>
                  {server.author && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      by {server.author}
                    </span>
                  )}
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {server.introZh ??
                    server.descriptionZh ??
                    server.description ??
                    ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                {server.toolsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Wrench className="size-3" />
                    {server.toolsCount}
                  </span>
                )}
                {server.stars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    {formatNumber(server.stars)}
                  </span>
                )}
                <ArrowRight className="size-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Link
            href={currentTab.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            查看全部{activeTab === "skills" ? " Skills" : " MCP"}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
