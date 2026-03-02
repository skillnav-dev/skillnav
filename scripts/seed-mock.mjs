#!/usr/bin/env node

/**
 * Seed Supabase with current mock data for testing.
 * Validates the full connection pipeline works end-to-end.
 *
 * Usage: node scripts/seed-mock.mjs
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";

const log = createLogger("seed");

// Inline mock skills (matching DB schema snake_case)
const mockSkills = [
  {
    slug: "web-search-agent",
    name: "Web Search Agent",
    name_zh: "网页搜索代理",
    description:
      "A powerful web search skill that enables AI agents to search, browse and extract information from the internet.",
    description_zh:
      "强大的网页搜索技能，支持 AI Agent 搜索、浏览和提取互联网信息。",
    author: "anthropic",
    category: "搜索",
    tags: ["search", "web", "browsing"],
    source: "clawhub",
    source_url: "https://clawhub.com/skills/web-search-agent",
    stars: 2340,
    downloads: 45200,
    security_score: "safe",
  },
  {
    slug: "code-interpreter",
    name: "Code Interpreter",
    name_zh: "代码解释器",
    description:
      "Execute and analyze code in a secure sandbox. Supports Python, JavaScript, and more.",
    description_zh:
      "在安全沙箱中执行和分析代码，支持 Python、JavaScript 等多种语言。",
    author: "openai",
    category: "开发",
    tags: ["code", "sandbox", "python", "javascript"],
    source: "clawhub",
    source_url: "https://clawhub.com/skills/code-interpreter",
    stars: 3120,
    downloads: 67800,
    security_score: "safe",
  },
  {
    slug: "data-analysis-toolkit",
    name: "Data Analysis Toolkit",
    name_zh: "数据分析工具包",
    description:
      "Comprehensive data analysis skill with visualization, statistics, and ML capabilities.",
    description_zh: "综合数据分析技能，包含可视化、统计分析和机器学习功能。",
    author: "datacraft",
    category: "数据",
    tags: ["data", "analysis", "visualization", "ml"],
    source: "clawhub",
    source_url: "https://clawhub.com/skills/data-analysis-toolkit",
    stars: 1890,
    downloads: 32100,
    security_score: "safe",
  },
];

const mockArticles = [
  {
    slug: "mcp-protocol-explained",
    title: "Understanding the Model Context Protocol (MCP)",
    title_zh: "深入理解 Model Context Protocol (MCP)",
    summary:
      "A comprehensive guide to understanding MCP and its role in the AI agent ecosystem.",
    summary_zh: "全面解析 MCP 协议及其在 AI Agent 生态中的核心作用。",
    content: "# MCP Protocol\n\nSample content for seeding.",
    content_zh: "# MCP 协议\n\n用于数据种子的示例内容。",
    source_url: "https://example.com/mcp",
    article_type: "tutorial",
    reading_time: 8,
    published_at: "2026-02-15T00:00:00Z",
  },
  {
    slug: "top-10-ai-skills-february-2026",
    title: "Top 10 AI Agent Skills - February 2026",
    title_zh: "2026年2月 AI Agent 技能 Top 10 榜单",
    summary: "Monthly ranking of the most popular AI agent skills.",
    summary_zh: "每月最受欢迎的 AI Agent 技能排行榜。",
    content: "# Top 10 Skills\n\nSample content for seeding.",
    content_zh: "# 技能 Top 10\n\n用于数据种子的示例内容。",
    article_type: "news",
    reading_time: 5,
    published_at: "2026-02-01T00:00:00Z",
  },
];

async function main() {
  const supabase = createAdminClient();

  // Seed skills
  log.info(`Seeding ${mockSkills.length} skills...`);
  const { error: skillsError } = await supabase
    .from("skills")
    .upsert(mockSkills, { onConflict: "slug" });

  if (skillsError) {
    log.error(`Skills seed failed: ${skillsError.message}`);
  } else {
    log.success(`Seeded ${mockSkills.length} skills`);
  }

  // Seed articles
  log.info(`Seeding ${mockArticles.length} articles...`);
  const { error: articlesError } = await supabase
    .from("articles")
    .upsert(mockArticles, { onConflict: "slug" });

  if (articlesError) {
    log.error(`Articles seed failed: ${articlesError.message}`);
  } else {
    log.success(`Seeded ${mockArticles.length} articles`);
  }

  // Verify by counting
  const { count: skillCount } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true });
  const { count: articleCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  log.info(`Total in DB: ${skillCount} skills, ${articleCount} articles`);
  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
