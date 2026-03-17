## 通俗理解

在 MCP 出现之前，每个 AI 应用想调用外部工具，都得自己写一套对接代码。连 Slack 要写一个适配器，连数据库要写另一个，连 GitHub 又是一个——就像早年手机充电器，每个品牌一种接口。

**MCP 就是 AI 工具调用的 USB-C。**

它定义了一套标准协议：无论是文件系统、数据库、API 还是任何外部服务，只要实现了 MCP 接口，任何支持 MCP 的 AI 应用都能直接使用。

| | 没有 MCP | 有 MCP |
|---|---------|--------|
| 工具接入 | 每个 AI 应用各写一套 | 写一次，处处可用 |
| 工具发现 | 硬编码在应用里 | AI 自动发现可用工具 |
| 生态 | 碎片化，各自为战 | 统一市场，共享生态 |

## 技术架构

MCP 采用客户端-服务器架构：

```
┌─────────────┐     MCP 协议      ┌─────────────────┐
│  AI 应用     │ ◄──────────────► │  MCP Server      │
│ (MCP Client) │   JSON-RPC 2.0   │ (工具提供方)      │
│              │                   │                   │
│ Claude Code  │                   │ 如：GitHub Server │
│ Cursor       │                   │     Postgres      │
│ Windsurf     │                   │     Filesystem    │
└─────────────┘                   └─────────────────┘
```

核心概念只有三个：

1. **Tools（工具）**：MCP Server 暴露的可调用函数，比如 `search_issues`、`run_query`
2. **Resources（资源）**：MCP Server 提供的只读数据，比如数据库表结构、文件列表
3. **Prompts（提示模板）**：预定义的交互模板，引导 AI 更好地使用工具

## 工程实践

在 Claude Code 中使用 MCP Server，只需要一行配置：

```bash
# 添加一个 GitHub MCP Server
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# 添加一个本地文件系统 Server
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/dir
```

配置后，Claude Code 会自动发现这些 Server 提供的工具，并在需要时调用。

在代码中集成 MCP Server（以 TypeScript 为例）：

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "my-tool", version: "1.0.0" });

// Register a tool
server.tool("get_weather", { city: z.string() }, async ({ city }) => ({
  content: [{ type: "text", text: `${city}: 25°C, sunny` }],
}));

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

这就是一个最小的 MCP Server——任何支持 MCP 的 AI 应用都能调用它的 `get_weather` 工具。

## MCP 的意义

MCP 解决的不只是技术问题，更是生态问题：

- **对开发者**：写一个 MCP Server，所有 AI 应用都能用，不用为每个平台适配
- **对 AI 应用**：接入 MCP 生态，瞬间获得数千个现成工具
- **对行业**：统一标准降低碎片化，加速 AI 工具生态成熟

目前 Claude Code、Cursor、Windsurf、VS Code 等主流 AI 编程工具都已支持 MCP。
