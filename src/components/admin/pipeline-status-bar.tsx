import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStatus } from "@/lib/data/admin";

interface PipelineStatusBarProps {
  pipelines: PipelineStatus[];
}

const STATUS_CONFIG = {
  success: { color: "bg-green-500", label: "成功" },
  partial: { color: "bg-yellow-500", label: "部分成功" },
  failure: { color: "bg-red-500", label: "失败" },
  skipped: { color: "bg-blue-400", label: "跳过" },
} as const;

function getRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export function PipelineStatusBar({ pipelines }: PipelineStatusBarProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          管线状态
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {pipelines.map((p) => {
            const config = p.status ? STATUS_CONFIG[p.status] : null;
            return (
              <div key={p.pipeline} className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${config?.color ?? "bg-gray-300"}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.label}</p>
                  {p.status ? (
                    <p className="text-xs text-muted-foreground">
                      {config!.label}{" "}
                      {p.started_at && getRelativeTime(p.started_at)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无数据</p>
                  )}
                  {(p.status === "failure" || p.status === "partial") &&
                    p.error_msg && (
                      <p className="mt-0.5 truncate text-xs text-destructive">
                        {p.error_msg.slice(0, 50)}
                      </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
