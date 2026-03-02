import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecurityBadge } from "@/components/shared/security-badge";
import { Star, Download } from "lucide-react";
import type { Skill } from "@/data/types";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

interface SkillCardProps {
  skill: Skill;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/skills/${skill.slug}`}
              className="line-clamp-1 text-base font-semibold transition-colors group-hover:text-primary"
            >
              {skill.nameZh ?? skill.name}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              by {skill.author}
            </p>
          </div>
          <SecurityBadge score={skill.securityScore} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {skill.descriptionZh ?? skill.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {skill.category}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="size-3" />
              {formatNumber(skill.stars)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="size-3" />
              {formatNumber(skill.downloads)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
