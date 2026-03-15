import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SecurityScore } from "@/data/types";

const config: Record<
  SecurityScore,
  { label: string; className: string; icon: typeof Shield }
> = {
  safe: {
    label: "安全",
    className: "bg-safe/15 text-safe border-safe/30",
    icon: ShieldCheck,
  },
  warning: {
    label: "注意",
    className: "bg-warning/15 text-warning border-warning/30",
    icon: ShieldAlert,
  },
  danger: {
    label: "风险",
    className: "bg-danger/15 text-danger border-danger/30",
    icon: ShieldX,
  },
  unscanned: {
    label: "未扫描",
    className: "bg-unscanned/15 text-unscanned border-unscanned/30",
    icon: Shield,
  },
};

interface SecurityBadgeProps {
  score: SecurityScore;
  className?: string;
}

export function SecurityBadge({ score, className }: SecurityBadgeProps) {
  const { label, className: badgeClass, icon: Icon } = config[score];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border font-medium", badgeClass, className)}
    >
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
