import {
  Clock,
  Hand,
  Monitor,
  Plug,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import {
  grokBotCapabilities,
  type GrokBotCapabilityIcon,
} from "@/data/grok-bot";

const ICONS: Record<GrokBotCapabilityIcon, LucideIcon> = {
  monitor: Monitor,
  clock: Clock,
  users: Users,
  plug: Plug,
  shield: ShieldCheck,
  hand: Hand,
};

export function GrokBotCapabilities() {
  return (
    <section className="space-y-6">
      <SectionHeader
        title="核心能力"
        description="和聊天机器人最大的不同：它有自己的电脑，能长期在线自己干活"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grokBotCapabilities.map((cap) => {
          const Icon = ICONS[cap.icon];
          return (
            <Card key={cap.title} className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base">{cap.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{cap.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
