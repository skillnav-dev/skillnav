import Link from "next/link";
import {
  Code,
  Bot,
  Database,
  Search,
  Cloud,
  Pencil,
  Zap,
  Shield,
  Plug,
  Building2,
} from "lucide-react";

const SCENARIOS = [
  { label: "编码与调试", slug: "编码与调试", icon: Code },
  { label: "AI 与智能体", slug: "AI 与智能体", icon: Bot },
  { label: "数据与存储", slug: "数据与存储", icon: Database },
  { label: "搜索与获取", slug: "搜索与获取", icon: Search },
  { label: "DevOps", slug: "DevOps", icon: Cloud },
  { label: "内容与创意", slug: "内容与创意", icon: Pencil },
  { label: "效率与工作流", slug: "效率与工作流", icon: Zap },
  { label: "安全与合规", slug: "安全与合规", icon: Shield },
  { label: "平台与服务", slug: "平台与服务", icon: Plug },
  { label: "行业场景", slug: "行业场景", icon: Building2 },
] as const;

export function ScenarioShortcuts() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
        {SCENARIOS.map(({ label, slug, icon: Icon }) => (
          <Link
            key={slug}
            href={`/skills?category=${encodeURIComponent(slug)}`}
            className="group flex flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-muted/50"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Icon className="size-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
