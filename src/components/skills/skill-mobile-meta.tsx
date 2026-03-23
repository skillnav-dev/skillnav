import Link from "next/link";
import { Star, Calendar } from "lucide-react";
import { SecurityBadge } from "@/components/shared/security-badge";
import { formatNumber } from "@/lib/utils";
import type { Skill } from "@/data/types";

interface SkillMobileMetaProps {
  skill: Skill;
}

/**
 * Compact metadata bar shown below the title on mobile (hidden on lg+).
 * Displays key info so users don't have to scroll past the full content
 * to reach the sidebar on small screens.
 */
export function SkillMobileMetaBar({ skill }: SkillMobileMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg ring-1 ring-gray-950/10 bg-card px-4 py-3 text-xs lg:hidden dark:ring-gray-50/10">
      {/* Stars */}
      {skill.stars > 0 && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Star className="size-3.5" />
          <span className="font-medium text-foreground">
            {formatNumber(skill.stars)}
          </span>
        </span>
      )}

      {/* Category */}
      <Link
        href={`/skills?category=${encodeURIComponent(skill.category)}`}
        className="text-primary hover:underline"
      >
        {skill.category}
      </Link>

      {/* Security score */}
      <SecurityBadge score={skill.securityScore} />

      {/* Created date */}
      <span className="flex items-center gap-1 text-muted-foreground">
        <Calendar className="size-3" />
        {new Date(skill.createdAt).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    </div>
  );
}
