import { Article } from "./types";

export const mockArticles: Article[] = [
  {
    id: "1",
    slug: "mcp-protocol-explained",
    title: "MCP Protocol Explained: The Future of AI Agent Communication",
    titleZh: "MCP 协议详解：AI Agent 通信的未来",
    summary:
      "A deep dive into the Model Context Protocol and how it enables standardized communication between AI agents and tools.",
    summaryZh:
      "深入解析模型上下文协议（MCP），了解它如何实现 AI Agent 与工具之间的标准化通信。",
    content: `## MCP 协议是什么？

模型上下文协议（Model Context Protocol，简称 MCP）是由 Anthropic 提出的开放标准，旨在统一 AI 模型与外部工具、数据源之间的通信方式。

### 为什么需要 MCP？

在 MCP 出现之前，每个 AI 平台都有自己的工具调用方式。开发者需要为不同平台分别适配，这带来了巨大的重复工作量。MCP 的目标是建立一个通用的「USB-C 接口」，让任何 AI 模型都能通过同一协议连接任何工具。

### 核心概念

MCP 定义了三个核心角色：

1. **Host（宿主）**：运行 AI 模型的应用程序
2. **Client（客户端）**：MCP 协议的客户端实现
3. **Server（服务器）**：提供工具和资源的服务端

### 实际应用

目前已有数百个 MCP Server 被社区开发出来，涵盖：

- 文件系统操作
- 数据库查询
- Web 搜索
- 代码执行
- API 集成

### 对开发者的意义

MCP 的普及意味着开发者只需要编写一次工具适配代码，就能让所有支持 MCP 的 AI 模型使用该工具。这将极大地降低 AI 工具生态的碎片化程度。`,
    contentZh: "",
    sourceUrl: "https://anthropic.com/research/mcp",
    source: "anthropic",
    category: "analysis",
    coverImage:
      "https://www.anthropic.com/_next/image?url=https%3A%2F%2Fwww-cdn.anthropic.com%2Fimages%2F4zrzovbb%2Fwebsite%2F1a47b7e4-e13c-4a0e-8b29-74f758253bd8.png&w=3840&q=75",
    readingTime: 8,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-28",
    createdAt: "2026-02-28",
  },
  {
    id: "2",
    slug: "top-10-ai-skills-february-2026",
    title: "Top 10 AI Agent Skills in February 2026",
    titleZh: "2026 年 2 月最受欢迎的 10 个 AI Agent Skills",
    summary:
      "Monthly ranking of the most downloaded and highest rated AI skills across all major platforms.",
    summaryZh:
      "每月更新的 AI Skills 排行榜，涵盖各大平台下载量最高、评分最佳的技能。",
    content: `## 2026 年 2 月 AI Skills 排行榜

每月我们都会根据下载量、评分和社区反馈，评选出最值得关注的 AI Agent Skills。以下是本月的 Top 10：

### 1. Image Generation（图像生成）
下载量环比增长 35%，持续霸榜。最新版本支持了 4K 分辨率输出。

### 2. Code Interpreter（代码解释器）
开发者最爱。新增了 Rust 和 Go 语言支持。

### 3. Web Search Agent（网页搜索代理）
搜索准确度大幅提升，新增了实时新闻索引功能。

### 4. Database Query（数据库查询）
自然语言转 SQL 的准确率达到了 95%，支持更复杂的联表查询。

### 5. API Connector（API 连接器）
新增 OAuth 2.0 和 API Key 自动管理功能。

### 6. Data Analysis Toolkit（数据分析工具包）
新增交互式图表导出功能。

### 7. File Manager Pro（文件管理专家）
支持了 50+ 种文件格式的转换。

### 8. Memory Manager（记忆管理器）
新版本大幅优化了长期记忆的检索速度。

### 9. PDF Reader（PDF 阅读器）
表格识别准确率提升至 98%。

### 10. Email Assistant（邮件助手）
新增了邮件模板和批量操作功能。`,
    contentZh: "",
    sourceUrl: "",
    source: "anthropic",
    category: "analysis",
    readingTime: 5,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-25",
    createdAt: "2026-02-25",
  },
  {
    id: "3",
    slug: "building-custom-mcp-server",
    title: "How to Build a Custom MCP Server from Scratch",
    titleZh: "从零开始构建自定义 MCP Server",
    summary:
      "Step-by-step tutorial for creating your own MCP server with TypeScript and deploying it.",
    summaryZh: "手把手教你用 TypeScript 创建自己的 MCP Server 并部署上线。",
    content: `## 准备工作

本教程将带你从零开始构建一个 MCP Server。你需要：

- Node.js 20+
- TypeScript 5.x
- 基本的 AI Agent 概念了解

### 第一步：初始化项目

\`\`\`bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk
\`\`\`

### 第二步：定义工具

MCP Server 的核心是定义「工具」。每个工具都有名称、描述和输入参数的 JSON Schema。

\`\`\`typescript
const tool = {
  name: "get_weather",
  description: "获取指定城市的天气信息",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string", description: "城市名称" }
    },
    required: ["city"]
  }
};
\`\`\`

### 第三步：实现处理逻辑

每个工具都需要一个对应的处理函数，接收用户输入并返回结果。

### 第四步：启动服务器

使用 MCP SDK 提供的 Server 类即可快速启动：

\`\`\`typescript
const server = new Server({ name: "my-server", version: "1.0.0" });
server.start();
\`\`\`

### 部署建议

- 小型项目：Cloudflare Workers
- 中型项目：Railway / Fly.io
- 企业级：自建 Docker 容器`,
    contentZh: "",
    sourceUrl: "",
    source: "langchain",
    category: "tutorial",
    readingTime: 12,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-22",
    createdAt: "2026-02-22",
  },
  {
    id: "4",
    slug: "claude-4-skills-ecosystem",
    title: "Claude 4 and the Evolving Skills Ecosystem",
    titleZh: "Claude 4 与不断演进的 Skills 生态系统",
    summary:
      "How Claude 4's new capabilities are reshaping the AI skills marketplace and what it means for developers.",
    summaryZh: "Claude 4 的新能力如何重塑 AI Skills 市场，以及对开发者的影响。",
    content: `## Claude 4 带来了什么变化？

Claude 4 的发布标志着 AI Agent 能力的又一次飞跃。其增强的工具使用能力和更长的上下文窗口，对 Skills 生态产生了深远影响。

### 更强的工具使用能力

Claude 4 在多步骤工具调用方面表现出色。它能够：

- 自动规划多工具协作的执行路径
- 智能处理工具调用中的错误和异常
- 根据中间结果动态调整策略

### 对 Skills 开发者的影响

1. **更复杂的 Skills 成为可能**：开发者可以构建需要多步骤协作的复杂技能
2. **错误处理更宽容**：AI 能更好地应对工具返回的意外结果
3. **上下文利用更充分**：更长的上下文窗口意味着 Skills 可以处理更大的数据集

### 市场趋势

Skills 市场正在经历快速增长。过去三个月，新注册的 Skills 数量增长了 180%。最受欢迎的类别是数据分析、代码执行和 API 集成。

### 展望

随着 AI Agent 能力的提升，我们预计 Skills 生态将朝着更专业化、更垂直化的方向发展。通用型 Skills 将被更精细的领域专用 Skills 所补充。`,
    contentZh: "",
    sourceUrl: "",
    source: "anthropic",
    category: "analysis",
    readingTime: 6,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-18",
    createdAt: "2026-02-18",
  },
  {
    id: "5",
    slug: "security-best-practices-ai-skills",
    title: "Security Best Practices for AI Skills Development",
    titleZh: "AI Skills 开发安全最佳实践",
    summary:
      "Essential security guidelines every AI skill developer should follow to protect users and data.",
    summaryZh: "每个 AI Skills 开发者都应遵循的安全准则，保护用户和数据安全。",
    content: `## 为什么安全如此重要？

AI Skills 具有访问用户数据和外部系统的能力，这意味着安全漏洞可能造成严重后果。本文总结了 Skills 开发中的关键安全实践。

### 1. 最小权限原则

你的 Skill 只应请求完成任务所需的最少权限。例如，一个只需要读取文件的 Skill 不应请求写入权限。

### 2. 输入验证

永远不要信任来自 AI 模型的输入。即使输入来自「可信」的 AI，也需要进行严格的参数验证：

- 检查参数类型和范围
- 过滤特殊字符，防止注入攻击
- 对文件路径进行规范化处理

### 3. 沙箱执行

涉及代码执行的 Skills 必须在沙箱环境中运行：

- 使用容器隔离
- 限制网络访问
- 设置资源使用上限（CPU、内存、磁盘）

### 4. 数据保护

- 不在日志中记录敏感信息
- 使用加密存储凭证
- 实现数据最小化——只保留必要的数据

### 5. 安全审计

- 定期进行代码审查
- 使用自动化安全扫描工具
- 建立漏洞响应流程

### SkillNav 安全评分

SkillNav 为每个 Skill 提供安全评分，帮助用户评估风险。评分基于权限请求、代码审计和社区反馈等多维度指标。`,
    contentZh: "",
    sourceUrl: "",
    source: "simonw",
    category: "tutorial",
    readingTime: 7,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-14",
    createdAt: "2026-02-14",
  },
  {
    id: "6",
    slug: "openai-skills-store-launch",
    title: "OpenAI Launches Official Skills Store",
    titleZh: "OpenAI 正式推出 Skills 商店",
    summary:
      "OpenAI announces the launch of their official Skills Store, signaling the maturation of the AI skills marketplace.",
    summaryZh:
      "OpenAI 宣布正式推出 Skills 商店，标志着 AI Skills 市场走向成熟。",
    content: `## OpenAI Skills 商店正式上线

OpenAI 于本周正式发布了其 Skills 商店（Skills Store），这是继 ChatGPT 插件之后，该公司在 AI 工具生态方面的又一重大举措。

### 主要特点

1. **开发者友好**：提供完整的 SDK 和文档，支持快速开发和部署
2. **收益分成**：开发者可以对 Skills 收费，OpenAI 抽成 15%
3. **审核机制**：所有上架 Skills 需通过安全审核
4. **数据分析**：为开发者提供使用数据和用户反馈

### 市场反应

发布首日即有超过 500 个 Skills 上架，涵盖办公效率、开发工具、数据分析等多个类别。

### 对行业的影响

OpenAI Skills Store 的推出意味着 AI Skills 生态正在从「开源社区驱动」向「平台化商业化」方向转变。这对独立开发者既是机遇也是挑战：

- **机遇**：更大的分发渠道和变现可能
- **挑战**：平台规则和审核带来的限制

### SkillNav 的定位

作为独立的第三方导航站，SkillNav 将持续为用户提供跨平台的 Skills 发现和评估服务，帮助用户在不同平台间做出最佳选择。`,
    contentZh: "",
    sourceUrl: "",
    source: "openai",
    category: "analysis",
    coverImage:
      "https://images.openai.com/blob/a25e6ec3-65f9-4e8e-ad39-2a4f2a60f04c/skills-store.jpg",
    readingTime: 5,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-10",
    createdAt: "2026-02-10",
  },
  {
    id: "7",
    slug: "ai-agent-skills-vs-plugins",
    title: "AI Skills vs Plugins vs Extensions: What's the Difference?",
    titleZh: "AI Skills vs 插件 vs 扩展：有什么区别？",
    summary:
      "Clarifying the terminology confusion in the AI tools ecosystem and understanding the key differences.",
    summaryZh:
      "厘清 AI 工具生态中的术语混淆，理解 Skills、插件和扩展之间的关键区别。",
    content: `## 概念辨析

在 AI 工具生态中，「Skills」「Plugins」和「Extensions」这些术语经常被混用。本文帮你理清它们之间的区别。

### AI Skills

Skills 是 AI Agent 可以调用的独立能力模块。它们通常：

- 通过标准协议（如 MCP）与 AI 模型通信
- 具有明确的输入输出定义
- 可以独立部署和更新
- 支持跨模型、跨平台使用

### 插件（Plugins）

插件是特定平台的扩展机制，通常：

- 绑定到特定的 AI 平台（如 ChatGPT Plugins）
- 通过平台特有的 API 接入
- 受平台审核和管理
- 可能包含 UI 组件

### 扩展（Extensions）

扩展通常指的是浏览器或应用级别的增强，特点是：

- 运行在客户端
- 修改或增强现有应用的功能
- 通常需要用户手动安装和管理

### 趋势：走向统一

随着 MCP 等标准协议的普及，这些概念正在逐渐融合。未来我们可能会看到一个统一的 AI 工具生态，其中 Skills 作为最基本的能力单元，可以被任何 AI 系统调用。

### 如何选择？

对于开发者来说，建议优先基于开放标准（如 MCP）开发 Skills，这样可以获得最广泛的兼容性。`,
    contentZh: "",
    sourceUrl: "",
    source: "simonw",
    category: "analysis",
    readingTime: 6,
    status: "published",
    contentTier: "translated",
    publishedAt: "2026-02-05",
    createdAt: "2026-02-05",
  },
];
