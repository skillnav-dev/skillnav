# 内容管道规范 (Content Pipeline Specification)

> 版本：1.0 | 生效日期：2026-03-07
> 状态：**生效中**
> 取代：`docs/plans/content-pipeline.md`、`docs/plans/content-governance.md`（历史参考，不再指导执行）

## 一、内容定位

**收**：帮开发者**用好** AI 工具的内容（教程、深度分析、工具评测、最佳实践）
**不收**：纯新闻快讯（产品发布公告、融资、人事变动、政策监管）

**判断标准**：读完这篇，开发者能**做**点什么？能 → 收；只是**知道**了一件事 → 不收。

---

## 二、采集（Collection）

### 2.1 内容类型

3 个类型，不设 `news`：

| 类型 | 英文标识 | 定义 | 举例 |
|------|---------|------|------|
| 教程 | `tutorial` | 教你做（How-to、操作指南、最佳实践） | "用 Claude Code 构建 MCP Server" |
| 分析 | `analysis` | 帮你想（深度分析、趋势解读、技术洞察） | "MCP vs A2A 协议对比" |
| 指南 | `guide` | 帮你选（工具评测、对比横评、选型建议） | "2026 年 AI 编码工具横评" |

**迁移**：现有 `news` 类型文章重新评分，合格的重分类为以上三类，不合格的隐藏。`review`、`comparison`、`weekly` 合并到 `guide`。

### 2.2 源准入标准

新增 RSS 源必须满足：

| 维度 | 要求 |
|------|------|
| 相关性 | ≥60% 内容与 AI Agent/Skills/MCP/开发工具相关 |
| 质量 | 原创或深度二创，非聚合转载 |
| 频率 | 月均 ≥2 篇产出 |
| 可达性 | 有稳定 RSS/Atom feed，CI 环境可达 |

### 2.3 现有源评估

| 源 | 状态 | 理由 |
|-----|------|------|
| anthropic | **保留** | 核心厂商，全收 |
| openai | **保留，收紧过滤** | 大量产品公告属于新闻，只保留有开发者价值的 |
| langchain | **保留** | 框架教程为主 |
| simonw | **保留** | 深度分析，业界标杆 |
| github | **降级观察** | 大量非 AI 内容，命中率低 |
| huggingface | **保留** | 模型/工具教程 |
| crewai | **保留** | Agent 框架核心 |
| latent-space | **保留** | 深度播客/分析 |
| ai-coding-daily | **保留** | AI 编码核心话题 |
| thenewstack | **降级观察** | 泛云原生，AI 命中率待验证 |

**降级观察**：保留 3 个月，统计发布率和命中率，不达标则移除。

### 2.4 源退出机制

每季度审查，触发退出的条件（满足任一）：

- 连续 3 个月零命中（关键词过滤后无文章进入）
- 命中文章的平均质量分 < 2.5
- Feed 不可达超过 30 天

### 2.5 手动入库

除 RSS 自动采集外，主编可手动录入优质文章：

```bash
# 方式一：给 URL，自动抓取 + 翻译 + 入库
npm run ingest -- --url "https://example.com/great-article"

# 方式二：给本地文件
npm run ingest -- --file ./draft.md --title "标题" --source manual
```

流程：
1. 抓取/读取内容
2. LLM 翻译 + 双维度评分
3. 主编预览翻译结果和评分
4. 确认后 upsert 到 Supabase，`source = 'manual'`

手动入库文章默认 `status = 'published'`（主编亲选，跳过待审）。

---

## 三、质量管理（Quality Management）

### 3.1 双维度评分

每篇文章由 LLM **在翻译时同步评分**（不再事后补评），两个维度各 1-5 分：

**开发者价值（Developer Value, DV）**：

| 分数 | 含义 |
|------|------|
| 5 | 可直接复用的代码/配置/工作流（复制就能跑） |
| 4 | 清晰的技术方案或架构思路（读完能动手） |
| 3 | 有用的技术洞察（读完有启发） |
| 2 | 浅层介绍（知道有这个东西） |
| 1 | 无开发者价值（纯商业/营销/政策） |

**读者价值（Reader Value, RV）**：

| 分数 | 含义 |
|------|------|
| 5 | 深度原创，信息密度高，中文互联网无同类内容 |
| 4 | 优质内容，有独特视角或详实数据 |
| 3 | 合格内容，信息准确，结构清晰 |
| 2 | 内容单薄或大量重复已有信息 |
| 1 | 低质量（机器生成感、错误多、无实质内容） |

**综合分 = max(DV, RV)**。取最高分，因为某些文章可能读者价值高但开发者价值低（如趋势分析），反之亦然。

### 3.2 自动处置规则

| 综合分 | 处置 | status |
|--------|------|--------|
| 4-5 | 自动发布 | `published` |
| 3 | 自动发布 | `published` |
| 2 | 进入待审队列 | `draft` |
| 1 | 自动隐藏 | `hidden` |

### 3.3 人工审核

- **审核对象**：综合分 = 2 的文章（待审队列）
- **审核方式**：主编在每次 sync 报告中列出待审文章，给出建议（发布/隐藏），人工确认或否决
- **审核频率**：随 daily sync，不积压

### 3.4 质量回溯

每月 1 号运行质量审计：

1. 统计各分段文章数量分布
2. 检查高分低阅读量文章（可能评分虚高）
3. 检查用户反馈差的高分文章
4. 如发现系统性偏差，调整评分 prompt

---

## 四、分发（Distribution）

### 4.1 渠道矩阵

| 渠道 | 内容形式 | 频率 | 门槛 | 优先级 |
|------|---------|------|------|--------|
| skillnav.dev | 全文翻译 | 日更（自动） | 综合分 ≥ 3 | P0 |
| 知乎/掘金 | 精选深度文章 | 周 2-3 篇 | 综合分 ≥ 4 | P1 |
| 公众号 | 精选 + 编辑评论 | 周 1-2 篇 | 综合分 = 5 或主编精选 | P2 |
| 即刻/Twitter | 短摘要 + 链接 | 日更 | 综合分 ≥ 3 | P2 |

### 4.2 MCP 分发工具

利用 MCP 协议连接目标平台 API，在 Claude Code / AI Agent 中直接完成分发：

```
流程：选文 → 适配格式 → MCP 调用平台 API → 发布
```

| 平台 | MCP 能力 | 适配格式 |
|------|---------|---------|
| 知乎 | 发文章/专栏 | Markdown → 知乎富文本 |
| 掘金 | 发文章 | Markdown 直出 |
| 公众号 | 推送草稿箱 | Markdown → 微信富文本，人工确认发布 |
| 即刻/Twitter | 发动态 | 短摘要 + 原文链接 |

实施路径：先调研各平台是否有可用 MCP Server 或开放 API，逐个接入。

### 4.3 分发脚本

构建 `scripts/distribute.mjs`：

```bash
# 按 slug 分发到指定平台
npm run distribute -- --slug "article-slug" --platform zhihu

# 按筛选条件批量分发
npm run distribute -- --score-min 4 --since 7d --platform juejin
```

输出各渠道适配的内容格式，先手动确认触发，后续可接入 CI 自动化。

---

## 五、数据库变更

### 5.1 article_type 约束更新

```sql
-- 迁移现有类型
UPDATE articles SET article_type = 'guide' WHERE article_type IN ('review', 'comparison', 'weekly');
UPDATE articles SET article_type = 'analysis' WHERE article_type = 'news' AND relevance_score >= 3;
UPDATE articles SET status = 'hidden' WHERE article_type = 'news' AND relevance_score < 3;
UPDATE articles SET article_type = 'tutorial' WHERE article_type = 'news' AND status != 'hidden';

-- 更新约束
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('tutorial', 'analysis', 'guide'));
```

### 5.2 评分字段升级

```sql
-- 双维度评分
ALTER TABLE articles ADD COLUMN IF NOT EXISTS developer_value INTEGER
  CHECK (developer_value BETWEEN 1 AND 5);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS reader_value INTEGER
  CHECK (reader_value BETWEEN 1 AND 5);

-- relevance_score 保留为综合分 = max(DV, RV)，由应用层计算写入
```

---

## 六、实施节奏

| 阶段 | 内容 | 产出 |
|------|------|------|
| Phase 1 | 采集规范落地：类型精简、源评估、评分 prompt 升级 | 本周 |
| Phase 2 | 质量体系上线：双维度评分集成到 sync、自动处置、审核报告 | 下周 |
| Phase 3 | 手动入库脚本 `ingest-article.mjs` | 第 3 周 |
| Phase 4 | MCP 分发调研 + `distribute.mjs` 脚本 | 第 3-4 周 |

---

## 七、管线全景

```
                    ┌─────────────┐
                    │  RSS 源 (10) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
         自动采集     手动入库 URL    手动入库文件
              │            │            │
              └────────────┼────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   去重过滤   │  source_url 唯一约束
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  全文提取    │  Readability + Turndown
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ LLM 翻译    │  翻译 + 分类 + 双维度评分
                    │ + 评分      │  DV(1-5) + RV(1-5)
                    └──────┬──────┘
                           │
                    ┌──────┼──────┐
                    │      │      │
                    ▼      ▼      ▼
                 ≥3分    2分    1分
                 发布    待审    隐藏
                    │      │
                    ▼      ▼
              ┌──────────────────┐
              │  skillnav.dev    │  P0: 自动发布
              └───────┬──────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    知乎/掘金      公众号      即刻/Twitter
    (≥4分)       (5分/精选)     (≥3分)
         │            │            │
         └────────────┼────────────┘
                      │
               MCP 分发工具
```
