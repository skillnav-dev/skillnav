"use client";

import { Award } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import { siteConfig } from "@/lib/constants";
import { badgeMarkdown, type BadgeType } from "@/lib/badge-svg";
import { trackEvent } from "@/lib/track";

interface CuratedBadgeCardProps {
  type: BadgeType;
  slug: string;
}

/** Sidebar card: preview the "SkillNav 精选" badge and copy its README Markdown. */
export function CuratedBadgeCard({ type, slug }: CuratedBadgeCardProps) {
  const markdown = badgeMarkdown(siteConfig.url, type, slug);

  return (
    <div className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <Award className="size-3.5 text-muted-foreground" />
        <h3 className="text-sm font-semibold">精选徽章</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        你是作者？把徽章贴进 README，告诉用户它通过了 SkillNav 精选。
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny SVG badge */}
      <img
        src={`/badge/${type}/${slug}.svg`}
        alt="SkillNav 精选"
        height={20}
        className="mb-3 h-5 w-auto"
      />
      <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 ring-1 ring-border">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {markdown}
        </code>
        <CopyButton
          text={markdown}
          className="h-7 w-7 shrink-0"
          onCopy={() => trackEvent("badge-copy", { type, slug })}
        />
      </div>
    </div>
  );
}
