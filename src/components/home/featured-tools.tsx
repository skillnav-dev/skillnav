"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { SkillCard } from "@/components/skills/skill-card";
import { MCPCard } from "@/components/mcp/mcp-card";
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

        {/* Skills grid - pre-rendered, toggle visibility */}
        <div
          className={
            activeTab === "skills"
              ? "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "hidden"
          }
        >
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>

        {/* MCP grid - pre-rendered, toggle visibility */}
        <div
          className={
            activeTab === "mcp"
              ? "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "hidden"
          }
        >
          {mcpServers.map((server) => (
            <MCPCard key={server.id} server={server} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
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
