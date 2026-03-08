import Link from "next/link";
import { Wrench, FileText, Rss, RefreshCw } from "lucide-react";

const stats = [
  {
    label: "精选工具",
    value: "168+",
    icon: Wrench,
    href: "/skills",
  },
  {
    label: "翻译资讯",
    value: "270+",
    icon: FileText,
    href: "/articles",
  },
  {
    label: "一手信源",
    value: "13",
    icon: Rss,
    href: "/about",
  },
  {
    label: "更新频率",
    value: "每日",
    icon: RefreshCw,
    href: "/articles",
  },
];

export function StatsBar() {
  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4">
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
    </section>
  );
}
