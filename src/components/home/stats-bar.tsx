import { Shield, Package, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    label: "Skills 收录",
    value: "13,000+",
    icon: Package,
  },
  {
    label: "安全已审计",
    value: "8,500+",
    icon: Shield,
  },
  {
    label: "月活跃用户",
    value: "25,000+",
    icon: Users,
  },
  {
    label: "周增长率",
    value: "12%",
    icon: TrendingUp,
  },
];

export function StatsBar() {
  return (
    <section className="border-y border-border/40 bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
