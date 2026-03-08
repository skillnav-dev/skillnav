# SkillNav 内容战略 2.0 — 最终方案

**版本**: 2.0
**日期**: 2026-03-08
**状态**: 已确认，待实施

---

## 一、战略转型

```
现状：翻译聚合站（96% 翻译 / 4% 原创）
目标：有编辑立场的 AI 工具策展品牌
```

**核心心智模型不变**：日常学习/试用的副产品系统化沉淀，边际成本 ≈ 0。

**新增**：周刊作为品牌载体，把碎片化翻译内容编织成有观点的策展。

---

## 二、内容矩阵

| 层级 | 产品 | 频率 | 生产方式 | 角色 |
|------|------|------|---------|------|
| 日更 | RSS 翻译 | 每天自动 | 管线全自动 | **素材库**（不主推） |
| 周更 | SkillNav Weekly | 每周一 | AI 辅助 + 主编策展 | **品牌载体**（核心） |
| 双周 | 深度评测/实战 | 有精力时 | 原创 | **SEO 长尾** |
| 月更 | 月度盘点 | 每月初 | AI 辅助 + 主编 | **增长飞轮** |

**底线承诺**：周刊必出，评测是 bonus。

---

## 三、架构设计 — 双维度内容体系

### 核心决策

不改 `article_type`（保持 tutorial/analysis/guide），新增 `content_tier` 维度。

### 数据模型

| 字段 | 类型 | 用途 | 值 |
|------|------|------|-----|
| `content_tier` | TEXT | 内容生产方式 | `editorial` / `translated` |
| `series` | TEXT | 系列标识 | `weekly` / `monthly-roundup` / null |
| `series_number` | INTEGER | 期号 | 1, 2, 3... |

### 组合示例

| 内容 | content_tier | article_type | series | series_number |
|------|-------------|-------------|--------|---------------|
| 周刊 #3 | editorial | guide | weekly | 3 |
| 深度评测 | editorial | analysis | null | null |
| 月度盘点 | editorial | analysis | monthly-roundup | 1 |
| RSS 翻译 | translated | (LLM 分类) | null | null |

### 为什么不用 article_type = 'weekly'

- `article_type` 是主题分类维度（教你做/帮你想/帮你选）
- `content_tier` 是生产方式维度（编辑/翻译）
- 周刊本质是 guide（帮你选/帮你筛），不是一个独立主题类型
- 分离维度让查询更灵活

---

## 四、前端改造方案

### 首页

新增 `EditorialHighlights` 区域，优先展示编辑内容：

```
┌────────────────────────────────────────────────┐
│  [编辑精选]                                     │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │ 周刊卡片 (大)  │  │ 评测/指南卡片 (列表)    │  │
│  │ 本周精选 5 个  │  │ - Claude Code 深度      │  │
│  │               │  │ - MCP 实战评测           │  │
│  └──────────────┘  └────────────────────────┘  │
├────────────────────────────────────────────────┤
│  [最新翻译]                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ card   │ │ card   │ │ card   │ │ card   │  │
│  └────────┘ └────────┘ └────────┘ └────────┘  │
└────────────────────────────────────────────────┘
```

初期 editorial 为空时，`EditorialHighlights` 优雅隐藏。

### 文章列表页

Tab 切换：「编辑精选 / 全部资讯」

- 编辑精选 Tab：只显示 `content_tier = 'editorial'`
- 全部资讯 Tab：显示所有 published 文章
- 默认 Tab：有 editorial 内容时显示编辑精选，否则显示全部

URL 参数扩展：
- `tab`: `editorial` / `all`
- `series`: `weekly` / `monthly-roundup`

### 卡片差异化

- `editorial` → 显示"编辑精选"高亮 badge
- `translated` → 显示"编译"灰色小标签
- `series === 'weekly'` → 大卡片（span 2 col），显示期号

### 周刊详情模板

检测 `series === 'weekly'` 时渲染不同布局：
- 更宽阅读区
- 目录导航
- 往期切换（← 上一期 / 下一期 →）

内容存储仍用 Markdown，通过约定的 heading 结构（`## 热点速递`、`## 工具推荐` 等）实现语义化。

---

## 五、周刊生产工作流

### 工具链

```bash
# 1. 生成素材（自动，从 DB 提取上周高分文章）
npm run weekly:digest

# 2. 主编审阅素材，标记选题（人工，15min）

# 3. AI 编排成周刊草稿（自动）
npm run weekly:compose -- --file drafts/weekly-2026-w11.md

# 4. 主编润色，加编者按（人工，30-60min）

# 5. 发布到 DB + 生成分发版本（自动）
npm run weekly:publish -- --file drafts/weekly-2026-w11-draft.md
```

### 周刊模板

```markdown
# SkillNav Weekly #N | YYYY-MM-DD

## 本周要闻
3-5 条，每条 2-3 句 + 编者按

## 工具推荐
2-3 个 Skill/MCP，含安装命令 + 实测点评

## 深度好文
2-3 篇精选翻译文章，含链接 + 为什么值得读

## 编辑观点
1-2 段主编评论

---
往期周刊：← #N-1 | #N+1 →
```

### 素材收集脚本 (`generate-weekly-digest.mjs`)

1. 查询上周 published + translated 文章
2. 按 relevance_score 分组（5 分必选，4 分推荐，3 分备选）
3. 扫描本周新增 Skills
4. LLM 聚类生成建议选题方向
5. 输出 Markdown 素材文件到 `drafts/`

### 编排脚本 (`compose-weekly.mjs`)

1. 读取主编标注的素材文件
2. 从 DB 取完整翻译内容
3. LLM 生成周刊各模块
4. 输出草稿 Markdown

### 发布脚本 (`publish-weekly.mjs`)

1. 读取润色后的 Markdown
2. 生成 slug: `weekly-YYYY-wNN`
3. Upsert 到 articles 表（editorial + weekly + guide）
4. 生成分发版本（知乎/掘金/公众号/即刻各一份）

---

## 六、分发策略

| 渠道 | 内容 | 格式 |
|------|------|------|
| skillnav.dev | 全部内容 | 完整 |
| 知乎专栏 | 周刊 + 评测 | 完整 Markdown |
| 掘金 | 评测 + 教程 | 完整 Markdown |
| 微信公众号 | 周刊精简版 | 精简 + 引导回站 |
| 即刻/Twitter | 所有编辑内容 | 3 句话摘要 + 链接 |

---

## 七、数据库迁移

### 迁移文件 `20260309_content_tiers.sql`

```sql
-- 新增 content_tier 字段
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_tier TEXT
  DEFAULT 'translated'
  CHECK (content_tier IN ('editorial', 'translated'));

-- 新增 series 字段
ALTER TABLE articles ADD COLUMN IF NOT EXISTS series TEXT;

-- 新增期号字段
ALTER TABLE articles ADD COLUMN IF NOT EXISTS series_number INTEGER;

-- 索引
CREATE INDEX IF NOT EXISTS idx_articles_content_tier ON articles(content_tier);
CREATE INDEX IF NOT EXISTS idx_articles_series ON articles(series) WHERE series IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_editorial_latest
  ON articles(content_tier, published_at DESC)
  WHERE status = 'published' AND content_tier = 'editorial';

-- 回填现有文章
UPDATE articles SET content_tier = 'translated' WHERE content_tier IS NULL;
```

### TypeScript 类型扩展

```typescript
export type ContentTier = 'editorial' | 'translated';
export type ArticleSeries = 'weekly' | 'monthly-roundup';

// Article 接口新增
contentTier: ContentTier;
series?: string;
seriesNumber?: number;
```

### DAL 新增

- `getEditorialArticles(limit)` — 取编辑内容
- `getWeeklyArticles(limit)` — 取周刊列表
- `getArticlesWithCount` 支持 `contentTier` 过滤

---

## 八、分阶段实施

| Phase | 内容 | 依赖 | 产出 |
|-------|------|------|------|
| **Phase 1** | 数据层 + 类型体系 | 无 | DB 迁移 + 类型 + DAL |
| **Phase 2** | 前端差异化展示 | Phase 1 | Tab/Badge/首页编辑区 |
| **Phase 3** | 周刊生产工具链 | Phase 1 | 3 个脚本 + 第一期周刊 |
| **Phase 4** | 周刊详情模板 | Phase 2+3 | 专用展示 + 往期浏览 |

**推荐顺序**：Phase 1 → Phase 3 → Phase 2 → Phase 4

先打通数据层和工具链，尽快出第一期周刊验证内容方向，再做前端美化。

---

## 九、成功指标

| 指标 | 当前 | 3 个月目标 | 6 个月目标 |
|------|------|-----------|-----------|
| 周刊期数 | 0 | 12+ | 24+ |
| 原创/策展占比 | 4% | 15% | 25% |
| 文章总数 | 273 | 400+ | 600+ |
| 周刊订阅 | 0 | 100+ | 500+ |
| 知乎/掘金关注 | 0 | 50+ | 200+ |

---

## 十、竞品验证

| 判断 | 依据 |
|------|------|
| 市场空白真实 | 中文没有「AI 开发工具深度策展」产品 |
| 小团队可行 | Latent Space 2 人 → 20 万+ 订阅 |
| 时机正确 | Skills 9K+、MCP 17K+、A2A 启动 |
| 壁垒在内容不在技术 | mcp.so 2h 建站百万月访问，内容为零 |

---

## 关联文档

| 文档 | 路径 |
|------|------|
| 内部现状审计 | `docs/research/internal-content-audit.md` |
| 竞品分析 | `docs/research/competitive-content-analysis.md` |
| 管线技术评估 | `docs/research/pipeline-technical-assessment.md` |
| 市场趋势 | `docs/research/market-trends-2026.md` |
| 内容管道规范 v1 | `docs/specs/content-pipeline-spec.md` |
