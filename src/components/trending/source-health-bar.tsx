import type { SourceHealth } from "@/lib/trending-data";

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export function SourceHealthBar({ health }: { health: SourceHealth }) {
  const items = [
    { label: `${health.rss} 信息源`, ok: health.rss > 0 },
    { label: `X ${health.x}条`, ok: health.x > 0 },
    { label: `HN ${health.hn}条`, ok: health.hn > 0 },
    { label: `Reddit ${health.reddit}条`, ok: health.reddit > 0 },
    { label: "HF 论文", ok: health.hf },
  ];

  const timeAgo = health.lastUpdated
    ? formatTimeAgo(new Date(health.lastUpdated))
    : "未知";

  return (
    <div className="mt-10 rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/70">感知网络</span>
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${item.ok ? "bg-emerald-500" : "bg-red-500"}`}
            />
            {item.label}
          </span>
        ))}
        <span className="ml-auto">
          覆盖 {health.totalToday} 条 · 最后更新 {timeAgo}
        </span>
      </div>
    </div>
  );
}
