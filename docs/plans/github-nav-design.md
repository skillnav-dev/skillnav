# GitHub 开源项目导航页 — 设计方案 v2

> 重建方案，替代 session 13 丢失的原方案

## 一、战略定位

### 为什么做这个页面？

SkillNav 现有三大板块：
- `/skills` — Agent Skills（168 精选）
- `/mcp` — MCP Servers（18 精选）
- `/articles` — 资讯翻译（~514 篇）

**缺失的一环**: Skills 和 MCP 是生态的"末端工具"，但用户更基础的需求是"我该用什么 Agent 框架？什么 RAG 方案？什么 AI 编码工具？" — 这些是 GitHub 上的开源项目，不属于 Skills 也不属于 MCP。

### 定位

**AI Agent 生态开源项目精选导航** — 覆盖 Skills/MCP 之外的框架、平台、工具链。

### 与现有板块的关系

```
GitHub 项目导航（框架/平台/工具链 — 生态全景）
  ├── Skills（Agent 技能 — 编码工具的扩展）
  ├── MCP（协议服务 — AI 的外部连接）
  └── 资讯（行业动态 — 持续追踪）
```

### 竞品空白

| 竞品 | 短板 |
|------|------|
| HelloGitHub | 全品类，AI Agent 不是重点，无深度编辑 |
| GrowingGit | 纯数据排行，按语言分类，无场景导向 |
| OSSInsight | 分析工具，不是发现/推荐场景 |
| skills.sh | 仅 Skills，不覆盖框架/平台 |
| 各种 Awesome 列表 | 纯链接罗列，无质量筛选和中文描述 |

**SkillNav 的差异**: 中文 + AI Agent 聚焦 + 编辑精选 + 场景导向分类

## 二、核心决策

### 决策 1：数据方案 — 静态 TS（同 MCP 模式）

**选择**: 静态 TypeScript 数据文件，不入 Supabase

**理由**:
- 精选 50-80 个项目，不是 6,400+ 的量级
- 编辑精选 = 人工策展，不需要自动同步
- 与 MCP 页面保持一致模式，代码可复用
- 上线速度快，无需 DB migration
- Stars 数写入时手动更新，后续可加 GitHub API cron

**推翻 session 13 决策**: 原方案选 Supabase DB + GitHub API 自动维护，过度工程化。50-80 个精选项目用 DB 是杀鸡用牛刀。

### 决策 2：分类体系 — 场景导向

不按编程语言分，按 AI Agent 生态层级分：

| 分类 | 中文 | 典型项目 |
|------|------|----------|
| agent-framework | Agent 框架 | LangChain, CrewAI, AutoGen, MetaGPT |
| ai-coding | AI 编码 | Aider, OpenDevin, Continue, Cline |
| ai-platform | AI 应用平台 | Dify, n8n, Flowise, Langflow |
| rag | RAG & 知识库 | LlamaIndex, RAGFlow, Haystack |
| model-runtime | 模型推理 | Ollama, vLLM, LocalAI, LM Studio |
| devtools | 开发者工具 | Prompt 工程、调试、监控 |
| resources | 精选资源 | Awesome 列表、学习路径 |

共 7 个分类，可按需增减。

### 决策 3：路由 — `/github`

- 直接、明确、SEO 友好
- 用户搜索 "AI GitHub 项目推荐" 时自然命中
- 导航菜单不新增入口（已有 5 项），通过首页和文章内链引流

### 决策 4：不做详情页

- 项目详情直接链到 GitHub 仓库（外链）
- 避免与 Skills 详情页功能重叠
- 减少维护负担

## 三、数据结构

```typescript
interface GitHubProject {
  slug: string;
  name: string;                    // e.g. "LangChain"
  nameZh: string;                  // e.g. "LangChain"（多数不翻译）
  repo: string;                    // e.g. "langchain-ai/langchain"
  description: string;             // English one-liner
  descriptionZh: string;           // 中文 2-3 句介绍
  category: GitHubCategory;        // 场景分类
  tags: string[];                  // e.g. ["python", "typescript", "rag"]
  stars: number;                   // 手动更新
  language: string;                // 主要语言
  license?: string;                // e.g. "MIT", "Apache-2.0"
  editorPick?: boolean;            // 编辑推荐
  editorComment?: string;          // 编辑一句话点评
  relatedSkills?: string[];        // 关联 Skill slugs
  relatedMcp?: string[];           // 关联 MCP slugs
}
```

## 四、页面设计

### 布局（同 MCP 页面模式）

```
┌─────────────────────────────────────────────┐
│  SectionHeader: AI Agent 开源项目精选        │
│  "精选 AI Agent 生态核心开源项目..."         │
├─────────────────────────────────────────────┤
│  [搜索框]  [全部|Agent框架|AI编码|平台|...]  │
├─────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Project  │ │ Project  │ │ Project  │    │
│  │ Card     │ │ Card     │ │ Card     │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │          │ │          │ │          │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

### 项目卡片设计

```
┌──────────────────────────────────────┐
│  ★ 编辑推荐                    ⭐ 87K │
│  LangChain                          │
│  langchain-ai/langchain             │
│                                     │
│  构建 LLM 驱动应用的全栈框架，       │
│  提供 Chain、Agent、Memory 等        │
│  核心抽象，生态最成熟。              │
│                                     │
│  Python  MIT  Agent 框架             │
│                                     │
│  "Agent 开发的事实标准，生态无敌"     │
│  ───────────────────────────────     │
│  [GitHub ↗]                         │
└──────────────────────────────────────┘
```

卡片元素：
1. 编辑推荐标记（可选）
2. Stars 数（右上角）
3. 项目名 + repo 路径
4. 中文描述（2-3 句）
5. 语言 + License + 分类标签
6. 编辑点评（可选，斜体）
7. GitHub 外链

### 交互

- 客户端搜索 + 分类过滤（同 MCP 模式，`useState` + `useMemo`）
- 分类按钮横向滚动（移动端友好）
- 卡片整体可点击，链接到 GitHub
- 无分页（50-80 项目一屏加载）

## 五、初始项目清单

从现有 4 份 GitHub 研究文档中精选，按分类整理：

### Agent 框架（~10 个）
- LangChain, CrewAI, AutoGen, MetaGPT, SuperAGI
- AgentGPT, LangGraph, Semantic Kernel, Camel-AI, Phidata

### AI 编码（~8 个）
- Aider, OpenDevin/OpenHands, Continue, Cline
- GPT Engineer, Sweep, Cursor Rules (awesome-cursorrules)
- bolt.new

### AI 应用平台（~8 个）
- Dify, n8n, Flowise, Langflow
- AnythingLLM, LibreChat, LobeChat, Open WebUI

### RAG & 知识库（~6 个）
- LlamaIndex, RAGFlow, Haystack
- Chroma, Weaviate, Qdrant

### 模型推理（~6 个）
- Ollama, vLLM, LocalAI, LM Studio
- llama.cpp, Jan

### 开发者工具（~6 个）
- LangSmith (langfuse), Weights & Biases
- Promptfoo, Phoenix (Arize)
- Instructor, Outlines

### 精选资源（~6 个）
- awesome-mcp-servers, awesome-chatgpt-prompts
- awesome-ai-agents, awesome-llm-apps
- awesome-generative-ai, AI Product Home

**总计约 50 个**，后续按需扩展。

## 六、文件结构

```
src/
├── app/github/
│   └── page.tsx              # 页面组件（Server Component）
├── components/github/
│   ├── github-grid.tsx       # Client: 搜索/过滤/网格
│   └── github-card.tsx       # Client: 单个项目卡片
└── data/
    └── github-projects.ts    # 静态数据 + 类型定义
```

共 4 个新文件，复用现有 SectionHeader、BreadcrumbJsonLd、Badge 等组件。

## 七、实施计划

| 步骤 | 内容 | 预计工作 |
|------|------|----------|
| 1 | 创建 `github-projects.ts` 数据文件（类型 + 50 个项目） | 主要工作量 |
| 2 | 创建 `github-card.tsx` 卡片组件 | 复用 MCP card 模式 |
| 3 | 创建 `github-grid.tsx` 网格 + 搜索/过滤 | 复用 MCP grid 模式 |
| 4 | 创建 `page.tsx` 页面 | 最简，同 MCP |
| 5 | SEO: metadata + JSON-LD | 标准流程 |
| 6 | Build 验证 + 提交 | 标准流程 |

## 八、不做的事

- ❌ 不入 Supabase（50 个项目不需要 DB）
- ❌ 不做详情页（直链 GitHub）
- ❌ 不加导航菜单入口（5 项已满，通过内链引流）
- ❌ 不做 GitHub API 自动更新（Phase 2 再考虑）
- ❌ 不做趋势图表（OSSInsight 已做到极致）
- ❌ 不做全品类覆盖（只做 AI Agent 生态）
