# 内容信号层规范 (Content Signals Specification)
Status: active
Date: 2026-03-20

> 上游依赖: content-sources-audit.md (翻译管线源), content-pipeline-spec.md (采集标准)
>
> 本文档定义**信号层**：从外部编辑日报中提取热度信号，指导选题优先级。
> 信号层不替代翻译管线，而是为 Daily Brief 和编辑决策提供"今天什么最重要"的判断依据。

---

## 1. 设计目标

### 1.1 核心问题

现有 14 个 RSS 源覆盖**深度技术内容**，但缺乏对 AI 行业全局动态的感知。

实测数据（2026-03-19）：

| 指标 | 数值 |
|------|------|
| 当天五大日报热度 ≥3 的话题 | 6 条 |
| 我们 RSS 覆盖到的 | 1 条（GPT-5.4 Mini/Nano） |
| **漏掉率** | **83%** |

漏掉的典型内容：新模型发布（MiMo-V2-Pro、MiniMax M2.7）、大厂动态（Nvidia、Microsoft）、产品发布（Google Stitch、Runway 实时视频）、行业调研（Anthropic 81K 用户报告）。

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **信号 ≠ 内容** | 日报不进翻译管线，不生产文章。只提取"什么话题热"的信号 |
| **交叉验证** | 单源提到 = 普通；多源共识 = 高热度。避免被单一编辑偏好带偏 |
| **增强不替代** | 信号层增强 Daily Brief 选题，不改变 RSS 翻译管线的运作方式 |
| **零人工** | 全自动抓取和聚合，人只看最终热度榜 |

---

## 2. 感知源

### 2.1 为什么是日报而不是 RSS

这些日报背后各有专业编辑团队，每天从上千条信息中筛选 5-16 条。我们复用他们的筛选劳动，相当于免费获得了 5 个编辑团队的判断。

与翻译管线源的关系：`content-sources-audit.md` 曾评估这些日报并排除，理由是"作为翻译源信噪比不足"。该判断依然成立——我们不翻译日报内容，只提取热度信号。

### 2.2 源清单

| # | 源 | 订阅量 | 定位 | 日均条目 | 对信号层的价值 |
|---|-----|--------|------|---------|--------------|
| 1 | **TLDR AI** | 92万+ | 技术+行业全覆盖 | ~16 条 | 条目最多，分类清晰，覆盖面最广 |
| 2 | **The Rundown AI** | 200万+ | 3 分钟速览，商业+技术 | ~8 条 | 订阅量最大，反映主流关注点 |
| 3 | **Superhuman AI** | 150万+ | 产品+消费者向 | ~5 条 | 补充产品/设计视角 |
| 4 | **Ben's Bites** | 12万+ | 创业/Builder 视角 | ~6 条 | 开发者+创业者重叠人群，与我们定位最近 |
| 5 | **The Neuron** | 50万+ | Morning Brew 风格 | ~11 条 | 主次分明，含来源标注 |

### 2.3 抓取方式

#### TLDR AI

- **URL 模式**: `https://tldr.tech/ai/YYYY-MM-DD`
- **抓取方式**: HTTP GET → HTML 解析
- **内容结构**: 分节（Headlines & Launches / Deep Dives / Engineering & Research / Miscellaneous / Quick Links），每条含标题 + 原文 URL + 摘要
- **稳定性**: 高 — 日期直接拼 URL，结构化最好
- **验证日期**: 2026-03-19 ✅

#### The Rundown AI

- **列表 URL**: `https://www.therundown.ai/archive`
- **抓取方式**: curl + 浏览器 UA → 提取 `/p/{slug}` 链接 → 逐篇抓取外部 URL
- **内容结构**: 文章页包含外部原文链接，需从 URL 反推话题
- **注意事项**: 首页有 Cloudflare Challenge（403），必须带浏览器 User-Agent；无 RSS/feed 端点
- **稳定性**: 中 — 依赖 archive 页面结构 + 浏览器 UA 绕过
- **验证日期**: 2026-03-20 ✅

#### Superhuman AI

- **列表 URL**: `https://www.superhuman.ai/feed`
- **单篇 URL**: `https://www.superhuman.ai/p/{slug}`
- **抓取方式**: HTTP GET feed 页获取最新 slug → 抓单篇内容
- **内容结构**: 每条含标题 + 原文 URL + 摘要
- **稳定性**: 高 — feed 页面稳定可达
- **验证日期**: 2026-03-20 ✅

#### Ben's Bites

- **列表 URL**: `https://www.bensbites.com/archive`
- **单篇 URL**: `https://www.bensbites.com/p/{slug}`
- **抓取方式**: HTTP GET archive → 提取最新 slug → 抓单篇内容
- **内容结构**: 每条含标题 + 原文 URL + 摘要
- **稳定性**: 高 — Substack 风格 archive，结构清晰
- **验证日期**: 2026-03-20 ✅

#### The Neuron

- **列表 URL**: `https://www.theneurondaily.com/feed` 或 `/archive`
- **单篇 URL**: `https://www.theneurondaily.com/p/{slug}`
- **抓取方式**: HTTP GET feed/archive → 提取最新 slug → 抓单篇内容
- **内容结构**: 主次分明（Main Stories + Secondary Stories），每条含标题 + 来源 + 摘要
- **注意事项**: 每天可能有 2 期（早/晚），需去重
- **稳定性**: 高 — feed 页面稳定可达
- **验证日期**: 2026-03-20 ✅

### 2.4 源准入/退出标准

**准入条件**（满足全部）：

| 维度 | 要求 |
|------|------|
| 覆盖面 | 每日 ≥5 条 AI 相关内容 |
| 编辑质量 | 有专职编辑团队，非纯自动聚合 |
| 可抓取性 | 有公开 archive/feed 页面，无需付费/登录 |
| 独立性 | 与现有源无内容来源重叠（避免重复计数） |

**退出条件**（满足任一）：

- 连续 7 天抓取失败
- 反爬升级导致无法自动抓取
- 停刊或转为纯付费

---

## 3. 信号聚合逻辑

### 3.1 处理流程

```
┌─────────────────────────────────────────────────┐
│  Step 1: 抓取                                    │
│  每日定时抓取 5 个日报当天内容                      │
│  提取: { title, url, source, summary }           │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Step 2: URL 归一化                               │
│  - 去除 UTM 参数、tracking 后缀                    │
│  - 统一 http→https、www→非 www                    │
│  - X/Twitter 短链展开                             │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Step 3: 交叉计数                                 │
│  按归一化 URL 分组，统计被几个独立源引用              │
│  无 URL 的条目按标题语义相似度聚类（LLM 辅助）       │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Step 4: 热度分级                                 │
│  heat ≥ 3  →  🔥 必选（多源共识，当日最重要）        │
│  heat = 2  →  ⭐ 优先（两源交叉，值得关注）          │
│  heat = 1  →  📋 备选池                           │
└──────────────────────┬──────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Step 5: 匹配本站                                 │
│  与 articles 表 source_url 比对                   │
│  标记: inOurPipeline = true/false                │
└─────────────────────────────────────────────────┘
```

### 3.2 输出格式

文件: `data/daily-signals/YYYY-MM-DD.json`

```json
{
  "date": "2026-03-19",
  "generated_at": "2026-03-19T23:00:00Z",
  "sources_scraped": ["tldr", "rundown", "superhuman", "bensbites", "neuron"],
  "signals": [
    {
      "url": "https://www.anthropic.com/features/81k-interviews",
      "title": "What 81,000 people want from AI",
      "heat": 4,
      "sources": ["tldr", "superhuman", "bensbites", "neuron"],
      "summaries": {
        "tldr": "Anthropic conducted large-scale study...",
        "neuron": "Global survey finds people experience..."
      },
      "in_our_pipeline": false
    },
    {
      "url": "https://openai.com/index/introducing-gpt-5-4-mini-and-nano/",
      "title": "GPT-5.4 Mini and Nano",
      "heat": 3,
      "sources": ["tldr", "bensbites", "neuron"],
      "summaries": { ... },
      "in_our_pipeline": true
    }
  ],
  "stats": {
    "total_items": 46,
    "unique_topics": 28,
    "heat_3_plus": 6,
    "heat_2": 8,
    "covered_by_us": 5,
    "coverage_rate": 0.18
  }
}
```

### 3.3 语义聚类规则

不同日报对同一话题的标题和 URL 可能不同。需要两层匹配：

1. **URL 精确匹配**（去参数后）— 最可靠
2. **LLM 语义聚类** — 处理以下情况：
   - 同一事件不同报道源（如 VentureBeat vs TechCrunch 对小米 MiMo 的报道）
   - 标题表述差异大但指向同一话题
   - 无外部 URL 的评论性条目

语义聚类 prompt 示例：
```
Given these news items from different newsletters, group items
that refer to the same event/topic. Return groups with a
canonical title and heat count.
```

---

## 4. 与现有管线的集成

### 4.1 集成点

```
                    现有管线（不变）
                    ─────────────
14 RSS ──→ sync-articles ──→ LLM 翻译 ──→ articles 表

                    信号层（新增）
                    ───────────
5 日报 ──→ scrape-daily-signals ──→ daily-signals/YYYY-MM-DD.json
                                          ↓
                                   generate-daily（增强）
                                          ↓
                                    Daily Brief
```

### 4.2 generate-daily 增强

当前 `generate-daily.mjs` 的选题来源仅为 `articles` 表。增强后：

**输入增加**: 读取当天的 `daily-signals/YYYY-MM-DD.json`

**LLM prompt 增加信号上下文**:
```
## 今日外部热度信号（来自 5 个头部 AI 日报的交叉分析）

🔥 高热度（3+ 个日报同时报道）:
- Anthropic 81K 用户调研 (heat: 4) — 我们未覆盖
- Google Stitch 设计平台 (heat: 3) — 我们未覆盖
...

请在选题时优先考虑高热度话题。
对于我们已有翻译文章的高热度话题，优先选入 Daily Brief。
对于我们未覆盖的高热度话题，用日报摘要生成简讯条目。
```

### 4.3 Daily Brief 内容变化

增强后 Daily Brief 新增一个内容区域：

```markdown
## 🔥 今日热点（行业信号）

> 以下热点来自 The Rundown、TLDR AI 等 5 个头部日报的交叉分析

- **Anthropic 发布 81,000 人 AI 使用调研** — 33% 享受用 AI 学习，17% 担忧依赖性...
- **Google Stitch: AI 原生设计平台** — 无限画布 + 设计 Agent + 语音指令...
```

这部分内容不依赖我们的翻译文章，直接从日报摘要中精编。

---

## 5. 运行节奏

### 5.1 调度时间

```
UTC 22:00 (CST 06:00)  scrape-daily-signals
        ↓ (~5 min)
UTC 22:05               daily-signals/YYYY-MM-DD.json 就绪
        ↓
UTC 22:15               generate-daily（读取信号 + 文章池）
```

选择 UTC 22:00 的理由：
- 美国东部 17:00 / 西部 14:00 — 当天日报基本都已发出
- 比现有 sync-articles 晚几小时，确保当天翻译完成的文章也在池中

### 5.2 失败处理

| 场景 | 处理 |
|------|------|
| 单源抓取失败 | 跳过该源，其余 4 源继续聚合。热度上限从 5 降为 4 |
| 3 源以上失败 | 跳过信号层，generate-daily 回退到仅用文章池选题（现有行为） |
| LLM 语义聚类失败 | 回退到仅 URL 精确匹配，热度可能偏低但不会误判 |

### 5.3 存储与清理

- 信号文件存 `data/daily-signals/YYYY-MM-DD.json`，git 不跟踪（加入 .gitignore）
- 本地保留 30 天，超期自动清理
- 未来可考虑存入 Supabase `daily_signals` 表，支持趋势分析

---

## 6. 度量与迭代

### 6.1 核心指标

| 指标 | 目标 | 说明 |
|------|------|------|
| 覆盖率 | ≥50% | heat≥3 的话题中，我们有对应文章的比例 |
| 信号准确率 | ≥80% | heat≥3 的话题确实是当天重要事件（人工抽检） |
| Daily Brief 热点命中 | ≥2 条/天 | 每期 Daily Brief 至少包含 2 条高热度话题 |

### 6.2 迭代方向

| 阶段 | 内容 | 触发条件 |
|------|------|---------|
| **Phase 1** (当前) | 5 源日报信号 → JSON 文件 → generate-daily 读取 | 立即开始 |
| **Phase 2** | 加入 HN/Reddit 热帖作为补充信号源 | Phase 1 运行稳定 2 周后 |
| **Phase 3** | 信号驱动翻译优先级（热门话题优先翻译） | 覆盖率持续 <30% |
| **Phase 4** | 存入 DB + 趋势仪表盘（周度/月度热点回顾） | 数据积累 1 个月后 |

---

## 附录 A: 2026-03-19 验证数据

五源交叉验证（实测）：

| 话题 | TLDR | SH | Rundown | BB | Neuron | 热度 | 我们有？ |
|------|------|----|---------|----|--------|------|---------|
| Anthropic 81K 调研 | ✅ | ✅ | — | ✅ | ✅ | 4 | ❌ |
| GPT-5.4 Mini/Nano | ✅ | — | — | ✅ | ✅ | 3 | ✅ |
| Google Stitch 设计 | — | ✅ | ✅ | ✅ | — | 3 | ❌ |
| Runway 实时视频 | — | ✅ | — | ✅ | ✅ | 3 | ❌ |
| MiniMax M2.7 | ✅ | — | ✅ | — | ✅ | 3 | ❌ |
| 小米 MiMo-V2-Pro | ✅ | — | ✅ | — | ✅ | 3 | ❌ |
| Claude Dispatch | — | — | ✅ | ✅ | — | 2 | ✅ |
| Midjourney v8 | — | — | ✅ | ✅ | — | 2 | ❌ |
| MS vs OpenAI 法律 | — | ✅ | — | — | ✅ | 2 | ❌ |

heat≥3 共 6 条，我们覆盖 1 条，覆盖率 17%。
