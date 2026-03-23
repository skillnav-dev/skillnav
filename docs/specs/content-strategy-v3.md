# SkillNav 内容战略 3.0 — 编辑品牌 + 渐进披露
Status: active
Date: 2026-03-21
Supersedes: content-strategy-v2.md (保留，V3 是其演进)

> 上游依赖: content-strategy-v2.md, content-signals-spec.md, content-operations-spec.md
>
> V2 确立了"翻译站 → 编辑品牌"方向，V3 解决三个 V2 未覆盖的问题：
> 1. 信息碎片化导致读者疲劳（渐进披露）
> 2. 所有信号平等对待，无编辑判断（编辑漏斗）
> 3. 分发依赖网站和社交媒体手动搬运（Skill 分发）

---

## 1. 核心问题

### 1.1 信息碎片化 → 读者疲劳

实测 Follow Builders daily digest（2026-03-21）：
- 8 条 X 动态 + 1 条播客摘要，平铺罗列
- 每条信息权重相等，读者需自行判断"哪条值得看"
- 预期：初期新鲜，2-3 周后打开率下降

我们的 Daily Brief 有同样隐患：LLM 生成的摘要列表，缺少主次和叙事。

### 1.2 竞品验证

| 产品 | 模式 | 优点 | 致命伤 |
|------|------|------|--------|
| Follow Builders | Skill → 飞书/Telegram 推送 | 248 stars/7天，分发精准 | 链接清单，无编辑判断 |
| TLDR AI | Newsletter | 50万+订阅 | 英文，无中文，无工具关联 |
| 宝玉 / 归藏 | 个人品牌 + 公众号 | 人格化，有态度 | 手动产出，不可规模化 |

**SkillNav 的差异化**：结构化工具数据（3,900+ MCP, 168 Skills）+ 编辑判断 + 自动化管线 + 多表面分发。

---

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| **渐进披露** | 信息分层呈现：标题(1秒) → 摘要(30秒) → 完整(3分钟) → 深度(按需) |
| **克制即品牌** | 大部分信号不推送。"SkillNav 推了 = 值得看" 是品牌承诺 |
| **编辑判断不可自动化** | AI 做初筛和格式化，人做"值不值得推"的最终判断 |
| **内容跟着用户走** | 不等用户来网站，把内容送进工作流（Skill / 推送 / 社交媒体） |
| **原创 > 翻译** | 翻译是素材库，原创是品牌载体 |

---

## 3. 采集层：宽漏斗

### 3.1 现有源（保持）

| 类型 | 源 | 数量 | 采集方式 |
|------|-----|------|---------|
| RSS | Anthropic, OpenAI, LangChain, HuggingFace, a16z 等 | 15 源 | `sync-articles.mjs` |
| Newsletter 信号 | TLDR AI, Ben's Bites, Rundown, Superhuman, Neuron | 5 源 | `scrape-signals.mjs` |

### 3.2 新增源（V3 扩展）

| 类型 | 源 | 数量 | 采集方式 | 价值 |
|------|-----|------|---------|------|
| Builder X 动态 | Follow Builders 精选 builder list | 25 人 | 读取 Follow Builders JSON 或自建抓取 | 一手信息，比 newsletter 早 12-24h |
| AI 播客 | Latent Space, No Priors, Training Data 等 | 5 源 | YouTube transcript → LLM 摘要 | 深度观点，独家信息 |

### 3.3 采集目标

```
每天原始信号：50-100 条
经过编辑漏斗后推送：3-7 条
比率：~5-10% 通过率
```

---

## 4. 处理层：编辑漏斗（V3 核心新增）

### 4.1 三级过滤

```
原始信号 (50-100/天)
    │
    ▼ AI 初筛（自动）
┌─────────────────────────────────┐
│ 热度评分 + 相关度评分 + 去重     │
│ 输入：heat_score, source_count, │
│       skill/mcp 关联度          │
└─────────────────────────────────┘
    │
    ▼ 分级（自动 + 人工校准）
┌───────────┬──────────────┬──────────────┐
│  头条      │  值得关注     │  信号存档     │
│  0-1条/天  │  3-5条/天    │  10-30条/天   │
├───────────┼──────────────┼──────────────┤
│ 3+源提及   │ 2源提及      │ 1源提及       │
│ OR 行业    │ OR 直接关联   │ 仅存入信号库  │
│ 格局变化   │ Skills/MCP   │ 不推送        │
├───────────┼──────────────┼──────────────┤
│ 编辑写     │ LLM 摘要 +   │ 仅索引        │
│ "为什么    │ 一句编辑     │ 周末可能升级  │
│  重要"     │ 点评         │               │
└───────────┴──────────────┴──────────────┘
```

### 4.2 自动评分（MVP：简单规则）

当前信号量 50-100 条/天，人工 5 分钟可分完，不需要复杂加权模型。

**MVP 规则**：
- **3+ 源提及** → 头条候选（人工确认）
- **2 源提及 OR 直接关联 Skills/MCP** → 值得关注（LLM 摘要 + 人工点评）
- **1 源提及** → 存档（不推送）

**人工 tag**：编辑可手动升降级任何条目（覆盖规则判断）。

> 未来信号量超过 200 条/天时，再引入多维加权评分（热度/相关度/新鲜度/影响力）。

### 4.3 编辑点评模板

头条：
```
[标题]
[2-3 句摘要]
**为什么重要**：[1-2 句编辑判断，连接到更大图景]
**对开发者的影响**：[具体、可操作的洞察]
```

值得关注：
```
[标题]：[1 句摘要] — [编辑点评 10 字以内]
```

### 4.4 内容质量自动化

#### 工具层（Skills / MCP）

| 检查项 | 频率 | 自动化方式 |
|--------|------|-----------|
| GitHub repo 存活 | 每周 | API 检查 404 / archived |
| 最近 commit | 每周 | GitHub API pushed_at |
| Stars 趋势 | 每周 | 对比上周 delta |
| 过期标记 | 每周 | 6 个月无更新 → stale |
| 质量评分刷新 | 每月 | 基于 stars/forks/issues 重算 |

#### 文章层（三层质量体系）

已实现，详见 `docs/adr/004-content-quality-system.md`：
- **L0**：源配置关键词白名单（拦截 74% 低质量文章）
- **L1**：content_zh < 200 字 → draft（捕获翻译失败）
- **L2**：LLM 双维度评分 audience_fit + credibility（≥7 publish，<4 hidden，其余 draft 人工审）

实现：`scripts/lib/quality.mjs`，在 `sync-articles.mjs` 入库时实时评分。

---

## 5. 展示层：渐进披露（V3 核心新增）

### 5.1 四层信息架构

```
Layer 1: 推送标题（Skill / 社交媒体 / 飞书）
  "今天最重要的一件事：Next.js 16.2 定位为 agent-native framework"
  到达成本：0（主动推送）| 消费时间：1 秒
    │
    ▼
Layer 2: 精选摘要（Daily Brief 推送体）
  头条 + 3-5 条值得关注 + 编辑点评
  到达成本：点开推送 | 消费时间：30 秒
    │
    ▼
Layer 3: 完整日报（skillnav.dev/daily/YYYY-MM-DD）
  完整简报 + 工具关联 + 信号雷达 + 原文链接
  到达成本：点击链接 | 消费时间：3 分钟
    │
    ▼
Layer 4: 深度内容（按需，不是每天都有）
  原创分析 / 工具评测 / 交互式指南 / 周刊
  到达成本：主动探索 | 消费时间：10-30 分钟
```

### 5.2 Daily Brief 格式重设计

**旧格式**（V2，平铺列表）：
```
📊 AI Daily Brief | 2026-03-21
1. Dreamer：个人智能体操作系统
2. OpenAI 收购 Astral
3. ...
```

**新格式**（V3，渐进披露）：
```
📌 今日头条
Next.js 16.2 宣布定位 agent-native framework，内置 AGENTS.md 规范和工具链调试。
这意味着主流 Web 框架正式把 AI Agent 视为一等公民——不再是插件，而是架构核心。

📋 值得关注
• Karpathy 开放 Q&A，持续讨论 AI agent 架构 — 值得围观
• Aaron Levie：旧 AI 架构该重置不是修补 — 和我们观察一致
• Proof 爆发增长后用 Codex agents 调试 — 又一个 AI 自举案例

🔗 详见 skillnav.dev/daily/2026-03-21
```

### 5.3 多表面适配

| 表面 | Layer | 格式 | 特点 |
|------|-------|------|------|
| SkillNav Skill | L1+L2 | 纯文本，可交互查询 | "今天有什么新闻" → 推送 L2 |
| 微信 | L2 | 卡片图 + 文字 | 早 8 点通勤高峰 |
| X | L1 | 1 条 tweet + thread | 精炼到极致 |
| 小红书 | L2 | 卡片图（1080x1350） | 视觉优先 |
| 知乎 | L2+L3 | 完整文章 | 深度读者 |
| RSS | L3 | 完整 XML | 订阅用户 |
| 网站 | L3+L4 | 完整 + 深度链接 | 沉淀地 |

---

## 6. 分发层：Skill 作为新渠道（V3 核心新增）

### 6.1 SkillNav Skill MVP

```
用户在 Claude Code / OpenClaw 中：
> "今天 AI 圈有什么新闻"     → Layer 2 Daily Brief
> "推荐一个数据库 MCP"       → 从 3,900+ 中智能推荐
> "这周热门 Skill"           → 趋势 + 评分
> "Cursor vs Claude Code"   → 链接到交互式对比指南
```

架构：**Centrally Fetch, Locally Remix**
- 我们的管线每天生成结构化 JSON（信号 + brief + 推荐）
- Skill 读取 JSON，按用户偏好格式化输出
- 用户无需 API Key，零配置

### 6.2 分发矩阵（升级 V2 §六）

| 渠道 | 类型 | 自动化 | 内容层级 | 目标用户 |
|------|------|--------|---------|---------|
| SkillNav Skill | 工作流内 | 全自动 | L1+L2+查询 | Claude Code 用户 |
| 微信/掘金 | 社交媒体 | 半自动（生成→手动发） | L2 | 中文开发者 |
| X | 社交媒体 | 半自动 | L1 | 国际开发者 |
| 小红书 | 社交媒体 | 半自动 | L2（卡片图） | 泛 AI 兴趣 |
| RSS | 订阅 | 全自动 | L3 | 深度用户 |
| 网站 | 沉淀 | 全自动 | L3+L4 | SEO + 回访 |

---

## 7. 内容矩阵（升级 V2 §二）

| 层级 | 产品 | 频率 | 生产方式 | Layer | 角色 |
|------|------|------|---------|-------|------|
| 推送 | Daily Brief | 每天 | AI 初筛 + 编辑审核 | L1+L2 | **日活触点** |
| 周更 | SkillNav Weekly | 每周一 | AI 辅助 + 主编策展 | L3+L4 | **品牌载体** |
| 原创 | 实战复盘/工具评测 | 1-2篇/周 | 原创 | L4 | **信任建立** |
| 素材 | RSS 翻译 | 每天自动 | 管线全自动 | L3 | **素材库+SEO** |
| 存档 | 信号库 | 每天自动 | 全自动 | 不推送 | **数据资产** |

**底线承诺**：Daily Brief 每日推送，Weekly 每周出刊。原创是 bonus。

---

## 8. 实施计划

### Phase 1: 编辑漏斗（1 周）

| 任务 | 文件 | 说明 |
|------|------|------|
| 信号评分逻辑 | `scripts/generate-daily.mjs` | 新增三级分类（头条/关注/存档） |
| Brief 格式重设计 | `scripts/generate-daily.mjs` | 从平铺列表 → 头条+精选格式 |
| 工具存活检查 | `scripts/audit-quality.mjs` | GitHub 状态、stars 趋势、过期标记 |

> 信号源扩展（Builder X + 播客）单独排期，见独立任务。技术方案：TwitterAPI.io（$3/月）+ YouTube transcript。

### Phase 2: Skill 分发（1-2 周）

| 任务 | 文件 | 说明 |
|------|------|------|
| 数据 API 端点 | `src/app/api/skill/` | Daily brief + MCP 推荐 + 趋势 JSON |
| SkillNav Skill | `skills/skillnav/` | 读取 API，格式化输出 |
| Onboarding 流程 | Skill 内 | 语言/频率/偏好配置 |

### Phase 3: 内容质量 + 渐进披露（持续）

| 任务 | 文件 | 说明 |
|------|------|------|
| 网站 Daily 页面 | `src/app/daily/` | L3 完整日报页面 |
| 工具质量自动化 | `scripts/audit-quality.mjs` | CI 每周跑，低分自动降级 |
| 翻译质量实时打分 | `scripts/sync-articles.mjs` | 入库时 LLM 打分 |

---

## 9. 成功指标

| 指标 | 当前 | 1 个月 | 3 个月 |
|------|------|--------|--------|
| Daily Brief 推送渠道 | 1（网站） | 4+（Skill, 微信, X, 小红书） |  |
| Skill 安装量 | 0 | 依赖 Skill MVP 上线 | 500+ |
| Daily Brief 打开率 | N/A | > 40% | > 30%（衰减可控） |
| 原创文章 | 1 | 6+ | 20+ |
| 信号通过率 | 100%（全推） | < 15% | < 10% |

**核心健康指标**：打开率 > 30% 持续 4 周以上 = 内容不碎片化。

---

## 10. 与现有规范的关系

| 规范 | 关系 |
|------|------|
| content-strategy-v2.md | V3 是其演进。V2 的内容矩阵、数据模型、周刊工作流保留不变 |
| content-signals-spec.md | V3 §4 扩展了信号层的评分维度和三级过滤 |
| content-operations-spec.md | V3 §5-6 扩展了分发渠道，SOP 时间线需相应更新 |
| content-pipeline-spec.md | 采集管线不变，V3 在其输出端增加编辑漏斗 |

---

## 附录 A: Follow Builders 竞品详细分析

见 `docs/research/2026-03-21-follow-builders-analysis.md`

## 附录 B: Skill 分发策略研究

见 `docs/research/2026-03-21-skill-distribution-strategy.md`
