import type { McpServer } from "@/data/types";

interface McpFaqProps {
  server: McpServer;
}

export function McpFaq({ server }: McpFaqProps) {
  const displayName = server.nameZh ?? server.name;

  return (
    <section className="rounded-xl ring-1 ring-border/40 bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">常见问题</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">{displayName} 是什么？</h3>
          <p className="mt-1 text-sm text-foreground/85">
            {server.descriptionZh ??
              server.description ??
              `${server.name} 是一个 MCP Server。`}
          </p>
        </div>
        {server.installCommand && (
          <div>
            <h3 className="text-sm font-semibold">如何安装 {displayName}？</h3>
            <p className="mt-1 text-sm text-foreground/85">
              运行命令：
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {server.installCommand}
              </code>
            </p>
          </div>
        )}
        {server.tools && server.tools.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">
              {displayName} 提供哪些工具？
            </h3>
            <p className="mt-1 text-sm text-foreground/85">
              提供 {server.tools.length} 个工具，包括{" "}
              {server.tools
                .slice(0, 3)
                .map((t) => t.name)
                .join("、")}
              {server.tools.length > 3 ? " 等" : ""}。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
