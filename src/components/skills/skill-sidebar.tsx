import Link from "next/link";
import {
  ExternalLink,
  Github,
  Star,
  Tag,
  Clock,
  Calendar,
  GitFork,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SecurityBadge } from "@/components/shared/security-badge";
import { PlatformBadge } from "@/components/skills/platform-badge";
import { formatNumber } from "@/lib/utils";
import type { Skill } from "@/data/types";

const sourceLabels: Record<string, string> = {
  clawhub: "ClawHub",
  anthropic: "Anthropic",
  skills_sh: "Skills.sh",
  skillsmp: "SkillsMP",
  agentskill: "AgentSkill",
  manual: "手动收录",
  curated: "精选收录",
};

const pricingLabels: Record<string, string> = {
  free: "免费",
  freemium: "免费 + 付费",
  paid: "付费",
};

interface SkillSidebarProps {
  skill: Skill;
}

/** A single labeled row in the sidebar metadata list */
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

export function SkillSidebar({ skill }: SkillSidebarProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {/* Metadata card */}
      <div className="rounded-xl border border-border/40 bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold">详情</h3>
        <div className="divide-y divide-border/40">
          {/* Platform */}
          {skill.platform && skill.platform.length > 0 && (
            <MetaRow label="平台">
              <PlatformBadge platform={skill.platform} />
            </MetaRow>
          )}

          {/* Category with link */}
          <MetaRow label="分类">
            <Link
              href={`/skills?category=${encodeURIComponent(skill.category)}`}
              className="text-primary hover:underline"
            >
              {skill.category}
            </Link>
          </MetaRow>

          {/* Source platform */}
          <MetaRow label="来源">
            {sourceLabels[skill.source] ?? skill.source}
          </MetaRow>

          {/* Repo source */}
          {skill.repoSource && (
            <MetaRow label="源仓库">
              <a
                href={`https://github.com/${skill.repoSource}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <GitFork className="size-3" />
                {skill.repoSource}
              </a>
            </MetaRow>
          )}

          {/* Security score */}
          <div className="flex items-start justify-between gap-2 py-2">
            <span className="text-xs text-muted-foreground">安全评分</span>
            <SecurityBadge score={skill.securityScore} />
          </div>

          {/* Stars */}
          {skill.stars > 0 && (
            <MetaRow label="Stars">
              <span className="flex items-center gap-1">
                <Star className="size-3 text-muted-foreground" />
                {formatNumber(skill.stars)}
              </span>
            </MetaRow>
          )}

          {/* Version (conditional) */}
          {skill.version && (
            <MetaRow label="版本">
              <Badge variant="outline" className="text-xs">
                v{skill.version}
              </Badge>
            </MetaRow>
          )}

          {/* Pricing type (conditional) */}
          {skill.pricingType && (
            <MetaRow label="定价">
              {pricingLabels[skill.pricingType] ?? skill.pricingType}
            </MetaRow>
          )}

          {/* Created date */}
          <MetaRow label="收录日期">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              {new Date(skill.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </MetaRow>

          {/* Last verified date (conditional) */}
          {skill.lastVerifiedAt && (
            <MetaRow label="最后验证">
              <span className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                {new Date(skill.lastVerifiedAt).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </MetaRow>
          )}
        </div>
      </div>

      {/* Tags card (conditional) */}
      {skill.tags.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-6">
          <div className="mb-3 flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">标签</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skill.tags.map((tag) => (
              <Link key={tag} href={`/skills?q=${encodeURIComponent(tag)}`}>
                <Badge
                  variant="outline"
                  className="text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* External links card (conditional) */}
      {(skill.sourceUrl || skill.githubUrl) && (
        <div className="rounded-xl border border-border/40 bg-card p-6">
          <h3 className="mb-3 text-sm font-semibold">链接</h3>
          <div className="space-y-2">
            {skill.sourceUrl && (
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                查看来源
              </a>
            )}
            {skill.githubUrl && (
              <a
                href={skill.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Github className="size-4 shrink-0 text-muted-foreground" />
                GitHub
              </a>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
