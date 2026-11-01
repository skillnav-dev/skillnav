"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track";
import { ENV_PLACEHOLDER, type ServerSpec } from "@/lib/install-spec";
import {
  applyRunner,
  buildClientInstalls,
  supportsRunnerSwitch,
  type Runner,
} from "@/lib/install-snippets";

interface McpInstallTabsProps {
  slug: string;
  spec: ServerSpec;
}

const RUNNERS: Runner[] = ["npx", "bunx", "pnpm"];

export function McpInstallTabs({ slug, spec }: McpInstallTabsProps) {
  const [runner, setRunner] = useState<Runner>("npx");
  const clients = useMemo(
    () => buildClientInstalls(applyRunner(spec, runner)),
    [spec, runner],
  );
  const needsEnv =
    spec.kind === "stdio" &&
    Object.values(spec.env).some((v) => v === ENV_PLACEHOLDER);

  const track = (client: string, action: string) =>
    trackEvent("install-copy", { type: "mcp", slug, client, action });

  return (
    <Tabs defaultValue={clients[0]?.id} className="gap-3">
      <div className="overflow-x-auto">
        <TabsList className="w-max">
          {clients.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-xs">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {supportsRunnerSwitch(spec) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>运行方式</span>
          <div className="flex gap-1 rounded-md bg-muted p-0.5">
            {RUNNERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRunner(r)}
                className={cn(
                  "rounded-sm px-2 py-0.5 font-mono transition-colors",
                  runner === r
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {clients.map((c) => (
        <TabsContent key={c.id} value={c.id} className="space-y-3">
          <p className="text-sm text-muted-foreground">{c.hint}</p>
          {c.snippets.map((s) => (
            <div key={s.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {s.label}
                </span>
                <CopyButton
                  text={s.code}
                  className="h-7 w-7"
                  onCopy={() => track(c.id, s.label)}
                />
              </div>
              <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 text-xs ring-1 ring-border">
                <code>{s.code}</code>
              </pre>
            </div>
          ))}
          {c.deeplink && (
            <Button asChild size="sm">
              <a href={c.deeplink.href} onClick={() => track(c.id, "deeplink")}>
                <ExternalLink className="size-3.5" />
                {c.deeplink.label}
              </a>
            </Button>
          )}
        </TabsContent>
      ))}

      {needsEnv && (
        <p className="text-xs text-muted-foreground">
          标有 {ENV_PLACEHOLDER}{" "}
          的环境变量需要换成你自己的密钥或配置值，再保存。
        </p>
      )}
    </Tabs>
  );
}
