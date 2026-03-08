import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecurityBadge } from "@/components/shared/security-badge";
import { PlatformBadge } from "@/components/skills/platform-badge";
import { Star, GitFork } from "lucide-react";
import type { Skill } from "@/data/types";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const repoSourceLabels: Record<string, string> = {
  "anthropics/skills": "Anthropic",
  "openai/codex": "OpenAI",
  "daymade/claude-code-skills": "daymade",
  "levnikolaevich/claude-code-skills": "levnikolaevich",
};

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
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
            <SecurityBadge score={skill.securityScore} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {skill.descriptionZh ?? skill.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
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
            {skill.repoSource && (
              <span className="flex items-center gap-1">
                <GitFork className="size-3" />
                {repoSourceLabels[skill.repoSource] ?? skill.repoSource}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
