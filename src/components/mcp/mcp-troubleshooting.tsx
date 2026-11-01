import { ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";
import type { TroubleshootingItem } from "@/data/mcp-troubleshooting";

interface McpTroubleshootingProps {
  items: TroubleshootingItem[];
}

/** Collapsible install troubleshooting Q&A with copy-ready commands. */
export function McpTroubleshooting({ items }: McpTroubleshootingProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">安装排障（国内网络）</h3>
      {items.map((item) => (
        <details
          key={item.id}
          className="group rounded-lg ring-1 ring-border/60 open:bg-muted/20"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
            {item.question}
          </summary>
          <div className="space-y-3 px-3 pb-3 pl-9">
            <p className="text-sm text-foreground/85">{item.answer}</p>
            {item.code?.map((c) => (
              <div key={c.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {c.label}
                  </span>
                  <CopyButton text={c.code} className="h-7 w-7" />
                </div>
                <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 text-xs ring-1 ring-border">
                  <code>{c.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
