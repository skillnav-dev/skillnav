import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { grokBotFaqs, grokBotResources } from "@/data/grok-bot";

export function GrokBotResources() {
  return (
    <section className="space-y-6">
      <SectionHeader title="精选教程" description="官方文档优先，社区教程补充" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grokBotResources.map((r) => (
          <a
            key={r.href}
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="group h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <Badge variant={r.source === "官方" ? "default" : "secondary"} className="text-xs">
                  {r.source}
                </Badge>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}

export function GrokBotFaq() {
  return (
    <section className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/40">
      <h2 className="mb-4 text-lg font-semibold">常见问题</h2>
      <div className="space-y-4">
        {grokBotFaqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="text-sm font-semibold">{faq.question}</h3>
            <p className="mt-1 text-sm text-foreground/85">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
