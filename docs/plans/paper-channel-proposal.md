# SkillNav 论文频道方案书

> 状态：待拍板
> 日期：2026-03-25
> 调研基础：6 agent 并行调研（竞品格局 / 战略契合 / 编辑设计 / 分发策略 / Skill 分发层 / 目标群体深度分析）

---

## 一句话定位

**用编辑判断力把 AI 前沿论文翻译成开发者能消费的洞察，让 SkillNav 从"工具导航"升级为"工具导航 + 技术前哨"。**

---

## 1. 为什么做

### 1.1 市场窗口

- **Papers With Code 于 2025.7 被 Meta 关停**，论文-代码-基准关联在中文生态几乎空白
- 中文 AI 媒体（机器之心/量子位/新智元）做的是"科技媒体"，不是"结构化数据 + 编辑策展"
- 没有任何中文产品做"论文 → 开发者实践启示"的系统性桥接
- arXiv 月投稿 2.8 万篇，每天 200-400 篇 AI/ML 论文，信息过载是真实痛点
- 中国 AI 论文产出全球第一（35.91%），但中文开发者阅读英文论文效率低下

### 1.2 战略价值

| 维度 | 没有论文频道 | 有论文频道 |
|------|------------|-----------|
| 品牌定位 | 工具黄页（可被 Skill4Agent 复制） | 工具导航 + 技术前哨（不可复制） |
| 内容深度 | L1-L3（资讯级） | 补齐 L4（深度级） |
| 用户覆盖 | 主要覆盖效率猎手 | 拉入趋势跟踪者 + 技术决策者 |
| 飞轮强度 | 资讯引流 → 工具留存 | 论文建立权威 → 用户信任工具推荐 |
| 变现空间 | 工具赞助 | + 趋势报告 + 企业咨询 |

**核心逻辑**：论文不是目的，论文是建立"SkillNav 懂技术"这个品牌认知的手段。当用户相信你理解底层技术趋势时，你的工具推荐就更有说服力。

### 1.3 竞品定位空白

| 维度 | 机器之心 | 量子位 | HF Papers | ChatPaper | **SkillNav** |
|------|---------|--------|-----------|-----------|------------|
| 形态 | 长文报道 | 通俗长文 | 标题+投票 | AI 摘要 | **结构化导读卡** |
| 受众 | 研究者+产业 | 大众 | ML 社区 | 学生 | **开发者+技术管理者** |
| 深度 | 深但长 | 通俗但浅 | 无解读 | 质量不稳 | **中等，聚焦可操作性** |
| 开发者桥接 | 弱 | 弱 | 模型/demo | 无 | **工具关联+实践指导** |
| 趋势判断 | 有（媒体视角） | 无 | 无 | 无 | **有（技术方向视角）** |
| 数据结构 | 非结构化 | 非结构化 | 半结构化 | 非结构化 | **全结构化（可查询）** |

**SkillNav 的卡位**：比量子位深、比机器之心落地、比 HF Papers 有编辑判断、比 ChatPaper 有质量保证。核心差异是**"论文 → 工具实践"的桥接**，这是没有人做的。

---

## 2. 给谁看——目标群体深度分析

### 2.1 中国 AI 论文消费者五层金字塔

基于 CSDN 开发者报告、arXiv 统计、各平台用户数据交叉验证：

```
                    /\
                   /  \  核心研究者 ~5-8万
                  /    \  (高校/大厂AI Lab，每周读3-10篇)
                 /______\  → 不是我们的用户，他们是论文生产者
                /        \
               / 算法工程师 \  ~20-30万
              /  (每月2-5篇) \  → 次要受众，已有工具链(Kimi/沉浸式翻译)
             /______________\
            /                \
           / 高级/资深工程师    \  ~50-80万
          / (偶尔读，靠二手解读) \  → 核心受众！有需求但缺好产品
         /____________________\
        /                      \
       / 技术管理者/架构师/CTO    \  ~15-25万
      / (不读原文，要趋势判断)     \  → 高价值受众，付费意愿最强
     /__________________________\
    /                            \
   / "论文好奇者"                   \  ~200-400万
  / (想了解但从未读过完整论文)        \  → 最大增量市场，免费引流
 /________________________________\
```

**关键洞察**：940万中国开发者中，AI 相关约 100万。但真正定期读论文的只有 ~1%（5-10万人），而"需要论文信息做决策"的有 ~20%（65-105万人）。**目标受众不是"读论文的人"，而是"需要论文结论来做技术决策的人"。**

### 2.2 三类核心受众详解

#### 受众 A：高级/资深工程师（核心受众，~50-80万人）

- **典型画像**：3-8年经验，想往架构师/技术管理发展
- **论文消费现状**：微信公众号（机器之心/量子位） → 知乎深度帖 → B站视频（李沐论文精读 65万粉，单视频 60万播放）
- **核心痛点**："投入产出比不确定"——不知道这篇论文对工作有没有用
- **他们需要的**：帮我判断"这篇值不值得花时间读原文"
- **SkillNav 对他的价值**：导读卡片的"开发者视角"板块——能用吗、怎么用、意味着什么
- **触达方式**：日报论文速览（每日） + 网站导读卡（按需深入）

#### 受众 B：技术管理者/架构师/CTO（高价值受众，~15-25万人）

- **典型画像**：技术总监、VP Engineering，做技术选型和团队方向决策
- **论文消费现状**：不读原文，依赖 Gartner 报告（73% 财富 500 强使用）、Thoughtworks 技术雷达、团队内部汇报
- **决策场景**：

| 场景 | 论文信息的作用 | 时间压力 |
|------|--------------|---------|
| 技术选型（RAG vs Fine-tuning） | 最新 benchmark 对比 | 1-2周 |
| 团队招聘方向 | 技术趋势判断 | 持续 |
| 架构演进（要不要上 MoE/开源） | 论文级技术深度 | 季度规划 |
| 向上汇报 | 有说服力的技术依据 | 周/月 |

- **内容消费旅程**：早通勤刷公众号标题（15分钟） → 午休知乎深度帖（15分钟） → 晚间极客时间/播客（30分钟，非每天）
- **核心需求**：不是"帮我读论文"，而是**"帮我做决策"**。格式要求：1分钟看完摘要 + 5分钟能讲给别人听
- **付费意愿**：智联招聘调研显示 24.1% 高管愿意为单个 AI 工具月付 200元+，付费决策周期仅 7 天
- **SkillNav 对他的价值**：导读卡片的"趋势信号"板块 + 未来的月度趋势报告
- **触达方式**：日报速览（每日） + Skill 查询（按需） + 微信公众号精选（每周）

#### 受众 C："论文好奇者"（增量市场，~200-400万人）

- **典型画像**：对 AI 论文有兴趣但从未读过完整论文，朋友圈刷到会看
- **消费特征**：视频 > 图文 > 原文；需要"一句话说清这篇论文做了什么"
- **SkillNav 对他的价值**：日报论文速览 + 小红书论文亮点卡（视觉化）
- **触达方式**：小红书卡片引流 → 网站导读卡

### 2.3 关于投资者受众的决策

调研结论：**短期不单独服务投资者。**

- VC 视角的论文解读需要投资经验，1-2 人团队伪造不了（a16z/Sequoia 是投资叙事，不是论文摘要）
- 中文市场已有机器之心 PRO 占位
- 投资者内容的错误代价极高（误导投资决策）

但：受众 B（技术管理者/CTO）和投资者的需求有重叠——都关心"技术方向判断"。**导读中的"趋势信号"板块天然服务这两类人，不需要伪装成 VC。**

### 2.4 受众规模验证

| 代理指标 | 数据 | 来源 |
|---------|------|------|
| 沉浸式翻译用户 | 1000-2000万全球用户，核心用例之一是翻译英文论文 | Chrome Web Store |
| Kimi | 峰值 3600万 MAU → 2025Q4 降至 ~900万 MAU，论文阅读是重要用例 | 每日经济新闻 |
| 李沐论文精读 | 65万 B站粉丝，单视频 60万+播放 | 雷峰网 |
| 量子位公众号 | 80万+订阅（2019年） | 量子位 |
| ReadPaper | 覆盖 2亿篇论文 | 知乎 |
| 56.1% 职场人 | 愿意为 AI 服务付费 | 智联招聘 2025 |

---

## 3. 做什么、不做什么

### 3.1 做（MVP 范围）

| 做什么 | 产出 | 服务受众 |
|--------|------|---------|
| 每日宽采集 | arXiv + HF Daily Papers → 50-100 篇/天入库 | 数据资产 |
| 日报论文板块 | 5-10 篇标题 + 一句话，嵌入现有日报 | A+B（每日触点） |
| 人工筛选 + 导读生产 | 标记的论文 → LLM 生成结构化导读 → 网站页面 | A+B（深度消费） |
| 独立论文列表页 `/papers` | 按领域/时间筛选 | 所有受众（沉淀+SEO） |
| 论文详情页 `/papers/[slug]` | 导读卡片 | A+B（核心产品） |
| Skill 子命令 `/skillnav papers` | 论文搜索，结构化返回 | A（工作流内消费） |

### 3.2 不做

| 不做什么 | 原因 |
|----------|------|
| 投资者专属解读 | 需要 VC 经验，小团队做不了 |
| 论文全文翻译 | 太长、无意义，摘要+导读足够 |
| PDF 下载/存储 | arXiv 链接即可 |
| Benchmark 排行榜 | PwC 用整个团队维护都关停了 |
| 独立论文 Newsletter | 不另起产品线，嵌入现有日报 |
| Twitter KOL 监控 | API 不稳定，HF Daily Papers 已覆盖热点 |
| 三受众 Tab 切换 | 过度工程化，MVP 用统一导读格式 |

---

## 4. 论文导读设计（核心产品）

### 4.1 设计原则

| 原则 | 说明 | 来源 |
|------|------|------|
| 编辑判断 > 信息搬运 | 不是翻译摘要，是回答"这篇论文跟你有什么关系" | The Batch / Import AI 模式 |
| 一篇导读解决一个问题 | 读完导读，用户能判断"要不要读原文" | Semantic Scholar TLDR 理念 |
| 连接论文与工具 | 每篇导读尽量关联 SkillNav 已收录的 Skill/MCP | SkillNav 飞轮 |
| 中文重写 > 中文翻译 | 用开发者听得懂的话重新表达，不是逐句翻译 | 量子位启发，但保持准确 |
| 帮用户做决策 | "能用吗/怎么用/意味着什么"比"方法论细节"重要 | 受众 B 的核心需求 |

### 4.2 导读卡片结构（三层渐进披露）

#### Layer 1：日报速览（30 秒）

出现在日报的 `## 论文速递` 板块：

```
- ReAct Meets World Models: 把世界模型引入 Agent 推理循环 — DeepMind/ICLR oral
- [更多论文...共 N 篇]
```

格式：**中文一句话概括 + 机构/会议标签**。不翻译标题，用一句话说清"这篇干了什么"。

#### Layer 2：论文详情页（3 分钟）

你筛选后触发 LLM 生成，入库并生成独立页面 `/papers/[slug]`：

```markdown
# [中文重写标题：用开发者语言概括核心贡献]

> [English Original Title]
> [第一作者] 等 N 人 · [机构] · [会议/日期]
> arXiv: [ID] · HF: [upvotes] · Code: [有/无 + 链接]

## 一句话

[20-30 字，回答"这篇论文解决了什么问题、结果如何"]

## 核心贡献

- [贡献 1：用"做到了 X"的句式，附关键数据]
- [贡献 2]
- [贡献 3（如有）]

## 方法要点

[1-2 段，只讲最关键的技术思路。不堆术语，不写公式。
 如果原文有架构图，用文字描述关键流程。]

## 开发者视角

[SkillNav 的独家板块——把论文连接到实践]

- **能用吗**：[代码是否开源？模型是否可下载？有无 demo？]
- **怎么用**：[适用场景、集成方式、已有工具关联]
- **意味着什么**：[对现有工具/框架/实践的影响]

## 趋势信号

[同时服务受众 A 和 B]

- **方向热度**：[这个研究方向最近的论文密度、大厂参与度]
- **相关论文**：[同方向 2-3 篇值得关注的论文，链接]
```

**字数目标**：400-600 字中文（不含元数据）。够用户判断"要不要读原文"。

#### Layer 3：原文（外链）

arXiv PDF + Abstract 页面链接。不自己存。

---

## 5. Skill 分发层集成

### 5.1 现有 Skill 架构

SkillNav Skill（M1 已完成）通过单一 API 端点提供三个子命令：

```
/skillnav brief              → 今日日报
/skillnav mcp <keyword>      → MCP Server 搜索
/skillnav trending            → 热门工具
```

架构模式：**Centrally fetch, locally remix** — API 返回结构化 JSON，Claude 在本地格式化呈现。

### 5.2 新增 papers 子命令

```
/skillnav papers <keyword>    → 论文搜索（新增）
```

#### API 扩展

在现有 `/api/skill/query` 端点新增 `type=papers` handler：

```
GET /api/skill/query?type=papers&q=RAG&limit=5
```

响应 schema（与 MCP 搜索保持一致风格）：

```json
{
  "type": "papers",
  "query": "RAG",
  "returned": 3,
  "has_more": true,
  "results": [
    {
      "title_zh": "自适应 RAG：让检索增强按需触发",
      "title": "Adaptive RAG: Learning to Retrieve On-Demand",
      "institution": "Google DeepMind",
      "venue": "ICLR 2026",
      "hf_upvotes": 128,
      "has_code": true,
      "editor_comment_zh": "首次实现 RAG 的按需触发，对现有 LangChain/LlamaIndex 管线有直接影响",
      "arxiv_url": "https://arxiv.org/abs/2601.xxxxx",
      "url": "https://skillnav.dev/papers/adaptive-rag"
    }
  ]
}
```

#### SKILL.md 格式规则

```
1. **自适应 RAG：让检索增强按需触发** 📄 Google DeepMind · ICLR 2026
   ⭐ HF 128 · 🔗 Code
   > 首次实现 RAG 的按需触发，对现有 LangChain/LlamaIndex 管线有直接影响
   📖 arXiv | 完整导读 → skillnav.dev/papers/adaptive-rag

2. ...
```

#### 编辑点评 (editor_comment_zh) 是关键

与 MCP 搜索一样，`editor_comment_zh` 作为一等字段（blockquote 呈现）。这是 SkillNav Skill 区别于直接 WebSearch 的核心——**编辑判断力**。

### 5.3 日报中论文板块的 Skill 呈现

现有 `/skillnav brief` 返回 headline + highlights。论文板块作为新的 section 出现：

```json
{
  "type": "brief",
  "date": "2026-03-25",
  "headline": { ... },
  "highlights": [ ... ],
  "papers": [
    {
      "title_zh": "把世界模型引入 Agent 推理循环",
      "institution": "DeepMind",
      "venue": "ICLR oral",
      "url": "https://skillnav.dev/papers/react-world-models"
    }
  ]
}
```

Skill 输出格式：

```
**TL;DR**: [headline]

[headline details...]

📋 值得关注
- [highlight 1]
- [highlight 2]

📄 论文速递
- 把世界模型引入 Agent 推理循环 — DeepMind/ICLR oral
- ...

完整日报 → skillnav.dev/daily/2026-03-25
```

### 5.4 Skill 与论文的飞轮

```
用户: /skillnav papers agent reasoning
    → 结构化论文搜索结果（含编辑点评 + 工具关联）
    → 用户点进导读页 → 看到关联的 Skill/MCP
    → /skillnav mcp agent-reasoning
    → 发现可用工具 → 安装使用
```

**论文 → 工具的闭环在 Skill 内完成**，不需要离开工作流。

---

## 6. 质量体系

### 6.1 三层质量门控

```
┌─ L0: 采集层（宽进）──────────────────────────────────┐
│ arXiv API + HF Daily Papers                         │
│ → 去重（source_url_normalized）                      │
│ → 基础相关性（AI/ML/Agent 相关类目）                  │
│ → 入库 status='inbox'                                │
│ → 50-100 篇/天                                       │
└──────────────────────────────────────────────────────┘
          │
          ▼
┌─ L1: 日报层（LLM 初筛 + 编辑审）────────────────────┐
│ LLM 评分：热度 + 新颖性 + 工具生态关联度              │
│ → Top 5-10 写入日报草稿"论文速递"                    │
│ → 你在 admin UI 审日报时调整/删减/标记做导读          │
│ 质量标准：错过好论文 < 推垃圾论文                     │
└──────────────────────────────────────────────────────┘
          │ (标记的论文)
          ▼
┌─ L2: 导读层（LLM 生成 + 人工必审）──────────────────┐
│ LLM 按模板生成结构化导读                              │
│ → 自动检查：一句话<30字 / 贡献>=2条 / 400-600字       │
│ → status='draft' 进入 admin UI                       │
│ → 你审核：重点审"开发者视角"+"趋势信号"              │
│ → 补充工具关联（Skill/MCP）→ publish                 │
│ 质量红线：不瞎编 / 视角具体可操作 / 工具关联真实      │
└──────────────────────────────────────────────────────┘
```

### 6.2 质量信号元数据

每篇论文入库时自动采集，辅助 L1 筛选：

| 信号 | 来源 | 成本 | 用途 |
|------|------|------|------|
| HF upvotes | HF Daily Papers API | 零 | 社区热度 |
| 机构归属 | arXiv 作者字段 | 零 | 大厂论文优先 |
| 代码开源 | arXiv/HF 关联 GitHub | 零 | 有代码的更适合做导读 |
| 发表场所 | arXiv categories + venue | 零 | 顶会论文优先 |
| Semantic Scholar TLDR | S2 API（免费，覆盖 6000万篇） | 零 | 辅助 LLM 生成 |
| 引用数 + 影响力引用 | S2 API（免费） | 零 | 延迟信号，趋势检测 |

### 6.3 质量信号分级

| 信号层 | 内容 | 延迟 | 用途 |
|--------|------|------|------|
| L0 元数据 | venue/机构/代码开源 | 即时 | 入库时自动标注 |
| L1 社区 | HF upvotes / GitHub stars | 即时~24h | 日报筛选依据 |
| L2 引文 | citation velocity / influential citations | 3-6个月 | 趋势检测（远期） |

---

## 7. 工作流全景

```
每天 09:00 (CI 自动)
    │
    ▼  scrape-papers.mjs (新脚本)
       - arXiv API: cs.AI/cs.CL/cs.LG/cs.MA 等类目
       - HF Daily Papers API: 按 upvotes 排序
       - Semantic Scholar API: 补充 TLDR + citation
       - 去重 → 入库 articles 表 (source='arxiv'/'hf-papers', status='inbox')
    │
    ▼  generate-daily.mjs (已有，扩展)
       - 从 inbox 论文中 LLM 选 5-10 篇
       - 写入日报 content_md 的"📄 论文速递"板块
       - 日报整体 status='draft'
    │
    ▼  你在 admin UI 审日报 (每天 5 分钟)
       - 审核/调整论文速递
       - 标记值得做导读的论文（按钮）
       - 审批日报
    │
    ▼  generate-paper-cards.mjs (新脚本，标记触发)
       - 读取被标记的论文
       - 调用 LLM 生成结构化导读（含 Semantic Scholar TLDR 作为参考输入）
       - 入库 articles 表 (status='draft', content_tier='editorial')
    │
    ▼  你审核导读 (每篇 3-5 分钟)
       - 重点审"开发者视角"和"趋势信号"
       - 补充工具关联 (Skill/MCP)
       - publish → 上线 /papers/[slug]
    │
    ▼  publish-daily.mjs (已有)
       - 日报通过所有现有渠道分发（含论文板块）
       - Skill API 自动包含论文数据
```

**你的日常投入**：审日报 5 分钟 + 审 2-3 篇导读 10-15 分钟 = 约 20 分钟。

---

## 8. 分发策略

论文内容嵌入现有分发矩阵，不另起渠道：

| 渠道 | 论文内容形态 | 层级 | 受众 |
|------|-------------|------|------|
| **Skill** `/skillnav papers` | 结构化搜索 + 编辑点评 | L1-L2 | 受众 A（工作流内消费） |
| **Skill** `/skillnav brief` | 日报内嵌论文速递 | L1 | 所有 Skill 用户 |
| **日报 RSS** | 论文速递板块 | L1 | 订阅者 |
| **网站** `/papers` | 完整导读卡片 | L3 | 受众 A+B（深度消费+SEO） |
| **微信公众号** | 每周 1-2 篇精选导读 | L3 | 受众 B（品牌权威） |
| **小红书** | 论文亮点卡（1080x1350） | L2 | 受众 C（视觉化引流） |
| **知乎** | 热门 AI 问题下做论文关联回答 | L3 | 长尾 SEO |
| **X** | 论文一句话 + 链接 | L1 | 技术社区曝光 |

**Skill 是论文内容最重要的分发入口**——开发者在 IDE 里问 `/skillnav papers agent memory`，直接拿到结构化结果 + 编辑点评 + 工具关联，不用离开工作流。这是机器之心/量子位做不到的。

---

## 9. 数据层设计

### 9.1 复用 articles 表

不建新表。论文作为 article 的一种子类型入库：

| 字段 | 论文场景 | 说明 |
|------|---------|------|
| source | `arxiv` / `hf-papers` | 区分来源 |
| article_type | `paper` | **新增枚举值** |
| content_tier | `translated`（速览）/ `editorial`（有导读） | 复用现有分层 |
| status | `inbox` → `draft` → `published` | **新增 inbox 状态** |
| title | 英文原标题 | |
| title_zh | 中文重写标题（概括，非直译） | |
| summary | 英文 abstract | |
| summary_zh | 中文一句话概括（日报速览用） | |
| content_zh | 结构化导读 Markdown（按 4.2 模板） | |
| source_url | `https://arxiv.org/abs/XXXX.XXXXX` | |
| relevance_score | LLM 打分 | |

### 9.2 论文专用元数据（JSONB）

在 articles 表增加 `paper_meta` JSONB 字段：

```json
{
  "arxiv_id": "2601.12538",
  "authors": ["Tianxin Wei", "..."],
  "author_count": 29,
  "institution": "Google DeepMind",
  "venue": "ICLR 2026",
  "categories": ["cs.AI", "cs.LG"],
  "hf_upvotes": 128,
  "has_code": true,
  "code_url": "https://github.com/...",
  "s2_tldr": "This work introduces...",
  "citation_count": 0,
  "pdf_url": "https://arxiv.org/pdf/2601.12538"
}
```

### 9.3 Skill API 查询

`/api/skill/query?type=papers&q=keyword` 查询逻辑：
- PGroonga 全文搜索 `title`, `title_zh`, `summary_zh`（中文感知）
- ILIKE fallback（与 MCP 搜索一致）
- 排序：`relevance_score DESC, published_at DESC`
- 过滤：`article_type='paper'`, `status='published'`, `content_tier='editorial'`（只返回有导读的）

---

## 10. 变现路径

论文内容的变现不在论文本身，在于论文建立的**技术权威性**。

| 阶段 | 时间 | 变现方式 | 依赖条件 |
|------|------|---------|---------|
| 积累期 | M1-M3 | 不变现，积累内容+用户 | 50+ 篇导读上线 |
| 信任期 | M4-M6 | 日报赞助价提升（内容更丰富） | 日报订阅 5K+ |
| 产品期 | M7+ | 月度"AI 工具趋势报告"（论文信号→工具推荐） | 受众 B 付费验证 |

**关键假设**：论文导读免费 → 提升品牌溢价 → 付费产品是"论文意味着什么工具值得用/不值得用了"（决策支持，非信息搬运）。

---

## 11. 实施节奏

### Phase 1：管线打通（1 个会话）

- `scrape-papers.mjs`：arXiv API + HF Daily Papers API 采集
- DB：articles 表新增 `paper` type + `inbox` status + `paper_meta` JSONB
- `generate-daily.mjs`：扩展论文速递板块
- `parse-brief.ts`：支持解析 `## 📄 论文速递` section

**验收**：每天自动采集论文 → 出现在日报草稿 → Skill brief 包含论文。

### Phase 2：导读产品（1-2 个会话）

- `generate-paper-cards.mjs`：LLM 生成结构化导读
- admin UI：论文标记按钮 + 导读审核页
- `/papers` 列表页 + `/papers/[slug]` 详情页
- Skill API：新增 `type=papers` handler
- SKILL.md：新增 `papers <keyword>` 子命令

**验收**：标记论文 → 自动生成导读 → 审核发布 → 网站可见 → Skill 可搜索。

### Phase 3：分发扩展（按需）

- 小红书论文卡片模板
- 微信公众号周度论文精选
- Semantic Scholar API 深度接入
- 论文趋势检测（关键词频率 + HF 热度聚合）

---

## 12. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 论文内容分散焦点 | 40% | 中 | 论文始终从"工具视角"解读，不做纯学术内容 |
| 导读质量不稳定 | 30% | 高 | "开发者视角"和"趋势信号"人工必审 |
| 用户对论文无感 | 30% | 中 | Phase 1 只加日报板块（零额外成本），看数据再推 Phase 2 |
| arXiv API 限流 | 20% | 低 | HF Daily Papers 作备用；arXiv API 限制宽松 |
| 每天审导读太耗时 | 20% | 中 | 控制每天 2-3 篇，非每篇论文都做导读 |

---

## 13. 成功指标

| 指标 | Phase 1 | Phase 2 | 衡量 |
|------|---------|---------|------|
| 日采集量 | 30+/天 | 50+/天 | pipeline_runs |
| 日报论文板块点击率 | 有人点 | 10%+ | Umami |
| 导读页面访问 | - | 50+ PV/篇 | Umami |
| 导读生产量 | - | 10+/周 | DB 统计 |
| Skill papers 查询量 | - | 日均 10+ | API 日志 |
| /papers SEO | - | Google 收录 | GSC |

---

## 附录 A：调研来源

本方案基于 6 个 agent 并行调研：

1. **竞品格局**：Papers With Code（已关停）、HF Daily Papers、arxiv-sanity-lite、机器之心/量子位/新智元、a16z/Sequoia/ARK、Import AI/The Batch/TLDR AI/AlphaSignal/TheSequence、Semantic Scholar/Elicit/SciSpace/Paper Digest
2. **战略契合**：产品方案书、商业化路线图、内容战略 V3、编辑分层 ADR、内容运营规范
3. **编辑设计**：The Batch "Why it matters"、Lilian Weng 主题聚合、Distill 可视化、Semantic Scholar API（6000万篇 TLDR）、中文 AI 论文生态缺口分析
4. **分发策略**：多受众单管线模式、各平台格式特性、beehiiv 2025 付费数据、1-2人团队产出能力
5. **Skill 分发层**：SKILL.md 架构、API 端点 schema、parse-brief 解析逻辑、sub-command 路由机制
6. **目标群体**：CSDN 2024 开发者报告（940万开发者）、arXiv 论文产出统计（中国 35.91%）、沉浸式翻译/Kimi/ReadPaper 用户数据、智联招聘 AI 付费意愿调研、李沐论文精读 B站数据

## 附录 B：关键数据引用

| 数据点 | 来源 |
|--------|------|
| 中国软件开发者 940万+ | CSDN 2024 报告 |
| AI 开发者 ~100万 | CSDN 2025 AI 开发者占比 |
| AI 人才缺口 400-500万 | 第一财经 / 麦肯锡 |
| 中国 AI 论文全球占比 35.91% | arXiv 2509.25298 |
| 56.1% 职场人愿为 AI 付费 | 智联招聘 2025 |
| 24.1% 高管月付 200元+ | 智联招聘 2025 |
| 沉浸式翻译 1000-2000万用户 | Chrome Web Store |
| Papers With Code 2025.7 关停 | TIB Blog |
| Semantic Scholar TLDR 覆盖 6000万篇 | AI2 Blog |
| arXiv 月投稿 2.8万篇 | arXiv Statistics |
