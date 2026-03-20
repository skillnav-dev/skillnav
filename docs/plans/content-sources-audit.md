# SkillNav 信息源终审决策
Status: done
Progress: N/A
Date: 2026-03-06

> 决策依据: 3 轮深度调研（竞品分析 + KOL/内容源 + 开发者需求/市场）

---

## 一、决策背景

### 1.1 SkillNav 定位

> **SkillNav — 中文开发者的 AI 智能体工具站（Skills · MCP · 实战资讯）**

- **核心人群**: 用 Claude Code / Cursor / Codex 的中国开发者（60%）
- **次核心**: 用 LangChain/CrewAI 等框架构建 Agent 应用的开发者（30%）
- **外围**: 关注 AI 工具趋势的技术管理者（10%）

### 1.2 核心原则

| 原则 | 说明 |
|------|------|
| **翻译即增值** | 英文源进 RSS 管线（翻译是增值），中文源不进管线（搬运无增值且有版权风险） |
| **宁少不杂** | 我们不是"AI 综合资讯"，是"AI Agent 工具站"，每篇内容必须命中定位 |
| **质量密度** | 目标每天 2-5 篇精品，不追求数量 |

### 1.3 内容分类（4 类）

| 类型 ID | 中文名 | 内容定义 | 举例 |
|---------|--------|---------|------|
| `practical` | 实战技巧 | CLAUDE.md 写法、Skills workflow、MCP 集成、多 Agent 协作 | "用 5 个 Skill 让 Claude Code 效率翻倍" |
| `agent-app` | 智能体应用 | Agent 架构、框架对比、多智能体编排、落地案例 | "CrewAI vs LangGraph 多智能体对比" |
| `ecosystem` | 生态动态 | 产品发布、协议更新、行业大事（精选，不泛） | "MCP 正式加入 Linux Foundation" |
| `review` | 工具评测 | Skills/MCP Server/工具的第一手使用体验 | "10 个最实用的 MCP Server 实测" |

---

## 二、信息源终审结果

### 2.1 T1 核心源（全量或轻过滤，每日同步）

| # | 源 | 状态 | RSS | 默认分类 | 过滤策略 | 入选理由 |
|---|-----|------|-----|---------|---------|---------|
| 1 | **Anthropic Blog** | 保留 | `anthropic-rss-feed` GitHub | ecosystem | 全量接受 | Claude/MCP 官方，一手信息，核心中的核心 |
| 2 | **OpenAI Blog** | 保留 | `openai.com/news/rss.xml` | ecosystem | 仅 Codex/Agent/Skills/MCP | Codex/Agent 竞品动态必须跟 |
| 3 | **Simon Willison** | 保留 | `simonwillison.net/atom/everything/` | practical | AI/LLM/MCP/Agent 关键词 | 独立客观，AI 工具使用最深度的博主，被 Karpathy 推荐 |
| 4 | **Latent Space** | 保留 | `latent.space/feed` | agent-app | 长文+播客笔记，跳过 AINews 日报 | AI Engineering 最深播客/博客，覆盖 Agent Swarms/Codex/Claude |
| 5 | **GitHub Blog** | 保留 | `github.blog/feed/` | ecosystem | Copilot/Agent/MCP/AI 关键词 | Copilot SDK、Coding Agent、MCP Registry |
| 6 | **AI Coding Daily** | ✅ 新增 | `aicodingdaily.substack.com/feed` | practical | 轻过滤（~90% 直接命中） | **本轮最大发现**。专精 AI 编程工具，几乎每期覆盖 Claude Code/Cursor/MCP/Agent workflow |
| 7 | **PulseMCP** | ✅ 新增 | `pulsemcp.com` feed | ecosystem | 全量接受 | MCP 生态最权威英文周报，Steering Committee 成员运营 |

### 2.2 T2 选择性同步（严格关键词过滤）

| # | 源 | 状态 | RSS | 默认分类 | 过滤策略 | 入选理由 |
|---|-----|------|-----|---------|---------|---------|
| 8 | **LangChain Blog** | 保留 | `blog.langchain.dev/rss/` | agent-app | 仅趋势报告和行业分析，跳过纯框架教程 | Agent 框架头部玩家，State of AI Agents 年报有价值 |
| 9 | **HuggingFace Blog** | 保留 | `huggingface.co/blog/feed.xml` | ecosystem | 仅 Agent/MCP/smolagents 关键词 | Tiny Agents MCP、smolagents 有价值 |
| 10 | **CrewAI Blog** | 保留 | `blog.crewai.com/rss/` | agent-app | 仅多 Agent 编排趋势文 | 多智能体框架代表，更新频率低但质量可控 |
| 11 | **The New Stack** | ✅ 新增 | `thenewstack.io` feed | agent-app | MCP/Agent/AI coding 关键词 | Agent/MCP 企业视角，深度好，报道过 Agent Skills 标准 |

### 2.3 移除源（5 个）

| 源 | 现有 published 文章数 | 移除理由 |
|----|---------------------|---------|
| **Vercel** | 57 篇（占已发布 45%） | 前端框架为主，与 Agent 工具无关，严重稀释品牌定位 |
| **Google AI** | 2 篇 | 研究论文导向，开发者用不上 |
| **Semantic Kernel** | 10 篇 | 微软特定技术栈，受众太窄 |
| **Ars Technica AI** | 2 篇 | 泛 AI 新闻，无实战价值 |
| **TechCrunch AI** | 0 篇 | 投融资新闻，不是我们的调性 |

### 2.4 评估后不接入的源

以下信息源经过调研，明确不纳入 RSS 自动翻译管线：

#### 英文 Newsletter（不作为翻译源，但 5 源已纳入信号层）

> **2026-03-20 更新**: 以下 5 个日报虽不适合作为翻译源（命中"读完能动手做"的比例低），但实测发现它们对选题判断极有价值。2026-03-19 数据显示，5 源交叉热度≥3 的话题共 6 条，我们 14 个 RSS 源仅覆盖 1 条（覆盖率 17%）。这些日报已纳入**信号层**（见 `specs/content-signals-spec.md`），用于 Daily Brief 选题增强，不翻译其内容。

| 源 | 订阅量 | 翻译管线命中率 | 不作为翻译源的理由 | 信号层角色 |
|----|--------|--------------|------------------|-----------|
| TLDR AI | 92 万+ | ~15-20% | 每日量大，80%+ 非工具实操 | **信号源** — 条目最多，覆盖面最广 |
| The Rundown AI | 200 万+ | ~10-15% | 偏商业决策者视角 | **信号源** — 订阅量最大，反映主流关注 |
| Superhuman AI | 150 万+ | ~5% | 非开发者受众 | **信号源** — 补充产品/设计视角 |
| Ben's Bites | 12 万+ | ~20% | 创业/投资视角为主 | **信号源** — Builder 视角，与我们定位最近 |
| The Neuron | 50 万+ | ~5% | 泛 AI 新闻 | **信号源** — 主次分明，含来源标注 |
| AlphaSignal | 20 万+ | ~10-15% | 偏 ML 研究和论文，与工具生态交集小 | 未纳入 |
| AI Weekly | — | ~0% | 纯宏观社会议题，零工具内容 | 未纳入 |
| DataNorth AI | — | ~5% | AI 商业策略，非工具实操 | 未纳入 |
| Composio Blog | — | 中等 | 偏自家工具推广，信息质量不稳定 | 未纳入 |
| Vibe Sparking AI | — | 高 | Claude Code changelog 有价值但过于细碎，不适合翻译文章 | 未纳入 |
| codewithmukesh | 8200+ | ~70% | .NET 生态偏向，改为手动策展（见 2.5） | 未纳入 |

#### 英文综合科技媒体（定位不符）

| 源 | 排除理由 |
|----|---------|
| MIT Technology Review | 120 年历史但太宏观，非工具实操 |
| The Verge AI | 消费者视角，非开发者 |
| Wired AI | AI 社会影响长篇，非工具生态 |

#### 中文媒体（搬运无增值）

| 源 | 命中率 | 排除理由 |
|----|--------|---------|
| 量子位 (QbitAI) | ~15-20% | 综合 AI 媒体，中文搬运无增值。改为**选题雷达**（它们报什么，我们深挖什么） |
| 机器之心 (Synced) | ~10-15% | 偏学术/论文解读，RSS 不稳定 |
| 36氪 AI | ~10% | 投融资视角，与开发者实践不重叠 |
| InfoQ 中文 | ~25-30% | 内容质量高但版权严格，改为**话题灵感**参考 |
| DeepSeek 官网 | 0% | 纯模型供应商，无博客 |

#### 其他

| 源 | 排除理由 |
|----|---------|
| Meta AI Blog | Llama 模型发布，非 Agent 工具 |
| 字节跳动/豆包 | 国产模型生态，非我们的定位 |
| 阿里通义 | 同上 |
| arXiv | 学术论文首发，非工具实操 |
| GitHub Trending | 实时页面，无 RSS，不适合管线 |

### 2.5 手动策展源（Admin 后台发布）

| # | 源 | 内容类型 | 建议分类 | 策展节奏 |
|---|-----|---------|---------|---------|
| 1 | **宝玉 @dotey** (X/Twitter) | Claude Skills 分析、AI 工具洞察 | practical / review | 每周精选 1-2 条 |
| 2 | **Tony Bai 博客** (tonybai.com) | Claude Code 架构分析、中文深度技术文 | practical | 精选引用 |
| 3 | **r/ClaudeAI** (Reddit) | 真实用户反馈、vs 竞品对比 | practical / review | 每周热帖摘要 |
| 4 | **codewithmukesh** (codewithmukesh.com) | .NET Claude Kit、Skills/MCP 实操 | practical | 精选翻译 |
| 5 | **B 站教程** (马克的技术工作坊等) | Claude Code 视频教程推荐 | practical | 月度精选 |

### 2.6 参考资源（非内容源，而是创作蓝本）

| 资源 | 类型 | 对 SkillNav 的价值 |
|------|------|------------------|
| **roadmap.sh/claude-code** | 结构化学习路线图 | SkillNav "Claude Code 入门" 系列文章的结构蓝本 |
| **claude-code-best-practice** (10.2K ★) | GitHub 最佳实践仓库 | Skills/Hooks/CLAUDE.md 翻译素材，可考虑加入 curated skills 源 |
| **量子位 / InfoQ 中文** | 中文 AI 媒体 | **选题雷达** — 它们报什么，我们从工具实操角度深挖 |

---

## 三、产出节奏预测

| 来源类型 | 数量 | 日均候选量 |
|---------|------|-----------|
| T1 核心源（自动同步） | 7 个 | ~5-10 篇 |
| T2 选择性同步 | 4 个 | ~1-3 篇 |
| 手动策展 | 5 个 | ~2-3 篇/周 |

**管线流转**: 11 个自动源 → 日均 6-13 篇候选（draft）→ Admin 后台编辑精选 → **每日发布 2-5 篇**

---

## 四、Relevance 关键词（收紧版）

T1 源（Anthropic/CrewAI/AI Coding Daily/PulseMCP）全量接受，不做关键词过滤。

T2 源及其他需要过滤的源，使用以下收紧后的关键词集：

```
# Agent & Skills 核心
claude, anthropic, mcp, skill, agent, agentic, multi-agent, a2a,
agent-to-agent, model-context-protocol, tool-use, function-calling,
computer-use, code-execution

# AI 编程工具
cursor, copilot, codex, claude-code, ai-coding, ai-programming,
vibe-coding, agentic-engineering

# Agent 框架
crewai, langchain, langgraph, autogen, smolagents, openai-agents-sdk

# 工程实践
claude-md, prompt-engineering, context-engineering, rag, embedding
```

**移除的关键词**（之前过于宽泛）:
- ~~ai~~ — 太泛，几乎匹配所有文章
- ~~next.js~~ — 前端框架
- ~~vercel~~ — 已移除该源
- ~~ai-sdk~~ — 偏前端
- ~~hugging-face, transformers, diffusion~~ — 偏模型训练

---

## 五、存量清洗规则

对现有 126 篇 published 文章执行以下处置：

| 规则 | 操作 | 预估数量 |
|------|------|---------|
| 来源 ∈ {vercel, google-ai, semantic-kernel, arstechnica-ai, techcrunch-ai} | → hidden | ~71 篇 |
| 剩余文章 relevance_score < 3 | → hidden | ~10 篇 |
| 剩余文章 content 长度 < 500 字 | → hidden | ~5 篇 |
| **保留的高质量文章** | 保持 published | **~40 篇** |

---

## 六、执行清单

| # | 行动项 | 优先级 | 依赖 |
|---|--------|--------|------|
| 1 | 更新 `sync-articles.mjs`：移除 5 个源 | P0 | 无 |
| 2 | 更新 `sync-articles.mjs`：新增 AI Coding Daily / PulseMCP / The New Stack | P0 | 无 |
| 3 | 收紧 RELEVANCE_KEYWORDS | P0 | 无 |
| 4 | 执行存量清洗（SQL 批量 hidden） | P0 | 无 |
| 5 | DB migration：article_type 增加 `review` 类型 | P1 | 无 |
| 6 | 前端：更新 article_type 标签和颜色 | P1 | #5 |
| 7 | 卡片布局：无图文章用品牌占位图 | P1 | 无 |
| 8 | 更新 CLAUDE.md 定位和数据源描述 | P1 | 本文档 |
| 9 | 原创基石文章："10 个最实用的 Claude Code Skills 实测" | P2 | #5 |

---

## 七、竞品空白地带（支撑决策的调研发现）

本决策基于以下调研发现的 6 个市场空白：

1. **中文 Skills 深度评测** — 无人在做。所有 Skills 平台（ClawHub 13K+/SkillsMP 35万+/Skills Directory）均为英文纯目录
2. **MCP + Skills 融合视角** — 无人覆盖。MCP 目录和 Skills 目录完全割裂，但开发者工作流中两者密不可分
3. **中文 MCP 深度内容** — 严重不足。MCP 星球做聚合不做内容，PulseMCP 优质但无中文版
4. **AI 工具安全评估** — 中文完全空白。Snyk 审计发现 36.82% Skills 有安全缺陷，ClawHub 遭供应链攻击，中文零报道
5. **跨工具实战指南** — 极度稀缺。"横评"停留在功能表格，无人写 Claude Code + MCP + Skills 组合实战
6. **中立编辑评测品牌** — 被 SEO 垃圾淹没。中文世界没有 Wirecutter / PulseMCP 级别的中立评测

SkillNav 在以上 6 个空白中均有布局。

---

## 八、关键 KOL 参考

### 英文圈

| 人物 | 账号 | 关注理由 |
|------|------|---------|
| Alex Albert | @alexalbert__ | Anthropic Head of DevRel，Skills/MCP 官方动态 |
| Andrej Karpathy | @karpathy | "Agentic Engineering" 概念提出者 |
| swyx (Shawn Wang) | @swyx | Latent Space 主理人，AI 工程生态全景 |
| Simon Willison | @simonw | AI 工具最深度的独立博主 |
| Thariq Shihipar | @thariqshihipar | Claude Code 核心构建者 |

### 中文圈

| 人物 | 平台 | 关注理由 |
|------|------|---------|
| 宝玉 @dotey | X/Twitter | 中文 AI 推特顶流，Claude Skills 分析 |
| Tony Bai | tonybai.com | 中文最深度的 Claude Code 技术博客 |
| idoubi (艾逗笔) | X/Twitter | mcp.so 创建者，MCP 生态观察 |
| 马克的技术工作坊 | B 站 | Claude Code 全攻略 44 万播放 |

---

*本文档为 SkillNav 内容策略的核心依据，后续数据源变更需更新本文档。*
