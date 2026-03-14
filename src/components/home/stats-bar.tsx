import Link from "next/link";
import { Wrench, FileText, Server, RefreshCw } from "lucide-react";
import {
  getSkillsCount,
  getMcpServersCount,
  getArticlesCount,
} from "@/lib/data";

// Format number as friendly string: 5172 → "5,100+", 309 → "300+", 99 → "99"
function formatCount(n: number): string {
  if (n >= 1000) {
    const hundreds = Math.floor(n / 100) * 100;
    return `${hundreds.toLocaleString("en-US")}+`;
  }
  if (n >= 100) {
    const tens = Math.floor(n / 100) * 100;
    return `${tens}+`;
  }
  return String(n);
}

export async function StatsBar() {
  const [skillsCount, mcpCount, articlesCount] = await Promise.all([
    getSkillsCount(),
    getMcpServersCount(),
    getArticlesCount(),
  ]);

  const stats = [
    {
      label: "精选工具",
      value: formatCount(skillsCount),
      icon: Wrench,
      href: "/skills",
    },
    {
      label: "MCP 工具",
      value: formatCount(mcpCount),
      icon: Server,
      href: "/mcp",
    },
    {
      label: "翻译资讯",
      value: formatCount(articlesCount),
      icon: FileText,
      href: "/articles",
    },
    {
      label: "更新频率",
      value: "每日",
      icon: RefreshCw,
      href: "/articles",
    },
  ];

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="flex items-center gap-3 rounded-lg transition-colors hover:bg-muted/50"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <stat.icon className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
