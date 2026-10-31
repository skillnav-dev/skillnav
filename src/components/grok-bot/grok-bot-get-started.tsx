import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { grokBotScenarios, grokBotSteps } from "@/data/grok-bot";

export function GrokBotGetStarted() {
  return (
    <section className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-6">
        <SectionHeader
          title="15 分钟上手"
          description="官方说法：搭好一个 bot 大约 10–15 分钟"
        />
        <ol className="space-y-4">
          {grokBotSteps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-6">
        <SectionHeader
          title="落地场景"
          description="编辑整理的示例 bot，可以照着搭"
        />
        <div className="grid gap-3">
          {grokBotScenarios.map((s) => (
            <Card key={s.title} className="gap-2 py-4">
              <CardHeader className="px-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{s.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {s.trigger}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-4">
                <p className="text-sm text-muted-foreground">{s.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
