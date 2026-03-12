import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FreshnessBadge } from "@/components/shared/freshness-badge";
import { PlatformBadge } from "@/components/skills/platform-badge";
import { Star, Award } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Skill } from "@/data/types";

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/skills/${skill.slug}`}
              className="line-clamp-1 text-base font-semibold transition-colors after:absolute after:inset-0 group-hover:text-primary"
            >
              {skill.nameZh ?? skill.name}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              by {skill.author}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <PlatformBadge platform={skill.platform} />
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
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
            {skill.qualityTier === "S" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-100 text-amber-800 text-xs dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <Award className="mr-0.5 size-3" />
                编辑精选
              </Badge>
            )}
            {skill.qualityTier === "A" && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-50 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                精选
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
