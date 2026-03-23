import Link from "next/link";
import { Star, Github, ExternalLink, Tag, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { McpServer } from "@/data/types";

const freshnessLabels: Record<string, string> = {
  fresh: "近期更新",
  active: "活跃维护",
  stale: "更新较慢",
  archived: "已归档",
};

const sourceLabels: Record<string, string> = {
  "official-registry": "官方注册表",
  smithery: "Smithery",
  glama: "Glama",
  manual: "手动收录",
};

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{children}</span>
    </div>
  );
}

interface McpDetailSidebarProps {
  server: McpServer;
}

export function McpDetailSidebar({ server }: McpDetailSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {/* Metadata card */}
      <div className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">详情</h3>
        <div className="divide-y divide-border/40">
          {server.category && (
            <MetaRow label="分类">
              <Link
                href={`/mcp?category=${encodeURIComponent(server.category)}`}
                className="text-primary hover:underline"
              >
                {server.category}
              </Link>
            </MetaRow>
          )}
          {server.source && (
            <MetaRow label="来源">
              {sourceLabels[server.source] ?? server.source}
            </MetaRow>
          )}
          {server.stars > 0 && (
            <MetaRow label="Stars">
              <span className="flex items-center gap-1">
                <Star className="size-3 text-muted-foreground" />
                {formatNumber(server.stars)}
              </span>
            </MetaRow>
          )}
          {server.toolsCount > 0 && (
            <MetaRow label="工具数">{server.toolsCount}</MetaRow>
          )}
          {server.version && (
            <MetaRow label="版本">
              <Badge variant="outline" className="text-xs">
                v{server.version}
              </Badge>
            </MetaRow>
          )}
          {server.isVerified && (
            <MetaRow label="状态">
              <Badge variant="secondary" className="text-xs">
                已验证
              </Badge>
            </MetaRow>
          )}
          <MetaRow label="活跃度">
            {freshnessLabels[server.freshness] ?? server.freshness}
          </MetaRow>
          <MetaRow label="收录日期">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              {new Date(server.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </MetaRow>
          {server.pushedAt && (
            <MetaRow label="最后推送">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                {new Date(server.pushedAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </MetaRow>
          )}
        </div>
      </div>

      {/* Tags card */}
      {server.tags.length > 0 && (
        <div className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">标签</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {server.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* External links card */}
      {(server.sourceUrl || server.githubUrl) && (
        <div className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">链接</h3>
          <div className="space-y-2">
            {server.githubUrl && (
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Github className="size-4 shrink-0 text-muted-foreground" />
                GitHub
              </a>
            )}
            {server.sourceUrl && (
              <a
                href={server.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                查看来源
              </a>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
