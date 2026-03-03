import { Badge } from "@/components/ui/badge";
import { SecurityBadge } from "@/components/shared/security-badge";
import { Star, Download } from "lucide-react";
import type { Skill } from "@/data/types";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const sourceLabels: Record<string, string> = {
  clawhub: "ClawHub",
  anthropic: "Anthropic",
  skills_sh: "Skills.sh",
  skillsmp: "SkillsMP",
  agentskill: "AgentSkill",
  manual: "手动收录",
};

interface SkillMetaProps {
  skill: Skill;
}

export function SkillMeta({ skill }: SkillMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <Badge variant="secondary">{skill.category}</Badge>
      <SecurityBadge score={skill.securityScore} />
      <span className="flex items-center gap-1">
        <Star className="size-3.5" />
        {formatNumber(skill.stars)}
      </span>
      <span className="flex items-center gap-1">
        <Download className="size-3.5" />
        {formatNumber(skill.downloads)}
      </span>
      <span>{sourceLabels[skill.source] ?? skill.source}</span>
    </div>
  );
}
