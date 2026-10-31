import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import {
  GROK_BOT_LAST_VERIFIED,
  GROK_BOT_LINKS,
  grokBotFacts,
} from "@/data/grok-bot";

export function GrokBotHero() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-5">
        <Badge variant="secondary">可落地的桌面 Agent</Badge>
        <SectionHeader
          as="h1"
          title="Grok Bot 中文导航"
          description="xAI 推出的通用工作 Agent：每个 bot 自带一台云电脑，能定时跑、被事件触发、多 bot 分工协作。这里整理它能做什么、怎么上手、适合哪些场景。"
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={GROK_BOT_LINKS.download} target="_blank" rel="noopener noreferrer">
              下载客户端
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={GROK_BOT_LINKS.guides} target="_blank" rel="noopener noreferrer">
              官方指南
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">速览</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            {grokBotFacts.map((fact) => (
              <div key={fact.label} className="grid grid-cols-[72px_1fr] gap-2">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="text-foreground/90">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            信息核实于 {GROK_BOT_LAST_VERIFIED}，套餐变动频繁，以官网为准
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
