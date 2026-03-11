#!/usr/bin/env node
import { createAdminClient } from "./lib/supabase-admin.mjs";

// -- 18 hand-picked MCP Servers (from src/data/mcp-servers.ts) ----------------

const mcpServers = [
  {
    slug: "filesystem",
    name: "Filesystem",
    nameZh: "文件系统",
    author: "Anthropic",
    description:
      "Read, write, and manage files and directories on your local filesystem.",
    descriptionZh: "读写和管理本地文件系统中的文件和目录。",
    category: "文件系统",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    installCommand: "npx -y @modelcontextprotocol/server-filesystem",
    stars: 15000,
    isFeatured: true,
  },
  {
    slug: "github",
    name: "GitHub",
    nameZh: "GitHub",
    author: "GitHub",
    description:
      "Interact with GitHub repositories, issues, pull requests, and more.",
    descriptionZh: "与 GitHub 仓库、Issue、PR 等进行交互操作。",
    category: "开发工具",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    installCommand: "npx -y @modelcontextprotocol/server-github",
    stars: 15000,
    isFeatured: true,
  },
  {
    slug: "postgres",
    name: "PostgreSQL",
    nameZh: "PostgreSQL 数据库",
    author: "Anthropic",
    description:
      "Query and manage PostgreSQL databases with schema inspection.",
    descriptionZh: "查询和管理 PostgreSQL 数据库，支持 Schema 检查。",
    category: "数据库",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    installCommand: "npx -y @modelcontextprotocol/server-postgres",
    stars: 15000,
    isFeatured: true,
  },
  {
    slug: "sqlite",
    name: "SQLite",
    nameZh: "SQLite 数据库",
    author: "Anthropic",
    description: "Read and query SQLite databases for data analysis tasks.",
    descriptionZh: "读取和查询 SQLite 数据库，用于数据分析任务。",
    category: "数据库",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    installCommand: "npx -y @modelcontextprotocol/server-sqlite",
    stars: 15000,
  },
  {
    slug: "brave-search",
    name: "Brave Search",
    nameZh: "Brave 搜索",
    author: "Anthropic",
    description: "Web and local search using the Brave Search API.",
    descriptionZh: "使用 Brave Search API 进行网页和本地搜索。",
    category: "Web & API",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
    installCommand: "npx -y @modelcontextprotocol/server-brave-search",
    stars: 15000,
    isFeatured: true,
  },
  {
    slug: "fetch",
    name: "Fetch",
    nameZh: "网页抓取",
    author: "Anthropic",
    description:
      "Fetch and convert web pages to markdown for AI-friendly consumption.",
    descriptionZh: "抓取网页并转换为 Markdown，便于 AI 处理。",
    category: "Web & API",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    installCommand: "npx -y @modelcontextprotocol/server-fetch",
    stars: 15000,
  },
  {
    slug: "puppeteer",
    name: "Puppeteer",
    nameZh: "Puppeteer 浏览器控制",
    author: "Anthropic",
    description:
      "Browser automation with Puppeteer for web scraping and testing.",
    descriptionZh: "使用 Puppeteer 进行浏览器自动化、网页抓取和测试。",
    category: "Web & API",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    installCommand: "npx -y @modelcontextprotocol/server-puppeteer",
    stars: 15000,
    isFeatured: true,
  },
  {
    slug: "slack",
    name: "Slack",
    nameZh: "Slack 消息",
    author: "Anthropic",
    description: "Send messages, read channels, and manage Slack workspaces.",
    descriptionZh: "发送消息、读取频道、管理 Slack 工作区。",
    category: "效率工具",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    installCommand: "npx -y @modelcontextprotocol/server-slack",
    stars: 15000,
  },
  {
    slug: "memory",
    name: "Memory",
    nameZh: "知识图谱记忆",
    author: "Anthropic",
    description:
      "Persistent memory using a local knowledge graph for long-term context.",
    descriptionZh: "使用本地知识图谱实现持久化记忆，提供长期上下文。",
    category: "AI & LLM",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    installCommand: "npx -y @modelcontextprotocol/server-memory",
    stars: 15000,
    isFeatured: true,
  },
  {
    slug: "sequential-thinking",
    name: "Sequential Thinking",
    nameZh: "顺序思维",
    author: "Anthropic",
    description:
      "Dynamic problem-solving through sequential thought processes.",
    descriptionZh: "通过顺序化思维过程实现动态问题求解。",
    category: "AI & LLM",
    githubUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
    installCommand: "npx -y @modelcontextprotocol/server-sequential-thinking",
    stars: 15000,
  },
  {
    slug: "supabase",
    name: "Supabase",
    nameZh: "Supabase",
    author: "Supabase",
    description:
      "Manage Supabase projects, run SQL, and interact with database and auth.",
    descriptionZh: "管理 Supabase 项目，运行 SQL，操作数据库和认证。",
    category: "数据库",
    githubUrl: "https://github.com/supabase-community/supabase-mcp",
    installCommand: "npx -y @supabase/mcp-server-supabase",
    stars: 800,
    isFeatured: true,
  },
  {
    slug: "sentry",
    name: "Sentry",
    nameZh: "Sentry 错误监控",
    author: "Sentry",
    description: "Search and analyze error reports from Sentry for debugging.",
    descriptionZh: "搜索和分析 Sentry 错误报告，辅助调试。",
    category: "开发工具",
    githubUrl: "https://github.com/getsentry/sentry-mcp",
    installCommand: "npx -y @sentry/mcp-server-sentry",
    stars: 400,
  },
  {
    slug: "linear",
    name: "Linear",
    nameZh: "Linear 项目管理",
    author: "Linear",
    description:
      "Manage Linear issues, projects, and teams for project tracking.",
    descriptionZh: "管理 Linear 的 Issue、项目和团队，用于项目跟踪。",
    category: "效率工具",
    githubUrl: "https://github.com/linear/linear-mcp-server",
    installCommand: "npx -y @linear/mcp-server-linear",
    stars: 300,
  },
  {
    slug: "context7",
    name: "Context7",
    nameZh: "Context7 文档查询",
    author: "Context7",
    description:
      "Pull up-to-date documentation and code examples from any library.",
    descriptionZh: "拉取任意库的最新文档和代码示例。",
    category: "开发工具",
    githubUrl: "https://github.com/upstash/context7",
    installCommand: "npx -y @upstash/context7-mcp",
    stars: 5000,
    isFeatured: true,
  },
  {
    slug: "neon",
    name: "Neon",
    nameZh: "Neon Serverless Postgres",
    author: "Neon",
    description:
      "Manage Neon serverless Postgres databases, branches, and queries.",
    descriptionZh: "管理 Neon 无服务器 Postgres 数据库、分支和查询。",
    category: "数据库",
    githubUrl: "https://github.com/neondatabase/mcp-server-neon",
    installCommand: "npx -y @neondatabase/mcp-server-neon",
    stars: 600,
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    nameZh: "Cloudflare",
    author: "Cloudflare",
    description: "Manage Cloudflare Workers, KV, R2, and D1 resources.",
    descriptionZh: "管理 Cloudflare Workers、KV、R2 和 D1 资源。",
    category: "开发工具",
    githubUrl: "https://github.com/cloudflare/mcp-server-cloudflare",
    installCommand: "npx -y @cloudflare/mcp-server-cloudflare",
    stars: 1500,
    isFeatured: true,
  },
  {
    slug: "firecrawl",
    name: "Firecrawl",
    nameZh: "Firecrawl 智能爬虫",
    author: "Firecrawl",
    description:
      "Advanced web scraping with JavaScript rendering and structured data extraction.",
    descriptionZh: "高级网页爬取，支持 JavaScript 渲染和结构化数据提取。",
    category: "数据处理",
    githubUrl: "https://github.com/mendableai/firecrawl-mcp-server",
    installCommand: "npx -y firecrawl-mcp",
    stars: 500,
  },
  {
    slug: "exa",
    name: "Exa",
    nameZh: "Exa AI 搜索",
    author: "Exa",
    description:
      "AI-powered search engine with semantic understanding and content retrieval.",
    descriptionZh: "AI 驱动的搜索引擎，支持语义理解和内容检索。",
    category: "Web & API",
    githubUrl: "https://github.com/exa-labs/exa-mcp-server",
    installCommand: "npx -y exa-mcp-server",
    stars: 1000,
  },
];

// -- Mapping -------------------------------------------------------------------

function mapToDbRow(server) {
  return {
    slug: server.slug,
    name: server.name,
    name_zh: server.nameZh,
    author: server.author ?? null,
    description: server.description,
    description_zh: server.descriptionZh,
    category: server.category,
    tags: [],
    github_url: server.githubUrl,
    install_command: server.installCommand,
    stars: server.stars ?? 0,
    status: "published",
    source: "manual",
    is_featured: server.isFeatured ?? false,
    quality_tier: "A", // all 18 are hand-picked
  };
}

// -- Main ----------------------------------------------------------------------

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const rows = mcpServers.map(mapToDbRow);

  console.log(`[migrate-mcp] ${rows.length} MCP servers to upsert`);

  if (isDryRun) {
    console.log("[migrate-mcp] --dry-run mode, printing rows:\n");
    for (const row of rows) {
      console.log(`  ${row.slug} (${row.name_zh}) — featured=${row.is_featured}`);
    }
    console.log("\n[migrate-mcp] Dry run complete. No data written.");
    return;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("mcp_servers")
    .upsert(rows, { onConflict: "slug" })
    .select("slug");

  if (error) {
    console.error("[migrate-mcp] Upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`[migrate-mcp] Successfully upserted ${data.length} rows:`);
  for (const row of data) {
    console.log(`  - ${row.slug}`);
  }
}

main().catch((err) => {
  console.error("[migrate-mcp] Unexpected error:", err);
  process.exit(1);
});
