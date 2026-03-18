import Link from "next/link";
import {
  Database,
  FolderOpen,
  Search,
  Code,
  Bot,
  BookOpen,
  Newspaper,
  Globe,
} from "lucide-react";

const SCENARIOS = [
  {
    label: "让 AI 操作数据库",
    description: "PostgreSQL · SQLite · Supabase",
    href: "/mcp?category=数据与存储",
    icon: Database,
  },
  {
    label: "让 AI 读写文件",
    description: "Filesystem · Google Drive · S3",
    href: "/mcp?category=数据与存储&q=file",
    icon: FolderOpen,
  },
  {
    label: "让 AI 搜索互联网",
    description: "Exa · Brave Search · Tavily",
    href: "/mcp?category=搜索与获取",
    icon: Search,
  },
  {
    label: "让 AI 操作浏览器",
    description: "Puppeteer · Playwright · Browserbase",
    href: "/mcp?q=browser",
    icon: Globe,
  },
  {
    label: "给 Claude Code 加技能",
    description: "7 个仓库 · 168 个 Skills",
    href: "/skills",
    icon: Code,
  },
  {
    label: "构建 AI Agent",
    description: "LangChain · CrewAI · Agent SDK",
    href: "/mcp?category=AI 与智能体",
    icon: Bot,
  },
  {
    label: "了解 AI Agent 基础",
    description: "MCP · RAG · Agent · Tool Use",
    href: "/learn",
    icon: BookOpen,
  },
  {
    label: "本周有什么新工具",
    description: "每周一更新",
    href: "/weekly",
    icon: Newspaper,
  },
] as const;

export function ScenarioShortcuts() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
        你想做什么？
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SCENARIOS.map(({ label, description, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-start gap-3 rounded-xl border border-border/40 p-3 transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Icon className="size-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight group-hover:text-primary">
                {label}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
