import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/shared/freshness-badge";
import { PlatformBadge } from "@/components/skills/platform-badge";
import { SecurityBadge } from "@/components/shared/security-badge";
import { Star, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Skill } from "@/data/types";

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold">
              <Link
                href={`/skills/${skill.slug}`}
                className="line-clamp-1 transition-colors after:absolute after:inset-0 group-hover:text-primary"
              >
                {skill.nameZh ?? skill.name}
              </Link>
            </h3>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">by {skill.author}</p>
              {skill.platform && <PlatformBadge platform={skill.platform} />}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <FreshnessBadge
              freshness={skill.freshness}
              isTrending={skill.isTrending}
              discoveredAt={skill.discoveredAt}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {skill.introZh ?? skill.descriptionZh ?? skill.description}
        </p>
        {skill.editorCommentZh && (
          <p className="line-clamp-1 text-xs italic text-muted-foreground">
            ✎ {skill.editorCommentZh}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
            {skill.qualityTier === "S" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-100 text-amber-900 text-xs dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <Award className="mr-0.5 size-3" />
                编辑精选
              </Badge>
            )}
            {skill.qualityTier === "A" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-50 text-amber-600 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                精选
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {skill.securityScore && (
              <SecurityBadge
                score={skill.securityScore}
                className="text-[10px]"
              />
            )}
            {skill.stars > 0 && (
              <span className="flex items-center gap-1">
                <Star className="size-3" />
                {formatNumber(skill.stars)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
