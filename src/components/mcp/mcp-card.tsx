"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Check, ExternalLink, Wrench, Award } from "lucide-react";
import { FreshnessBadge } from "@/components/shared/freshness-badge";
import { formatNumber } from "@/lib/utils";
import type { McpServer } from "@/data/types";

interface MCPCardProps {
  server: McpServer;
}

export function MCPCard({ server }: MCPCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!server.installCommand) return;
    await navigator.clipboard.writeText(server.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">
                <Link
                  href={`/mcp/${server.slug}`}
                  className="transition-colors after:absolute after:inset-0 group-hover:text-primary"
                >
                  {server.nameZh ?? server.name}
                </Link>
              </h3>
              {server.qualityTier === "S" && (
                <Badge
                  variant="secondary"
                  className="border-amber-200 bg-amber-100 text-amber-800 text-xs dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <Award className="mr-0.5 size-3" />
                  编辑精选
                </Badge>
              )}
              {server.isFeatured && server.qualityTier !== "S" && (
                <Badge
                  variant="secondary"
                  className="border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                >
                  精选
                </Badge>
              )}
            </div>
            {server.author && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                by {server.author}
              </p>
            )}
          </div>
          <div className="relative z-10 flex items-center gap-1.5">
            <FreshnessBadge
              freshness={server.freshness}
              isTrending={server.isTrending}
              discoveredAt={server.discoveredAt}
            />
            {server.githubUrl && (
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`${server.name} GitHub`}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {server.introZh ?? server.descriptionZh ?? server.description ?? ""}
        </p>
        {server.editorCommentZh && (
          <p className="line-clamp-1 text-xs italic text-muted-foreground/70">
            {server.editorCommentZh}
          </p>
        )}
        {/* Install command */}
        {server.installCommand && (
          <button
            onClick={handleCopy}
            className="relative z-10 flex w-full items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-left text-xs font-mono text-muted-foreground transition-colors hover:bg-muted"
          >
            <code className="min-w-0 flex-1 truncate">
              {server.installCommand}
            </code>
            {copied ? (
              <Check className="size-3.5 shrink-0 text-green-600" />
            ) : (
              <Copy className="size-3.5 shrink-0" />
            )}
          </button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {server.category && (
              <Badge variant="secondary" className="text-xs">
                {server.category}
              </Badge>
            )}
            {server.toolsCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Wrench className="size-3" />
                {server.toolsCount} 个工具
              </span>
            )}
          </div>
          {server.stars > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3" />
              {formatNumber(server.stars)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
