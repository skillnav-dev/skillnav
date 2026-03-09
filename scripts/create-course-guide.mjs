#!/usr/bin/env node

/**
 * One-time script: Insert the Andrew Ng "Agent Skills with Anthropic" course guide article.
 *
 * Usage:
 *   node scripts/create-course-guide.mjs              # Insert as draft
 *   node scripts/create-course-guide.mjs --publish     # Insert as published
 *   node scripts/create-course-guide.mjs --dry-run     # Preview only
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { createLogger } from "./lib/logger.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const log = createLogger("course-guide");

const slug = "andrew-ng-agent-skills-course-guide";
const title = "Andrew Ng × Anthropic「Agent Skills」Course Guide";
const titleZh = "吴恩达 × Anthropic「Agent Skills」课程完全指南";
const summary =
  "A comprehensive guide to DeepLearning.AI's Agent Skills with Anthropic course: lesson breakdown, practical tools, and learning path.";
const summaryZh =
  "DeepLearning.AI「Agent Skills with Anthropic」课程导读：逐课拆解 + 实战工具推荐 + 学习路径建议。免费 2 小时，从零掌握 AI Agent Skills 体系。";

const contentZh = `## 为什么这门课值得关注

2026 年 1 月，吴恩达联合 Anthropic 在 DeepLearning.AI 上线了一门免费短课程——[Agent Skills with Anthropic](https://www.deeplearning.ai/short-courses/agent-skills-with-anthropic/)。讲师是 Anthropic 技术教育负责人 Elie Schoppik。

三个关键词解释了这门课的价值：

- **Agent Skills 是开放标准**——不是 Anthropic 的私有格式，OpenAI Codex CLI、Cursor、VS Code 都已支持
- **2 小时可完成**——10 节课，从概念到 Claude Code、Claude API、Agent SDK 全覆盖
- **免费**——零门槛，适合所有想让 AI Agent 变得更专业的开发者

> 如果你用过 Claude Code 但从没写过 Skill，这门课是最快的入门路径。如果你已经在写 Skill，第 7-10 课的进阶内容值得一看。

---

## 课程概览

| # | 课时 | 时长 | 核心内容 |
|---|------|------|---------|
| 1 | Introduction | 2 min | Skills 定义与课程路线图 |
| 2 | Course Materials | 1 min | 配套代码和阅读材料 |
| 3 | Why Use Skills - Part I | 11 min | Skill 文件夹结构、渐进式披露、Excel Skill 案例拆解 |
| 4 | Why Use Skills - Part II | 8 min | Agent 类型与 Skill 方向映射 |
| 5 | Skills vs Tools, MCP, and Subagents | 7 min | 三者定位对比：SOP vs 感知器 vs 分身 |
| 6 | Exploring Pre-Built Skills | 18 min | 官方预构建 Skill、Skill Creator、最佳实践 |
| 7 | Creating Custom Skills | 16 min | SKILL.md 规范、命名规则、两个自定义 Skill 实战 |
| 8 | Skills with the Claude API | 17 min | Code Execution Tool + Files API + Skill 集成 |
| 9 | Skills with Claude Code | 24 min | Claude Code 工作流 + Subagent + Skill 协作 |
| 10 | Skills with the Claude Agent SDK | 20 min | 多智能体研究 Agent + MCP 集成 + Notion 交付 |

**总时长**: ~2 小时 19 分钟 | **难度**: 初学者 | **代码仓库**: [sc-agent-skills-files](https://github.com/https-deeplearning-ai/sc-agent-skills-files)

---

## 逐课导读

> 第 1-2 课为课程介绍和材料准备（共 3 分钟），以下从第 3 课的实质内容开始导读。

### 第 3 课：为什么用 Skills（上）

**核心概念**——Skill 是一个文件夹，包含指令（Instructions）、脚本（Scripts）和资源（Assets），让 Agent 获得特定领域的专业能力。

课程用一个 **Excel 营销分析 Skill** 做演示：没有 Skill 时，你每次都要重复描述数据格式、分析方法、输出模板；有 Skill 后，Agent 自动知道怎么做。

**关键机制——渐进式披露（Progressive Disclosure）**：

\`\`\`
第 1 层: name + description → 始终加载到上下文（几十个 token）
第 2 层: SKILL.md 正文 → Agent 判断相关时才加载
第 3 层: scripts/ references/ assets/ → 按需加载
\`\`\`

这个设计解决了"加载太多指令浪费 token"的问题。Agent 只在需要时才读取完整指令。

**SkillNav 推荐**：浏览我们的[数据处理类 Skills](/skills?category=数据处理) 查看类似的数据分析 Skill 实例。

---

### 第 4 课：为什么用 Skills（下）

这节课换了视角——从 **Agent 需要什么**来思考 Skill 设计：

| Agent 类型 | 需要的 Skill 方向 |
|-----------|-----------------|
| 编码 Agent | 代码规范、框架文档、调试流程 |
| 研究 Agent | 搜索策略、资料筛选、论文分析 |
| 营销 Agent | 品牌规范、营销模板、指标分析 |
| 金融 Agent | 财务规则、合规要求、风险模型 |

**我们的点评**：这个映射表非常实用。写 Skill 之前先问自己"我的 Agent 是什么类型"，就能快速找到方向。SkillNav 的 [10 个分类体系](/skills) 就是按这个思路组织的——编码开发、AI 智能体、数据处理、搜索研究、内容创作等。

---

### 第 5 课：Skills vs Tools vs MCP vs Subagents

这是全课程**信息密度最高**的一课。7 分钟讲清楚了 Agent 生态的三驾马车：

| 概念 | 类比 | 作用 | 举例 |
|------|------|------|------|
| **Skills** | 标准作业程序 (SOP) | 定义"怎么做" | 代码审查清单、数据分析流程 |
| **MCP** | 感知器 | 连接外部世界 | 查数据库、发 Slack、搜网页 |
| **Subagents** | 分身 | 并行隔离执行 | 安全审查 + 性能测试同时进行 |

**核心洞察**：三者不是替代关系，而是互补。一个成熟的 Agent 系统 = Skills（知道怎么做）+ MCP（能触达外部）+ Subagents（能并行）。

**SkillNav 推荐**：对 MCP 感兴趣？查看我们的 [MCP 服务器精选导航](/mcp)，收录了各领域最佳 MCP Server。

---

### 第 6 课：探索预构建 Skills

Anthropic 在 [anthropics/skills](https://github.com/anthropics/skills) 仓库开源了一系列官方 Skill，课程演示了：

- **Office 文档四件套**：xlsx、docx、pdf、pptx 处理
- **Skill Creator**：用 Claude Desktop 的内置能力自动生成新 Skill
- **BigQuery 查询**：把数据仓库操作封装为可复用 Skill
- **品牌设计 Skill**：遵循品牌规范生成内容

**实战建议**：学写自定义 Skill 之前，先研读 anthropics/skills 里的 SKILL.md 文件。它们是官方范本——看渐进式披露怎么分层、看指令怎么写得清晰可执行。

**SkillNav 推荐**：我们精选库收录了 [Anthropic 官方的全部 17 个 Skills](/skills?source=anthropics/skills)，可以直接浏览内容和安装命令。

---

### 第 7 课：创建自定义 Skills

**SKILL.md 格式规范**：

\`\`\`yaml
---
name: my-skill-name          # 必填，≤64 字符，小写+连字符，动词-ing 格式
description: What it does     # 必填，≤1024 字符，包含触发关键词
---

## Instructions
Step-by-step instructions...  # 正文 ≤500 行
\`\`\`

**目录结构**：

\`\`\`
my-skill/
├── SKILL.md           # 必需，入口文件
├── scripts/           # 可选，可执行代码（Python 等）
├── references/        # 可选，参考文档
└── assets/            # 可选，模板、图片等
\`\`\`

**安装位置**：

| 范围 | 路径 |
|------|------|
| 个人全局 | \`~/.claude/skills/\` |
| 项目级 | \`.claude/skills/\` |
| Codex CLI | \`~/.codex/skills/\` |

课程用两个案例演示自定义 Skill 创建：
1. **练习题生成器**——输入讲义笔记，生成判断题 / 选择题 / 简答题 / 应用题
2. **时间序列分析器**——三步工作流：运行诊断脚本 → 生成可视化 → 输出分析报告

**我们的点评**：两个案例覆盖了 Skill 设计的两种典型模式——纯指令型（练习题）和脚本驱动型（时间序列）。大多数真实 Skill 属于这两者之一。

**SkillNav 推荐**：想看更多社区 Skill 的写法？浏览[编码开发类 Skills](/skills?category=编码开发) 和[数据处理类 Skills](/skills?category=数据处理)，每个 Skill 详情页都可以查看完整 SKILL.md 内容。

---

### 第 8 课：Skills 与 Claude API

**重要提醒**：Claude Desktop 中创建的 Skills 不会同步到 API 和 Claude Code，需要手动迁移。

这节课教你用 **Messages API** + **Code Execution Tool** + **Files API** 在代码中调用 Skill：

1. 上传 Skill 文件到沙箱容器
2. 通过系统提示告诉 Claude 可用的 Skills
3. Claude 按需加载并执行

**注意**：API 沙箱**没有互联网连接**（Claude Desktop 有），如果 Skill 需要联网，要通过 MCP 或外部工具补充。

**适用场景**：需要在自己的应用中集成 Skill 能力——比如搭建一个内部工具，让团队成员通过 API 调用标准化的分析流程。

---

### 第 9 课：Skills 与 Claude Code（最长一课，24 分钟）

这是全课程**实战含量最高**的一课。Claude Code 的三阶段工作循环：

\`\`\`
收集上下文 → 采取行动 → 验证结果
\`\`\`

**Claude Code 的完整扩展层**：

| 功能 | 作用 | 示例 |
|------|------|------|
| CLAUDE.md | 持久项目上下文 | "使用 pnpm，不用 npm" |
| Skills | 可复用知识和工作流 | /review 运行代码审查清单 |
| Subagents | 隔离执行上下文 | 研究任务返回摘要 |
| MCP | 连接外部服务 | 查询数据库、发 Slack |
| Hooks | 确定性脚本 | 每次编辑后自动运行 ESLint |

**进阶技巧**：在 SKILL.md 头部设置 \`disable-model-invocation: true\` 可以让 Skill 只在手动调用时激活（如 \`/review\`），避免自动触发浪费 token。

**SkillNav 推荐**：Claude Code 的 Skill 生态是目前最丰富的。浏览我们的[全部精选 Skills](/skills?platform=claude)，按 Stars 排序找到社区最认可的 Skill。

---

### 第 10 课：Skills 与 Agent SDK

课程压轴——用 Claude Agent SDK 构建一个**多智能体研究系统**：

\`\`\`
指挥官（Main Agent）
├── Docs Researcher    → 查文档（WebSearch + WebFetch）
├── Repo Analyzer      → 分析代码（Bash + Read + Grep）
└── Web Researcher     → 搜教程视频（WebSearch + WebFetch）
\`\`\`

工作流：加载 Skill → 制定研究计划 → 三个子智能体并行执行 → 合成报告 → 通过 Notion MCP 写入云端。

**安全提醒**：生产环境中必须实现 **Human-in-the-loop** 机制——Agent 请求使用高风险工具时需要人工确认。

**我们的点评**：这个架构就是 SkillNav 一直在说的"Skills + MCP + Subagents 三驾马车"的完整演示。如果你的团队需要自动化研究或情报收集流程，这节课是最好的参考。

---

## SKILL.md 格式速查

一张表总结 Skill 的全部规范：

| 项目 | 规范 |
|------|------|
| **入口文件** | SKILL.md（必需） |
| **name** | ≤64 字符，小写字母+数字+连字符，推荐 \`动词-ing-名词\` 格式 |
| **description** | ≤1024 字符，包含触发关键词（Agent 用此判断是否加载） |
| **正文** | ≤500 行，分步骤说明，含输入/输出格式和示例 |
| **scripts/** | 可选，Python 等可执行脚本（Claude 执行后只接收输出） |
| **references/** | 可选，参考文档（按需加载） |
| **assets/** | 可选，模板文件、图片等 |
| **安装** | 个人: \`~/.claude/skills/\` · 项目: \`.claude/skills/\` |
| **跨平台** | Claude Code / Codex CLI / Cursor 均支持 |

---

## 社区反馈与编辑补充

课程上线后，DeepLearning.AI 社区论坛出现了一些有价值的讨论——有些问题课程本身没有讲透，我们在这里补充。

### Skills vs 脚本：什么时候该用 Skill？

社区里被问得最多的问题：销售分析这种确定性工作流，为什么不直接写批处理脚本？

[论坛里最佳回答](https://community.deeplearning.ai/t/why-use-skills-rather-than-regular-scripts-code/888143)给出了务实的判断——确定性代码执行更快、成本更低；但 Skill 的优势在于处理**非结构化内容**，模型能理解上下文，让流程在模糊场景下继续运转。

**编辑判断**：这两者不是替代关系。如果你的工作流输入输出完全确定，直接写脚本。如果涉及自然语言理解、格式不统一的数据、或需要灵活判断的步骤——那才是 Skill 的用武之地。实际项目中，最常见的模式是**脚本 + Skill 混合**：脚本做确定性的数据清洗和 IO，Skill 负责需要理解力的环节。

### 课程没讲透的两个问题

1. **Agent 和 Skill 的连接机制**——Skill 定义里没有显式引用子智能体或工具，[有学员困惑连接是否是隐式的](https://community.deeplearning.ai/t/how-do-agents-and-skills-interact-in-the-claude-code-agent-short-course/889763)。答案是：框架运行时根据 Skill 的 \`name\` 和 \`description\` 做语义匹配，Agent 判断当前任务与哪个 Skill 相关后自动加载，不需要硬编码路径。

2. **自定义 Skill 的评估方法**——课程演示了用 JSON 文件做测试，但[有学员反馈讲得不够清楚](https://community.deeplearning.ai/t/evaluation-for-custom-skills/888043)。目前 Skills 生态还没有成熟的测试框架，实践中常见做法是：准备 3-5 个典型输入场景，对比 Agent 有 Skill 和无 Skill 时的输出质量差异。

### 中文学习资源

课程是英文授课。如果英文吃力，有两个替代方案：

- [Datawhale 中文翻译项目](https://github.com/datawhalechina/agentic-ai)——社区驱动的中文翻译和知识梳理
- [B站中文字幕版](https://www.bilibili.com/video/BV1qv6eBZErD/)——搬运版，带字幕

---

## 学习路径建议

根据你的背景，推荐不同的学习顺序：

### 路径 A：从零开始（没用过 Claude Code）

\`\`\`
第 1-2 课（概念入门）→ 第 5 课（理清生态关系）→ 第 6 课（体验预构建 Skill）
→ 安装 Claude Code 实际使用一周 → 第 7 课（写第一个自定义 Skill）
\`\`\`

### 路径 B：已有 Claude Code 经验

\`\`\`
第 5 课（速览生态）→ 第 7 课（Skill 格式规范）→ 第 9 课（Claude Code 进阶）
→ 回看第 6 课参考官方范本 → 第 10 课（Agent SDK 扩展）
\`\`\`

### 路径 C：想在产品中集成

\`\`\`
第 5 课（架构选型）→ 第 8 课（API 集成）→ 第 10 课（Agent SDK）
→ 第 7 课（自定义 Skill 规范）
\`\`\`

---

## 延伸资源

| 资源 | 链接 | 说明 |
|------|------|------|
| 课程官网 | [deeplearning.ai](https://www.deeplearning.ai/short-courses/agent-skills-with-anthropic/) | 免费注册即可观看 |
| 课程代码 | [sc-agent-skills-files](https://github.com/https-deeplearning-ai/sc-agent-skills-files) | 全部实验代码 |
| Anthropic 官方 Skills | [anthropics/skills](https://github.com/anthropics/skills) | 17 个官方 Skill 范本 |
| Skills 开放标准 | [agentskills.io](https://agentskills.io) | 跨平台规范文档 |
| Claude Code Skills 文档 | [code.claude.com/docs](https://code.claude.com/docs/en/skills) | 官方使用指南 |
| Anthropic 博客 | [Equipping Agents with Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills) | Skills 设计理念 |
| SkillNav Skills 导航 | [skillnav.dev/skills](/skills) | 168 个精选 Skill，中文详情 |
| SkillNav MCP 导航 | [skillnav.dev/mcp](/mcp) | MCP Server 精选 |

---

*本文由 SkillNav 编辑部撰写。我们不只是翻译课程内容——在结构化摘要之外，补充社区真实反馈、编辑判断和中文学习资源，帮你用最短时间判断是否值得学、怎么学最高效。*`;

const content = `## Why This Course Matters

In January 2026, Andrew Ng partnered with Anthropic to launch a free short course on DeepLearning.AI — Agent Skills with Anthropic, taught by Elie Schoppik, Anthropic's Head of Technical Education.

Agent Skills are an open standard for packaging reusable instructions that extend AI agent capabilities. This 2-hour course covers the full spectrum: from concept to Claude Code, Claude API, and Agent SDK integration.

## Course Overview

10 lessons covering: Skill structure and progressive disclosure, pre-built vs custom Skills, Skills vs MCP vs Subagents, API integration, Claude Code workflows, and multi-agent systems with Agent SDK.

Total duration: ~2h 19min | Level: Beginner | Free`;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const publish = process.argv.includes("--publish");
  validateEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const record = {
    slug,
    title,
    title_zh: titleZh,
    summary,
    summary_zh: summaryZh,
    content,
    content_zh: contentZh,
    source: "manual",
    source_url: `https://skillnav.dev/articles/${slug}`,
    article_type: "guide",
    content_tier: "editorial",
    reading_time: 12,
    relevance_score: 5,
    status: publish ? "published" : "draft",
    published_at: now,
  };

  if (dryRun) {
    log.info("[DRY RUN] Would insert article:");
    log.info(`  Title: ${record.title_zh}`);
    log.info(`  Slug: ${record.slug}`);
    log.info(`  Type: ${record.article_type}`);
    log.info(`  Tier: ${record.content_tier}`);
    log.info(`  Status: ${record.status}`);
    log.info(`  Content length: ${contentZh.length} chars`);
    log.info(`  Reading time: ${record.reading_time} min`);
    log.info("\n--- Content preview (first 800 chars) ---");
    log.info(contentZh.slice(0, 800));
  } else {
    const { error: insertErr } = await supabase
      .from("articles")
      .upsert(record, { onConflict: "source_url", ignoreDuplicates: false });

    if (insertErr) {
      log.error(`Failed to insert article: ${insertErr.message}`);
      process.exit(1);
    }
    log.success(`Article inserted as ${record.status}: "${titleZh}"`);
    log.info(`Slug: ${slug}`);
    log.info(`URL: /articles/${slug}`);
  }

  log.done();
}

main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
