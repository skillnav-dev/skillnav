# 感知层 + 热度看板方案

Status: **Phase 0-2 done, Phase 3 pending**
Progress: 2/3 phases
Date: 2026-04-07
Author: Claude (战略合伙人) + 人工拍板
Depends-on: content-strategy-v3.md, ADR-005 (LLM-first editorial funnel)
Review: 4-agent 评审 + Codex independent review (114K tokens)

---

## 0. 一句话

**把 SkillNav 的信息感知能力从"内部管线"变成"公开产品"** — 用户一眼看到 AI 开发者生态今天在发生什么，同时我们自己看到感知网络的健康度。

---

## 1. 为什么做

### 1.1 现状

SkillNav 已经建了一个不错的采集管线（16 RSS + 5 Newsletter + 3 论文源 + 2 MCP Registry + 10+ Skills 仓库），但有两个问题：

**对外不可见** — 用户不知道我们在追踪什么，看不到"今天什么最热"。Daily Brief 只是每天推一次编辑精选，没有实时热度感。

**对内不可控** — 哪个源挂了、哪个源信噪比低、哪个维度有盲区，没有一个统一视图。全靠看日志。

### 1.2 核心缺口

content-signals-spec 已指出：5 大 Newsletter 只覆盖 17% 的热门话题。更深层的原因是——

**缺少"一线实践"信号层**。官方博客和 Newsletter 是二手信息（编辑筛选后的），一手信息在 X/Twitter、HN、Reddit。这三个地方是 AI 从业者的实时广播，新工具发布、prompt 技巧、agent 架构洞察，往往比 Newsletter 早 12-24 小时。

### 1.3 竞品空白

| 产品 | 做了什么 | 没做什么 |
|------|---------|---------|
| GitHub Trending | 单维度（repos by stars today） | 不覆盖论文、资讯、实践 |
| HuggingFace Papers | 单维度（papers by upvotes） | 不覆盖工具、社区讨论 |
| follow-builders | X+Podcast 采集 → agent 摘要 | 没有热度排名，没有公开页面 |
| 阮一峰周刊 | 编辑人格 + 固定板块 | 纯手工，周更，不实时 |
| Toolify / AIBase | 工具排名（按访问量） | 不覆盖论文、资讯、实践 |

**没有人在做"AI 开发者生态的跨品类热度看板"。** 这是 SkillNav 编辑品牌的自然延伸。

---

## 2. 产品定义

### 2.1 Trending 与 Daily Brief 的关系

两者互补，不竞争：

| | `/trending` 热度看板 | `/daily` 编辑精选 |
|---|---|---|
| **视角** | 数据驱动 — "大家在看什么" | 编辑驱动 — "你该看什么" |
| **节奏** | 每日更新（随采集管线刷新） | 每日 1 期，定时发布 |
| **覆盖面** | 宽 — 四赛道热度排名 | 窄 — 克制精选（总共 3-7 条） |
| **深度** | 浅 — 标题 + 热度数 + 一句话 | 深 — 编辑点评 + "为什么重要" |
| **品牌调性** | "仪表盘" — 客观、透明 | "主编推荐" — 主观、有态度 |

**信息流向**：Trending 是 Daily Brief 的上游素材池。编辑从 Trending 看到全景，挑选最值得深评的进入 Brief。

**导航区分**：Trending 用"热度"文案，Brief 用"精选/日报"文案。

### 2.2 两个产品表面

| 表面 | 受众 | 核心问题 | 更新频率 |
|------|------|---------|---------|
| **`/trending` 热度看板** | 所有用户 | "AI 开发者生态今天什么热？" | 每日更新（ISR 5min） |
| **感知源状态栏**（看板底部） | 用户 + 编辑 | "这些数据从哪来的？靠谱吗？" | 随看板更新 |

> ⚠️ v3 修正：不再使用"实时"描述。采集频率为日频（X/Reddit 1次/天，HN 2次/天），ISR 5min 刷新的是同一份日数据。

### 2.3 `/trending` 信息架构

四赛道并行的生态脉搏：

```
┌──────────────────────────────────────────────────────────┐
│  AI 开发者生态热度     今日 · 本周                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📄 论文                                ⭐ 工具          │
│  ──────                                ──────           │
│  #1 标题 (中文)              367👍      #1 工具名         │
│     机构 · 态度标签 · 有代码             +899⭐ · Agent   │
│  #2 ...                                #2 ...           │
│  #3 ...                                #3 ...           │
│                                                          │
│  📰 资讯                                💬 社区热议      │
│  ──────                                ──────           │
│  #1 标题                    3源覆盖     #1 推文/帖子摘要  │
│     来源 · 时间                          @handle · 🔥142  │
│  #2 ...                                #2 ...           │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  感知网络: 16 RSS ✅ · 5 Newsletter ✅ · X 40人 ✅       │
│  · HF ✅ S2 ⚠️ · HN ✅ Reddit ✅ · 今日 312→42 精选     │
└──────────────────────────────────────────────────────────┘
```

> ⚠️ v3 修正：去掉"本月"切换。只做"今日"（默认）和"本周"。"本周"复用 DB 已有的 7 天窗口查询（articles.published_at + stars_snapshots）。没有额外的月度聚合需求。

### 2.4 四条赛道定义

| 赛道 | 内容 | 数据来源 | 每日条目 |
|------|------|---------|---------|
| **论文** | AI 研究热榜 | HF Daily Papers API 实时查询（按 upvotes 排序） | Top 5-10 |
| **工具** | Skills/MCP 飙升榜 | `weekly_stars_delta`（DB 查询，monorepo 去重） | Top 5-10 |
| **资讯** | 行业热点 | `articles` 表 + LLM editorial funnel | Top 5-10 |
| **社区热议** | 一线实践和观点 | X/Twitter + HN + Reddit | Top 5-10 |

**赛道空白处理**：某天某赛道不足 3 条时，该赛道折叠为"今日暂无显著热点"。宁可空着也不凑数。

### 2.5 每条赛道的数据字段

**论文**：标题(中文) · 机构 · HF 👍 · 态度标签 · 有无代码

**工具**：名称(中文) · 类型(Skill/MCP) · ⭐ 增量 · 总星数 · 分类标签 · 编辑点评

**资讯**：标题(中文) · 来源 · 发布时间 · 编辑摘要

**社区热议**：内容摘要(中文) · 作者 @handle · 平台(X/HN/Reddit) · 互动数 · 原文链接

> 社区热议的中文摘要策略：短推文保留原文 + 一句中文概括；长帖用 LLM 摘要。不逐句翻译。

---

## 3. 感知元模型

### 3.1 什么是感知元

每个信息源是一个**感知元（Perception Atom）**，有四个属性：

| 属性 | 定义 | 衡量方式 |
|------|------|---------|
| **存活** | 在其采集周期内成功过 | last_success_at < expected_interval × 2 |
| **产出** | 周期内产出条目数 | fetched_per_cycle_avg |
| **通过率** | 产出中被采用的比例 | published / fetched（仅适用于 articles 类型） |
| **独占率** | 只有该源覆盖的信息占比 | Phase 3 才计算 |

> ⚠️ v3 修正：存活判断改为"采集周期 × 2"。每个源有自己的 `expected_interval`：
> - 日频源（RSS/Newsletter/X/HN/Reddit）：24h
> - 周频源（Skills/MCP sync/Podcast）：7d
> - 因此周频源不会被错误标红。

> ⚠️ v3 修正：通过率仅适用于 articles 管线（有 published/draft/hidden 状态）。X/HN/Reddit 信号没有"发布"概念，不计算通过率。

### 3.2 感知元全景（目标状态）

```
              ┌─────────────────────────────────┐
              │         感 知 层                  │
              ├─────────────────────────────────┤
              │                                 │
  官方声音     │  16 RSS (Anthropic/OpenAI/...)  │  ← 已有, 日频
              │                                 │
  编辑判断     │  5 Newsletter (TLDR/Bens/...)   │  ← 已有, 日频
              │                                 │
  学术前沿     │  HF + S2 + Newsletter 提取      │  ← 已有, 日频
              │                                 │
  工具生态     │  2 MCP Registry + 10+ Skill 源  │  ← 已有, 周频
              │                                 │
  一线实践  ▶  │  X/Twitter (40 KOL)             │  ← 新增, 日频
              │                                 │
  社区共识  ▶  │  HN Top + Reddit Hot            │  ← 新增, 日频
              │                                 │
  深度访谈  ▶  │  6 Podcast (Latent Space/...)   │  ← P3, 周频
              │                                 │
              └─────────────────────────────────┘
                        ↓ LLM 编辑漏斗 (ADR-005)
              ┌─────────────────────────────────┐
              │  /trending (全景) → Daily Brief  │
              │  (编辑精选) → Skill (工作流推送)  │
              └─────────────────────────────────┘
```

### 3.3 新增源的具体方案

#### X/Twitter — TwitterAPI.io

- **方式**：TwitterAPI.io 非官方 API（$0.15/千条）
- **KOL 列表**：以 follow-builders 的 25 人为基础，扩展到 40 人
- **采集策略**：每天 1 次，每人最多 3 条原创推文（排除 RT 和回复）
- **热度字段**：likes + retweets + views
- **成本**：~$1-2/月
- **脚本**：`scripts/scrape-x-signals.mjs`
- **存储**：写入 `community_signals` 表（见 §4.2）
- **API 抽象**：`scripts/lib/x-client.mjs`，底层 provider 可切换

#### Hacker News — 官方 API（免费）

- **方式**：Firebase API，零成本
- **采集策略**：每天 2 次（CST 08:00 + 20:00），Top 500 → 正/负关键词过滤
- **关键词**：正面（AI/LLM/MCP/agent/Claude/GPT/Anthropic/OpenAI 等 30+）+ 负面（healthcare/policy/regulation/singer/music/art 等）+ 二级过滤：命中正面后还需含开发者上下文词（code/programming/developer/API/SDK/framework/tool/model/inference/training）之一，排除泛 AI 非技术帖
- **去重**：同一 story ID 保留 score 更高的版本
- **存储**：写入 `community_signals` 表

#### Reddit — 官方 API（免费 OAuth）

- **方式**：Reddit OAuth API，免费 60 req/min
- **前置**：注册 Reddit 应用（script 类型），审批可能 1-3 天
- **采集策略**：每天 1 次，3 个 subreddit（r/LocalLLaMA, r/MachineLearning, r/ClaudeAI）Hot Top 25
- **存储**：写入 `community_signals` 表

#### Podcast — P3，不阻塞

---

## 4. 数据架构（v3 重新设计）

### 4.1 核心原则：DB-backed，不用本地 JSON

> ⚠️ v3 关键修正（Codex #1）：SkillNav 部署在 Cloudflare Workers 上，`data/` 目录 gitignored，本地 JSON 在生产环境不可访问。所有 `/trending` 页面数据必须从 Supabase 查询。

**已有的 DB 数据（直接复用，零新建）**：

| 赛道 | 数据表 | 已有字段 | 查询方式 |
|------|--------|---------|---------|
| **论文** | HF Daily Papers API | title, upvotes, org, github | 实时查询 HF API，标注已翻译的链接到 /papers |
| **工具** | `skills` + `mcp_servers` | weekly_stars_delta, stars, freshness, github_url | 复用 `getTrendingTools()` + monorepo 去重 |
| **资讯** | `articles` (source≠'arxiv') | title_zh, source, published_at, relevance_score | 按 relevance_score + recency |

> ⚠️ v3.1 修正（产品走查 #2）：论文赛道改为实时查询 HF Daily Papers API，而不是查 DB 已翻译论文。原因：DB 只有已翻译论文（滞后 1-3 天），用户看不到今天 HF 144👍 的爆款。改为 HF API 后，每条论文标注是否有中文翻译（有 → 链接到 /papers/slug，无 → 链接到 arXiv 原文）。

> ⚠️ v3.1 修正（产品走查 #1）：工具赛道增加 monorepo 去重。已知 monorepo（anthropics/skills, openai/codex, modelcontextprotocol/servers）下的所有工具共享同一个 `weekly_stars_delta`，导致前 10 名全是假数据。修复：按 `github_url` 去重，同一 repo 只展示 delta 最高的一个工具。或直接排除已知 monorepo 的工具，只展示独立仓库。

**需要新建的**：

| 表 | 用途 | 字段 |
|----|------|------|
| `community_signals` | X/HN/Reddit 信号存储 | platform, external_id, author, author_handle, title, content_summary, content_summary_zh, url, score, likes, retweets, comments, fetched_at, signal_date, is_hidden |

> 只建一个新表 `community_signals`，论文/工具/资讯全部复用已有表。

### 4.2 `community_signals` 表设计

```sql
CREATE TABLE community_signals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  platform TEXT NOT NULL,           -- 'x', 'hn', 'reddit'
  external_id TEXT NOT NULL,        -- tweet ID / HN story ID / Reddit post ID
  author TEXT,                      -- display name
  author_handle TEXT,               -- @handle (X) or username (HN/Reddit)
  title TEXT,                       -- HN/Reddit title, null for X
  content_summary TEXT,             -- original text or excerpt
  content_summary_zh TEXT,          -- LLM 中文摘要
  url TEXT NOT NULL,                -- link to original
  score INT DEFAULT 0,              -- likes (X), score (HN), score (Reddit)
  likes INT DEFAULT 0,              -- X only
  retweets INT DEFAULT 0,           -- X only
  comments INT DEFAULT 0,           -- reply count
  signal_date DATE NOT NULL,        -- CST date
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  is_hidden BOOLEAN DEFAULT FALSE,  -- admin moderation flag
  UNIQUE(platform, external_id)
);
CREATE INDEX idx_cs_date ON community_signals(signal_date DESC, platform);
```

### 4.3 与 ADR-005 的关系（v3 关键澄清）

> ⚠️ v3 关键修正（Codex #2）：ADR-005 废弃了"regex 解析 + 结构化热度评分 + URL 交叉匹配"的模式，改用 LLM 直接做语义理解。本方案**不重走旧路**。

**方案与 ADR-005 的一致性**：

| ADR-005 废弃的 | 本方案不做的 |
|----------------|-------------|
| regex 解析信号 | ✅ 不做 regex 解析 |
| signals.json 结构化热度评分 | ✅ 不做跨源热度加权公式 |
| URL 精确匹配交叉验证 | ✅ 不做 URL/标题对齐 |

**方案做的是不同的事**：

- **论文/工具赛道**：直接查 DB 已有字段排序（`hf_upvotes` / `weekly_stars_delta`），不涉及信号层
- **资讯赛道**：复用 Daily Brief 的 LLM editorial funnel 输出（headline + noteworthy），不重建热度公式
- **社区赛道**：平台内原始互动数排序，不做跨平台归一化或加权

**generate-daily.mjs 的变化**：新增 X/HN/Reddit 原始文本作为 LLM 输入上下文（和 Newsletter 文本并列），由 LLM 在一次调用中做语义理解和编辑判断。不是"第 6 个独立信号源"，而是扩展现有 LLM prompt 的输入范围。

### 4.4 `/trending` 页面的数据查询

页面不需要 `compute-trending.mjs` 脚本，直接在 server component 中查询 Supabase：

```typescript
// 论文赛道：fetch HF Daily Papers API → 按 upvotes 排序 → 每条 cross-check DB 是否已翻译
// 工具赛道：getTrendingTools() → 按 github_url 去重（同 repo 只取一个）
// 资讯赛道：articles 表，source≠arxiv，按 relevance_score + recency
// 社区赛道：community_signals 表，is_hidden=false，按 score DESC，分 platform 分组
```

> ⚠️ v3 修正（Codex #10）：工具赛道不新建 compute 脚本，直接复用 `get-trending-tools.ts`。

---

## 5. 热度排序

### 5.1 设计原则

- 每条赛道内部用**单变量排序**（v0），不做跨赛道统一排名
- **不做加权公式**（ADR-005 教训：公式不如 LLM 语义理解）
- 2 周后回测，决定是否加二级排序变量

### 5.2 各赛道排序（v0 极简版）

| 赛道 | 排序变量 | 来源 | 说明 |
|------|---------|------|------|
| **论文** | `upvotes` DESC | HF Daily Papers API | 实时热度，每条标注是否有中文翻译 |
| **工具** | `weekly_stars_delta` DESC | skills + mcp_servers | 按 github_url 去重，排除 monorepo 共享 delta |
| **资讯** | `relevance_score` DESC + `published_at` DESC | articles 表 | 复用已有评分 |
| **社区** | `score` DESC（平台内排序） | community_signals | 按平台分组展示，不跨平台归一 |

> ⚠️ v3 修正（Codex #7）：资讯赛道 v0 不要求"多源覆盖"才上榜。单源首发的早期信号也会出现（由 relevance_score 决定），这才符合"比 Newsletter 早 12-24h"的价值主张。

### 5.3 社区赛道分组展示

v0 按平台分组，不做跨平台归一化：

```
💬 社区热议

X/Twitter
  #1 @trq212: Excited to talk to you tomorrow...  🔥355
  #2 @petergyang: I don't know measuring...       🔥91

Hacker News
  #1 Show HN: Open-source Claude Code alternative  ▲312
  #2 Why MCP is the future of tool integration      ▲187

Reddit
  #1 r/LocalLLaMA: New 7B model beats GPT-4...     ▲2.1k
```

v1（Phase 3 回测后）：百分位排名法归一化，合并展示。

---

## 6. 感知源状态栏

### 6.1 面向用户的公开展示

看板底部，展示感知网络的健康度。**透明化数据来源是品牌差异化**。

```
感知网络: 16 RSS ✅ · 5 Newsletter ✅ · X 40人 ✅ · HF ✅ S2 ⚠️ · HN ✅ Reddit ✅
今日采集 312 条 → 精选 42 条 · 最后更新 3 小时前
```

### 6.2 面向编辑的详细视图 (`/admin/sources`)

| 源 | 类型 | 频率 | 状态 | 本周期产出 | 最后成功 |
|------|------|------|------|----------|---------|
| Anthropic RSS | 文章 | 日频 | ✅ | 3 | 2h ago |
| a16z News | 文章 | 日频 | 🔴 | 0 | 7d ago |
| @karpathy | 社区 | 日频 | ✅ | 2 | 6h ago |
| Skills sync | 工具 | 周频 | ✅ | 12 | 3d ago |

### 6.3 实现方式

> ⚠️ v3 修正（Codex #8）：不在 `pipeline_runs.summary` JSONB 中塞分析数据。

**简单方案**：`/api/admin/source-health` API route，直接查询：
- `articles` 表按 source + 时间窗口聚合
- `community_signals` 表按 platform + signal_date 聚合
- `pipeline_runs` 表取最后运行时间

不建新表，不改现有 summary 结构。API route 实时查询 + 前端缓存。

---

## 7. 实现路线

> v3 修正（Codex #4）：审核控制前置到 Phase 1，在社区内容公开展示前必须有 admin 隐藏能力。

### Phase 0: 准备（2-3 天）✅ done 2026-04-08

- [x] TwitterAPI.io 注册，拿到 API Key → GitHub Secret `X_API_KEY`
- [x] `community_signals` 表 migration → `supabase/migrations/20260407_community_signals.sql`
- [x] 定义 KOL 列表 40 人 → `config/x-kol-list.json`
- [ ] ~~Reddit OAuth 应用注册~~ — Reddit 2025-11 取消自助 API 注册，需走审批流程，暂缓

### Phase 1: 新感知源 + 审核能力（5-8 天）✅ done 2026-04-08

**P1-a: X/Twitter 采集**
- [x] `scripts/lib/x-client.mjs` — API 抽象层（含 undici ProxyAgent 代理支持）
- [x] `scripts/scrape-x-signals.mjs` — 采集 → community_signals 表（含 402 early-exit）
- [x] LLM 中文摘要（采集时生成 content_summary_zh）
- [x] GitHub Actions CI 定时 → `.github/workflows/scrape-community-signals.yml`（UTC 00:00+12:00）

**P1-b: HN 采集**（Reddit 暂缓）
- [x] `scripts/scrape-hn-signals.mjs` — Top 500 + 词边界正则 3 级过滤 → community_signals
- [x] HN 30 条数据已入库验证（CI dry-run + 正式采集均通过）
- [ ] ~~Reddit 采集~~ — 暂缓，等 Reddit API 审批

**P1-c: 审核控制（前置）**
- [x] `community_signals.is_hidden` 字段（建表时已包含）
- [x] `/api/admin/community/[id]` — PATCH is_hidden
- [x] generate-daily.mjs 扩展：X/HN 信号加入 LLM prompt 上下文 + cross-referencing 规则更新

### Phase 2: `/trending` 页面（3-5 天）✅ done 2026-04-08

- [x] `src/app/trending/page.tsx` — 四赛道看板（117 行，数据+组件已拆分）
- [x] 论文赛道：HF Daily Papers API 实时查 + cross-ref 已翻译论文
- [x] 工具赛道：`getTrendingTools()` + monorepo 去重
- [x] 资讯赛道：articles 表 relevance_score + recency
- [x] 社区赛道：community_signals 按平台分组（X/HN/Reddit）
- [x] 感知源状态栏 → `src/components/trending/source-health-bar.tsx`
- [x] 导航栏"热度"入口
- [x] ISR 5min + `export const revalidate = 300`
- [x] 今日/本周切换
- [x] 两轮多 agent 评审（5+3 agents）修复 10 个发现

### Phase 3: 打磨（上线后持续）

- [ ] 2 周数据回测 → 论文赛道加入 HF upvotes 排序
- [ ] 社区赛道百分位归一化（合并展示）
- [ ] Podcast 接入
- [ ] 感知元独占率分析
- [ ] 社区投稿入口

---

## 8. 成本

| 项目 | 月费 | 说明 |
|------|------|------|
| TwitterAPI.io | ~$2 | 40 KOL × 3 条/天 |
| HN API | $0 | 免费 |
| Reddit API | $0 | 免费 OAuth |
| pod2txt (P3) | ~$5 | P3 才启用 |
| **合计** | **~$2/月** | Phase 1-2 |

---

## 9. 不做什么

| 不做 | 原因 |
|------|------|
| 跨品类统一排名 | 论文和推文不可比 |
| 加权热度公式（Phase 0-2） | ADR-005 教训 + 没有数据支撑 |
| `compute-trending.mjs` 脚本 | 页面直查 DB，不需要中间 JSON |
| 本地 JSON 文件存储 | CF Workers 无法访问 gitignored 文件 |
| 跨源 URL/标题对齐 | ADR-005 已废弃此模式 |
| "本月"时间维度 | 日频和周频足够，月度无额外价值 |
| 用户 UGC | 没有用户基础 |
| 中文社区源 | 等英文源跑通再考虑 |

---

## 10. 成功指标

| 指标 | 目标 | 衡量方式 |
|------|------|---------|
| 感知覆盖率 | Newsletter 热门话题覆盖率 17% → 60%+ | 抽样对比 |
| X 信号采纳率 | Daily Brief 引用 X/HN/Reddit 信号 ≥ 30% 天数 | 日报分析 |
| /trending UV | 上线 30 天日均 > 100 UV | Umami |
| 感知源存活率 | 所有源在其周期内存活率 > 90% | source-health API |

---

## 11. 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| TwitterAPI.io 被封/停服 | X 信号断供 | x-client.mjs 抽象层，可切换到官方 API / twikit |
| X 内容展示合规 | 法律灰区 | 只展摘要+链接；is_hidden 审核；标注来源 |
| HN 关键词假阳性 | 噪音多 | 正面+负面双列表，逐步调优 |
| 赛道数据量不均 | 某赛道空白 | 空白折叠，不凑数 |
| 热度排名不准 | 伤品牌 | v0 单变量，v1 回测后上线 |
| 时区错误 | 窗口偏移 | 统一 CST，signal_date 用 CST |
| Reddit OAuth 审批延迟 | P1-b 延期 | Phase 0 提前申请；HN 先行 |
| CF Worker CPU 超限 | 页面 1102 | 复用已有 ISR + 列裁剪模式 |

---

## 12. 评审记录

### 4-Agent 评审（2026-04-07）

| 视角 | 分 | 核心反馈 |
|------|-----|---------|
| CEO/主编 | 6.5 | Brief 与 Trending 关系未厘清 → v2 已修 |
| 工程架构 | 6.5 | 跨平台归一化未定义 → v3 改为分组展示 |
| 魔鬼代言人 | — | "用工程解决编辑问题" → v3 去掉加权公式 |
| 用户研究 | 6.0 | 感知源栏对普通用户无用 → 保留（产品决策） |

### Codex Independent Review（2026-04-07, 114K tokens）

| # | 发现 | 级别 | v3 修复 |
|---|------|------|--------|
| 1 | JSON 在 CF Workers 不可访问 | Critical | ✅ 全部改为 DB-backed |
| 2 | 与 ADR-005 冲突 | Critical | ✅ 去掉热度公式，对齐 LLM-first |
| 3 | 健康模型对周频源不适用 | Critical | ✅ 改为 expected_interval × 2 |
| 4 | 先上线再审核，排期倒置 | Critical | ✅ 审核控制前置到 Phase 1 |
| 5 | "实时"描述不实 | Critical | ✅ 去掉"实时"用词 |
| 6 | 本周/本月无实现路径 | Major | ✅ 去掉"本月"，本周复用 7d 查询 |
| 7 | 多源要求压制早期信号价值 | Major | ✅ 资讯赛道不要求多源 |
| 8 | pipeline_runs 不适合做分析 | Major | ✅ 改为 API route 实时查询 |
| 9 | 通过率跨源不可比 | Major | ✅ 通过率仅适用于 articles |
| 10 | 工具赛道重复建设 | Major | ✅ 直接复用 getTrendingTools() |
| 11 | 对现有管线理解有误 | Major | ✅ 改为扩展 LLM prompt 上下文 |

### 产品走查（2026-04-07，真实数据验证）

用当天真实数据模拟用户体验，发现 3 个数据质量问题：

| # | 发现 | 级别 | v3.1 修复 |
|---|------|------|----------|
| 1 | 工具赛道前 10 名全是 monorepo 假数据 | 🔴 致命 | ✅ 按 github_url 去重，排除已知 monorepo |
| 2 | 论文赛道显示 3-5 天前的入库论文，HF 144👍 爆款不在列表 | 🟠 严重 | ✅ 改为实时查 HF API + 标注已翻译 |
| 3 | HN 关键词假阳性（"AI singer on iTunes"混入） | 🟡 中等 | ✅ 加二级开发者上下文过滤 |

走查结论：资讯赛道数据质量最好（标题有信息量、来源清晰、主题聚焦）。社区赛道 HN 数据验证了独占价值（Claude Code 可用性争议 1,217 分，其他赛道未覆盖）。
