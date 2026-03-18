import { CopyButton } from "@/components/shared/copy-button";
import type { McpServer } from "@/data/types";

interface McpContentProps {
  server: McpServer;
}

export function McpWhatIs({ server }: McpContentProps) {
  const content = server.introZh ?? server.descriptionZh ?? server.description;
  if (!content) return null;

  return (
    <section className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="mb-3 text-lg font-semibold">
        什么是 {server.nameZh ?? server.name}？
      </h2>
      <div className="prose prose-sm max-w-none text-foreground/85">
        {content.split("\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export function McpHowToUse({ server }: McpContentProps) {
  if (!server.installCommand && !server.installConfig) return null;

  return (
    <section className="rounded-xl border border-border/40 bg-card p-6">
      <h2 className="mb-3 text-lg font-semibold">
        如何使用 {server.nameZh ?? server.name}
      </h2>
      {server.installCommand && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            安装命令
          </h3>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5 font-mono text-sm">
            <code className="min-w-0 flex-1 truncate text-muted-foreground">
              {server.installCommand}
            </code>
            <CopyButton text={server.installCommand} />
          </div>
        </div>
      )}
      {server.installConfig && (
        <div className={server.installCommand ? "mt-4 space-y-2" : "space-y-2"}>
          <h3 className="text-sm font-medium text-muted-foreground">
            配置示例
          </h3>
          <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
            <code>{JSON.stringify(server.installConfig, null, 2)}</code>
          </pre>
        </div>
      )}
    </section>
  );
}

export function McpToolsList({ server }: McpContentProps) {
  if (server.tools && server.tools.length > 0) {
    return (
      <section className="rounded-xl border border-border/40 bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">
          核心功能 ({server.tools.length} 个工具)
        </h2>
        <div className="space-y-3">
          {server.tools.map((tool) => (
            <div
              key={tool.name}
              className="rounded-md border border-border/40 bg-muted/30 px-4 py-3"
            >
              <code className="text-sm font-semibold text-primary">
                {tool.name}
              </code>
              {tool.description && (
                <p className="mt-1 text-sm text-foreground/75">
                  {tool.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (server.toolsCount > 0) {
    return (
      <section className="rounded-xl border border-border/40 bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">核心功能</h2>
        <p className="text-sm text-foreground/85">
          该 MCP Server 提供{" "}
          <span className="font-semibold">{server.toolsCount}</span> 个工具。
          {server.githubUrl && (
            <>
              查看{" "}
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub 仓库
              </a>{" "}
              了解详细工具列表。
            </>
          )}
        </p>
      </section>
    );
  }

  return null;
}
