"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";
import { ENV_PLACEHOLDER } from "@/lib/install-spec";
import type { PackInstall } from "@/lib/pack-install";
import { trackEvent } from "@/lib/track";

function Block({
  label,
  code,
  onCopy,
}: {
  label: string;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <CopyButton text={code} className="h-7 w-7" onCopy={onCopy} />
      </div>
      <pre className="max-h-80 overflow-auto rounded-md bg-muted/50 p-3 text-xs ring-1 ring-border">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** One copy installs the whole pack (#27). */
export function PackInstallPanel({
  slug,
  install,
}: {
  slug: string;
  install: PackInstall;
}) {
  const track = (client: string) => trackEvent("pack-copy", { slug, client });

  return (
    <section className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-border/40">
      <h2 className="mb-3 text-lg font-semibold">一次装好整个包</h2>
      <Tabs defaultValue="claude-code" className="gap-3">
        <TabsList>
          <TabsTrigger value="claude-code" className="text-xs">
            Claude Code
          </TabsTrigger>
          <TabsTrigger value="cursor" className="text-xs">
            Cursor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="claude-code" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            在项目目录的终端里整段粘贴运行。Skills 通过 skills CLI 安装，MCP
            通过 claude mcp add 添加。
          </p>
          <Block
            label="终端命令"
            code={install.claudeCode}
            onCopy={() => track("claude-code")}
          />
        </TabsContent>
        <TabsContent value="cursor" className="space-y-3">
          {install.cursorMcpJson && (
            <Block
              label="合并进 ~/.cursor/mcp.json"
              code={install.cursorMcpJson}
              onCopy={() => track("cursor-mcp")}
            />
          )}
          {install.cursorSkills && (
            <Block
              label="Skills（终端运行）"
              code={install.cursorSkills}
              onCopy={() => track("cursor-skills")}
            />
          )}
        </TabsContent>
      </Tabs>
      {install.needsEnv && (
        <p className="mt-3 text-xs text-muted-foreground">
          标有 {ENV_PLACEHOLDER}{" "}
          的环境变量需要换成你自己的密钥，具体去哪申请见各条目详情页。
        </p>
      )}
      {install.manual.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {install.manual.join("、")} 暂无标准安装数据，请到详情页按说明安装。
        </p>
      )}
    </section>
  );
}
