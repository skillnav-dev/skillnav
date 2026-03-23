# SkillNav 内容操作系统方案 v2
Status: active
Progress: M1-M3 done, M4 pending
Date: 2026-03-11

> Author: Claude (战略合伙人)
> 基于四路并行调研 + 腾讯 SkillHub 补充调研整合

---

## 一、现状与问题

三个内容支柱成熟度失衡：

| 维度 | 资讯 Articles | 工具 Skills | MCP Servers |
|------|-------------|------------|-------------|
| 数据量 | 99 篇 (63 pub + 36 draft) | 168 个精选 | 18 个硬编码 |
| 自动发现 | 13 RSS 源，日频 | 冻结 | 无 |
| LLM 加工 | 编译模式（翻译+导读+评分） | 无 | 无 |
| 入库审发 | draft -> Admin 审核 -> publish | 一次性导入 | 纯手工 |
| 保鲜 | 无需（文章不变） | 无（stars 冻结） | 无 |

**核心矛盾**：资讯每天更新，工具数据是建站时的快照。用户因新鲜资讯来访，却看到冻结的工具列表。

---

## 二、设计原则

1. **一个系统，三种内容** — 共享发现->加工->审发->保鲜流程，只是源头和节奏不同
2. **周刊是枢纽** — 整合三支柱的本周动态，是站点最有价值的单一内容产品
3. **编辑时间是最稀缺资源** — 每周 2-3h 编辑窗口，系统让这 2-3h 产出最大化
4. **鲜活感 > 数量** — "本周新增""近期热门""3天前更新" 比涨到 500 更有价值
5. **编辑点评是护城河** — 竞品做"多"，我们做"精"和"有观点"

---

## 三、发现源选型（调研结论）

### Skills 源（按优先级）

| 优先级 | 源 | 评级 | 周新增 | 噪音比 | 技术难度 | 说明 |
|--------|---|------|--------|--------|---------|------|
| P0 | VoltAgent/awesome-agent-skills | 强烈推荐 | 5-15 | <10% | 低 | 8.4K stars，500+ skills 策展源，质量最高，严格准入 |
| P0 | skills.sh (Vercel Labs) | 强烈推荐 | 10-30 | 20-30% | 中 | 9.6K stars，有安装量数据（比 stars 更有价值的信号） |
| P1 | travisvn/awesome-claude-skills | 推荐 | 3-10 | <15% | 低 | 7.6K stars，Claude 专属，10 stars 准入门槛 |
| P1 | SkillsMP API | 推荐 | 50-200 | 60-70% | 低 | 40 万+ skills，公开 REST API（500 req/day），需二次过滤 |
| P1 | 已跟踪 7 个 GitHub 仓库 | 保持 | 0-5 | 极低 | 极低 | 增量检测新文件 |
| P2 | GitHub Topics (agent-skills) | 观察 | 5-20 仓库 | 30-40% | 中 | 仓库级别非 skill 级别 |

**不采用**：GitHub Code Search（10 req/min + 1000 上限 + 无时间排序）、GitHub Trending（噪音 >95%）、Cursor Rules（格式不兼容）、腾讯 SkillHub（无公开 API，且本质是 ClawHub CDN 镜像，见附录 B）

**关键发现**：
- awesome-agent-skills 是新出现的高质量策展源，覆盖跨平台（Claude/Codex/Gemini CLI/Cursor 等）
- skills.sh 是 Vercel 官方的 Skills 生态（`npx skills add/find`），安装量 = 真实使用信号
- SkillsMP 有公开 API 但噪音高（2 stars 门槛），需 `stars > 10` 过滤
- **OpenClaw 精选决策**：腾讯 SkillHub 验证了中文用户对 OpenClaw/ClawHub 精选的需求，但 SkillHub 只是 CDN 镜像无编辑深度。SkillNav 应从 SkillsMP API / skills.sh 中筛选 OpenClaw 生态的优质 Skills（50-100 个），以 `source='openclaw'` 标记，配合编辑点评形成差异化。不再全量镜像 ClawHub（之前已删 7,159 条），只做精选。

### MCP 源（按优先级）

| 优先级 | 源 | 评级 | 规模 | 噪音比 | 技术难度 | 说明 |
|--------|---|------|------|--------|---------|------|
| P0 | Official MCP Registry | 强烈推荐 | 518+ | 中 | 低 | 官方 REST API，OpenAPI 规范，`updated_since` 增量，无需认证 |
| P0 | Smithery Registry | 推荐 | 7,300+ | 低 | 低 | `is:verified` 过滤器极大降噪，有 security scan + tools schema |
| P1 | Glama API | 推荐 | 9,000+ | 中 | 中 | 独有使用量排名数据（过去 30 天工具调用次数） |
| P1 | modelcontextprotocol/servers | 推荐 | 15-20 | 零 | 极低 | 官方参考实现，已收录大部分 |
| P2 | best-of-mcp-servers | 观察 | 410 | 低 | 待验证 | 每周更新排名，有 quality score |

**不采用**：awesome-mcp-servers 直接解析（Markdown 脆弱，Glama 已是其结构化版本）、阿里云百炼（无公开 API）、npm/PyPI 直接搜索（噪音太高）

**关键发现**：
- Official MCP Registry 有完整的 OpenAPI 规范，支持 `updated_since` 增量拉取，是最理想的主源
- Smithery 的 `verified` 标签 + security scan 是独有数据维度
- Glama 的使用量排名是其他源没有的真实热度信号
- 三源组合可实现：Registry 保权威 + Smithery 保质量 + Glama 补热度

### 去重策略

同一工具可能出现在多个源中，统一去重 key：
- **Skills**：`github_url` 归一化（去 trailing slash，统一 https）
- **MCP**：`github_url` 为主 key，`npm_package` 为辅助 key
- 合并逻辑：以发现时间最早的源为基准，后续源补充元数据字段

---

## 四、展示设计（调研结论）

### 当前字段盘点（现状）

**Skills 卡片**（`skill-card.tsx`）：

| 字段 | 数据源 | 展示方式 | 问题 |
|------|--------|---------|------|
| 名称 | nameZh ?? name | 链接标题 | OK |
| 作者 | author | "by xxx" | OK |
| 描述 | descriptionZh ?? description | line-clamp-2 | OK |
| 平台 | platform | PlatformBadge | OK |
| 安全评分 | securityScore | SecurityBadge | 全部 unscanned，展示无意义，应移除 |
| 分类 | category | Badge | OK |
| 质量 | qualityTier=A | "精选" 金色 Badge | OK |
| Stars | stars | Star 图标 + 数字 | OK |
| 来源 | repoSource | GitFork 图标 + 文字 | 太隐晦，用户不理解 |
| 编辑点评 | editorCommentZh | **未展示在卡片** | 字段有数据但卡片没用，浪费差异化武器 |

**Skills 详情页**（`skills/[slug]/page.tsx`）：较完善。标题 + 平台 + 作者 + 描述 + 编辑点评（高亮块）+ 安装 Tab + SKILL.md + 编辑评测 + giscus 评论 + 侧边栏 + 相关资讯/Skills。

**MCP 卡片**（`mcp-card.tsx`）：

| 字段 | 数据源 | 展示方式 | 问题 |
|------|--------|---------|------|
| 名称 | nameZh | 标题 | OK |
| 作者 | author | "by xxx" | OK |
| 描述 | descriptionZh | line-clamp-2 | OK |
| 精选 | isFeatured | 金色 Badge | OK |
| 安装命令 | installCommand | 代码块 + 一键复制 | OK，这是亮点 |
| 分类 | category | Badge | OK |
| Stars | stars | Star 图标 + 数字 | 数据是硬编码的冻结值 |
| GitHub | githubUrl | 外链图标 | OK |

**MCP 严重缺失**：
- 无详情页（只有卡片列表，无法 SEO，无法深入了解）
- 无编辑点评
- 无 freshness 标记
- 数据全部硬编码在 `src/data/mcp-servers.ts`（18 条，stars 是手填的）
- 无排序/筛选（只有搜索 + 分类按钮）
- 无工具数量（MCP 的核心指标：这个 server 提供几个工具）

### 竞品展示对比

| 维度 | mcp.so | Glama | Smithery | cursor.directory | HelloGitHub |
|------|--------|-------|----------|-----------------|-------------|
| 卡片核心 | 名称+描述+作者 | +stars+质量分 | +安装数+工具数 | +点赞数+作者 | +语言+stars |
| 质量信号 | Official/Featured 标记 | 百分制评分 | verified+安装数 | 社区投票 | 月刊精选 |
| 排序选项 | Tab 5 种 | 4 种 | 3 种 | 3 种 | 时间+精选 |
| 差异化 | 量大、Playground | 自动评分 | 多客户端安装 | UGC 社区 | 月刊制度 |

### SkillNav 卡片字段设计

**必要字段（保留现有）**：
1. 名称（nameZh 优先）
2. 简介（descriptionZh，line-clamp-2）
3. 分类 Badge
4. 平台 Badge（claude/codex/universal）
5. Stars 数
6. 质量标记（A 级 -> "精选" badge）

**新增字段**：
7. **来源 Badge** — "官方"/"Vercel"/"社区" 用不同颜色，替代当前隐晦的 GitFork 图标
8. **编辑点评** — `editor_comment_zh` 截断展示（1 行），hover/点击展开。这是策展站的核心差异
9. **Freshness 标记** — Trending / New / Stale / Archived 角标（见第六节）
10. **最后活跃** — "3 天前更新" 相对时间

**MCP 卡片额外字段**：
11. **工具数量** — "5 个工具"（从 tools schema 获取）
12. **安装方式** — 图标提示支持哪些客户端
13. **版本号** — "v1.2.3"（从 npm registry / Official Registry 同步）

**Skills 卡片可选字段**：
14. **安装量** — skills.sh 的 install count（比 stars 更真实的使用信号，排序权重高于 stars）

### 列表页筛选/排序

**保留现有**：搜索框、平台筛选、分类筛选、Stars/最新排序

**新增**：
- **来源筛选**：官方 / Vercel / 社区（用户更关心"谁出品的"）
- **排序扩展**：增加"编辑推荐"（按 editor_rating 降序）
- **Freshness 筛选**：全部 / 近期活跃 / 本周新增
- **"随机发现"** 按钮：借鉴 HelloGitHub "换一换"，随机展示 6 个工具

### 详情页布局

保留现有两栏结构，优化信息优先级：

**主内容区（左侧）**：
1. 标题 + 作者 + 平台 Badge + 来源 Badge + Stars + "N 天前更新"
2. **编辑推荐语**（高亮背景块，策展站核心，最醒目位置）
3. 安装 Tab（Claude Code / Codex / Cursor，已实现）
4. SKILL.md / README 正文（中英切换）
5. 评论区（giscus）

**侧边栏（右侧）**：
1. 快速信息卡：平台、分类、来源、Stars、质量等级、最后活跃
2. 环境要求（requiresEnv / requiresBins）
3. 外部链接（GitHub、源页面）
4. 相关工具（同分类推荐）

---

## 五、保鲜机制（调研结论）

### 技术方案：GraphQL 批量查询 + 自建快照

**为什么选 GraphQL**：
- 200 个 repo 只需 4 次请求（每批 50 个，用别名），总消耗 ~4 points（配额 5,000/h 的 0.08%）
- REST API 需要 200 次请求，消耗 200/5,000 = 4%
- GraphQL 单次查询耗时 1-3 秒，总计 < 15 秒

**查询字段**：
```graphql
repository(owner: "xxx", name: "yyy") {
  stargazerCount
  forkCount
  pushedAt        # 最后推送时间 -> 活跃度计算
  isArchived      # 是否归档
  updatedAt
  description
}
```

**趋势计算：自建快照**
- 新建 `stars_snapshots` 表，每周记录一次 stars/forks
- `weekly_delta = 本周 stars - 上周 stars`
- `growth_rate = weekly_delta / 上周 stars`
- 4 周后可展示趋势 sparkline
- 存储成本极低：200 tools * 52 周 = ~10K 行/年

**Freshness 状态计算**：
```
Trending  — weekly_delta > 10 或 growth_rate > 5%
New       — discovered_at < 30 天
Fresh     — pushed_at < 30 天（默认，不显示标记）
Active    — pushed_at < 6 个月（默认，不显示标记）
Stale     — pushed_at > 6 个月 → 黄色标记
Archived  — isArchived = true → 灰色标记 + 卡片降低透明度
```

**前端展示**：
- 时间格式：< 30 天用相对时间（"3 天前"），> 30 天用绝对日期
- 角标：每个工具最多显示一个状态标记（按优先级：Trending > New > Stale > Archived）
- Sparkline（第二期）：卡片上 4 周迷你趋势线，纯 SVG 无需额外库

**CI 频率**：
- 每天：更新 skills/mcp 表的 stars/forks/pushedAt/isArchived
- 每周一：写入 snapshots 表 + 计算 trending 标记

---

## 六、统一内容节奏

### 周循环

```
周一 UTC 02:30 (CST 10:30) ── 机器日 ──
  CI 自动执行（GitHub Actions）：
  ├─ sync-skills.yml     → 扫描 awesome-lists + skills.sh，新 skill 入库 draft
  ├─ sync-mcp.yml        → 扫描 Official Registry + Smithery，新 MCP 入库 draft
  ├─ refresh-metadata.yml → GraphQL 批量更新 stars/活跃度 + 周快照
  └─ Slack 通知           → "发现 N 个新 Skills / M 个新 MCP / K 个状态变更"

  （资讯管线独立运行：每日 UTC 22:15 + 10:15 双时段采集）

周二 ~11:00 CST ── 编辑日 ──
  你在 Admin 后台（~1-2h）：
  ├─ 审核新 Skills（按 quality_score 降序，A 级直接发，B 级看一眼）
  ├─ 审核新 MCP Servers（同上）
  ├─ 审核积压的 draft 文章
  └─ 对本周亮点写编辑点评

周三 UTC 00:00 (CST 08:00) ── 发布日 ──
  CI 自动生成周刊草稿（整合三支柱本周动态）
  你审阅 -> 发布 -> 分发到 X / 公众号 / 知乎 / 即刻

周四~周日 ── 沉淀期 ──
  资讯管线持续日频采集
  随手录入发现的好工具
  偶尔写深度评测/教程
```

### Admin 后台扩展

复用现有 Admin 架构（login/dashboard 已有），新增两个 Tab：
- `/admin/skills` — Skills 待审列表（status=draft，按 quality_score 降序）
- `/admin/mcp` — MCP 待审列表（同上）
- 操作：publish / hide / 编辑点评（复用现有 status-toggle + 编辑组件）

---

## 七、数据层设计

### Skills 表变更

```sql
-- 新增列
ALTER TABLE skills ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published'
  CHECK (status IN ('draft', 'published', 'hidden'));
ALTER TABLE skills ADD COLUMN IF NOT EXISTS intro_zh TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS quality_reason TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE skills ADD COLUMN IF NOT EXISTS pushed_at TIMESTAMPTZ;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS forks_count INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS weekly_stars_delta INTEGER DEFAULT 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS freshness TEXT DEFAULT 'active'
  CHECK (freshness IN ('fresh', 'active', 'stale', 'archived'));
ALTER TABLE skills ADD COLUMN IF NOT EXISTS install_count INTEGER DEFAULT 0;  -- skills.sh 安装量（比 stars 更真实的使用信号）
ALTER TABLE skills ADD COLUMN IF NOT EXISTS source_url TEXT;  -- awesome-list / skills.sh 原始链接
ALTER TABLE skills ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
```

### MCP Servers 表（新建）

```sql
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  description TEXT,
  description_zh TEXT,
  intro_zh TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  github_url TEXT,
  npm_package TEXT,
  install_command TEXT,
  install_config JSONB,           -- 多客户端安装配置 JSON
  tools_count INTEGER DEFAULT 0,  -- MCP 工具数量
  version TEXT,                   -- npm/PyPI 版本号（用户安装时关心）
  stars INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  weekly_downloads INTEGER DEFAULT 0,
  quality_score INTEGER,
  quality_tier TEXT DEFAULT 'B' CHECK (quality_tier IN ('A', 'B', 'C')),
  quality_reason TEXT,
  editor_comment_zh TEXT,
  editor_rating NUMERIC(2,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  source TEXT,                    -- 'official-registry' / 'smithery' / 'glama' / 'manual'
  source_url TEXT,
  is_verified BOOLEAN DEFAULT false,  -- Smithery verified 标签
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  weekly_stars_delta INTEGER DEFAULT 0,
  freshness TEXT DEFAULT 'active' CHECK (freshness IN ('fresh', 'active', 'stale', 'archived')),
  pushed_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX idx_mcp_servers_category ON mcp_servers(category);
CREATE INDEX idx_mcp_servers_source ON mcp_servers(source);
```

### Stars 快照表（新建）

```sql
CREATE TABLE IF NOT EXISTS stars_snapshots (
  id BIGSERIAL PRIMARY KEY,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('skill', 'mcp')),
  tool_slug TEXT NOT NULL,
  stars_count INTEGER NOT NULL,
  forks_count INTEGER DEFAULT 0,
  pushed_at TIMESTAMPTZ,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tool_type, tool_slug, snapshot_date)
);

CREATE INDEX idx_snapshots_lookup ON stars_snapshots(tool_type, tool_slug, snapshot_date DESC);
```

---

## 八、脚本架构

```
scripts/
├── sync-articles.mjs            # 已有，文章管线（日频）
├── sync-curated-skills.mjs      # 已有，改造：增量发现 + LLM 评价
├── sync-mcp-servers.mjs         # 新增：MCP 发现管线
├── refresh-tool-metadata.mjs    # 新增：GraphQL 保鲜 + 快照
├── generate-weekly.mjs          # 已有，升级：整合三支柱
└── lib/
    ├── llm.mjs                  # 已有，共享 LLM 模块
    ├── logger.mjs               # 已有，共享日志
    ├── github.mjs               # 新增：GitHub GraphQL 封装
    └── sources/
        ├── awesome-skills.mjs   # awesome-agent-skills + awesome-claude-skills 解析
        ├── skills-sh.mjs        # skills.sh 排行榜采集
        ├── mcp-registry.mjs     # Official MCP Registry API
        ├── smithery.mjs         # Smithery Registry API
        └── glama.mjs            # Glama API（补充热度数据）
```

### 采集流程（以 MCP 为例）

```
1. 拉取 Official Registry（GET /v0.1/servers?updated_since=上次同步时间）
2. 拉取 Smithery（GET /servers?is:verified，cursor 分页）
3. 合并去重（github_url 为 key）
4. 对新发现的 MCP：
   a. 获取 GitHub 元数据（stars/description/README）
   b. LLM 评价（一次调用产出 nameZh/descriptionZh/introZh/category/qualityScore/editorComment）
   c. 入库为 draft
5. Slack 通知结果
```

---

## 九、LLM 评价 Prompt

三种内容共用评价框架，以 MCP 为例：

```
你是 SkillNav 的高级技术编辑。评价以下 MCP Server，输出 JSON：

{
  "nameZh": "中文名称（简洁准确）",
  "descriptionZh": "一句话中文描述（说清楚它做什么）",
  "introZh": "2-3句编辑导读：解决什么问题、适合谁用、有什么特别之处",
  "category": "从以下选一个：[数据库/开发工具/AI模型/通信协议/文件系统/搜索引擎/云服务/监控运维/内容管理/其他]",
  "tags": ["标签1", "标签2", "标签3"],
  "qualityScore": 1-10,
  "qualityReason": "英文评分理由（内部参考）",
  "editorCommentZh": "一句中文编辑点评（面向读者，有观点）"
}

评分维度：
- 实用性（3分）：解决真实问题 vs 玩具/demo
- 完成度（3分）：README完善、有示例、可直接使用
- 活跃度（2分）：近期更新频率、社区反馈
- 安全性（2分）：权限需求合理、无明显风险

editorCommentZh 要求：
- 一句话，有观点，不是复述描述
- 好例子："官方出品，Postgres 用户的 MCP 首选"
- 坏例子："这是一个连接 PostgreSQL 的 MCP Server"
```

---

## 十、实施路径

按用户可感知的里程碑切分，不按工程模块：

### M1: MCP 活起来（1 session）

**前置**：MCP 从硬编码迁入 Supabase
1. 创建 `mcp_servers` 表 + DB 迁移
2. 迁移现有 18 个 MCP 数据到 DB
3. 改造 `/mcp` 页面：从静态数据 -> DAL 查询
4. 编写 `sync-mcp-servers.mjs`（Official Registry + Smithery）
5. 首次同步：目标从 18 -> 80+ 个 draft
6. 你在 Admin 审核 -> publish 精选

**交付物**：MCP 页面数据来自 DB，有 50+ 个 MCP Server，支持持续发现

### M2: Skills 活起来（1 session）

1. Skills 表补 status/quality_score/intro_zh 等列
2. 改造 `sync-curated-skills.mjs`：增量检测 + LLM 评价
3. 新增 awesome-skills 源（awesome-agent-skills + awesome-claude-skills）
4. 首次增量同步 + LLM 评价
5. 你在 Admin 审核新 Skills

**交付物**：Skills 管线活起来，每周自动发现新 Skills 入库

### M3: 全站有心跳（1 session）

1. 编写 `refresh-tool-metadata.mjs`（GraphQL 批量 + 快照）
2. 编写 `scripts/lib/github.mjs`（GraphQL 封装）
3. 创建 `stars_snapshots` 表
4. 前端：Freshness 角标（Trending/New/Stale/Archived）
5. 前端：卡片显示"N 天前更新" + 编辑点评
6. CI 编排：sync-tools.yml（周一自动同步 + 每日保鲜）

**交付物**：全站工具数据每日更新，用户能感受到"这个站是活的"

### M4: 周刊成枢纽（1 session）

1. 升级 `generate-weekly.mjs`：整合本周新 Skills/MCP + 文章 + 生态动态
2. Admin 新增 Skills/MCP 审核 Tab
3. 首页 EditorialHighlights 接入
4. 发布首期三支柱周刊

**交付物**：周刊成为站点价值浓缩，一份周刊覆盖全站动态

---

## 十一、边界与风险

### 做的事
- 自动发现 + LLM 评价 + 人工审发（三种内容统一流程）
- 持续保鲜（stars/活跃度/归档检测，日频）
- 周刊整合三支柱
- 编辑点评作为差异化武器

### 明确不做
- 不追求数量（不做 mcp.so 的全量镜像）
- 不做用户提交/社区贡献（现阶段无社区）
- 不做 Playground/在线试用（实现成本过高）
- 不建新的 Admin 系统（复用现有 Admin 加 Tab）
- 不做 Cursor Rules（格式不兼容，不同生态）

### 风险

| 风险 | 概率 | 对策 |
|------|------|------|
| Official MCP Registry API 变更 | 低 | v0.1 已 freeze，有 OpenAPI spec 做契约 |
| Smithery API 需要 Token | 确定 | 申请 API Key，存为 GitHub Secret |
| awesome-list README 格式变化 | 中 | 解析器加容错 + 格式变化告警 |
| LLM 评分/点评质量不稳定 | 中 | 评分只做排序参考，点评人工可改，发布权在人 |
| 新工具太多审不过来 | 低 | C 级自动 hidden，只审 A/B 级（预估 <20/周） |
| GitHub API Token 配额 | 极低 | GraphQL 200 repo 仅 4 points，配额 5,000/h |

---

## 十二、成功指标

| 指标 | 当前 | M1 后 | M4 后 |
|------|------|-------|-------|
| MCP Servers | 18 (硬编码) | 80+ (DB) | 150+ |
| Skills | 168 (冻结) | 168 | 250+ |
| 保鲜频率 | 无 | 日频 | 日频 |
| 编辑审核耗时 | 无 | ~1h/周 | ~1.5h/周 |
| 周刊内容 | 仅文章 | 仅文章 | 三支柱整合 |
| 用户感知 | 静态目录 | MCP 活了 | 全站有心跳 |

---

## 附录 A：调研报告索引

| 调研方向 | 关键发现 |
|---------|---------|
| Skills 源 | awesome-agent-skills（8.4K stars）+ skills.sh（Vercel, 安装量数据）为最优源 |
| MCP 源 | Official Registry（公开 REST API + 增量拉取）+ Smithery（verified 过滤）为最优组合 |
| 竞品展示 | 编辑点评是 SkillNav 最大差异化；卡片需加来源 Badge + freshness 标记 |
| 保鲜机制 | GraphQL 别名批量查询最优（200 repo < 15 秒，4 points）；自建快照算 trending |

完整调研报告存档于各 Agent 输出文件，关键数据已整合到本文档中。

---

## 附录 B：腾讯 SkillHub 补充调研

### 产品本质

**ClawHub 的国内 CDN 镜像 + 中文皮肤**，2026-03-08 上线，腾讯云出品。

| 维度 | 详情 |
|------|------|
| 规模 | 1.3 万 Skills（ClawHub 同源），Top 50 精选榜单 |
| 核心卖点 | 国内极速下载（腾讯云 COS CDN） + 中文搜索 + 8 大分类 |
| 安装 | 自有 CLI `skillhub install <name>`，未收录则回退 ClawHub |
| API | 无公开 API，SPA 前端不可抓取 |
| 开源 | 非开源 |
| 安全 | 声称有安全审计，但社区反馈缺少 ClawHub 的 Risk Scan |
| 商业 | 免费，配套腾讯云 Lighthouse 引流 |

### 社区评价

- 正面："界面好看，对国内用户是完美平替"，"丝滑的感觉"
- 负面："实际上的 skill 还是源于 clawhub"、"发挥传统艺能"（讽刺拿来主义）
- Top 3 全是小红书 Skills，被认为"腾讯有点急了"

### 对 SkillNav 的影响

| 维度 | 判断 |
|------|------|
| 直接威胁 | 低。SkillHub 服务 OpenClaw/"龙虾"生态，SkillNav 聚焦 Claude Code/Codex |
| 定位差异 | SkillHub = 加速安装工具；SkillNav = 策展媒体（资讯+评测+导航） |
| 间接利好 | 大厂入场教育市场，"Skills"概念搜索量上升 |
| 可借鉴 | Top 50 精选策略、8 大分类命名、"提示词安装"交互 |

### 战略判断

腾讯 SkillHub 验证了"中文 Skills 社区"有需求，但它只是 CDN 加速层没有内容护城河。SkillNav 的"Wirecutter for AI Agent Skills"定位（精选 + 编辑点评 + 资讯 + 周刊）与之完全差异化。

**关键决策**：SkillNav 应该做 OpenClaw 精选（50-100 个，带编辑点评），覆盖腾讯 SkillHub 没做到的编辑深度。数据从 SkillsMP API / skills.sh 获取，不需要直接对接 ClawHub 或 SkillHub。

---

## 附录 C：展示升级详细方案

### Skills 卡片升级（skill-card.tsx）

```
变更清单：
1. [移除] SecurityBadge — 全部 unscanned，展示无意义
2. [升级] 来源 Badge — GitFork 图标 → 彩色文字 Badge
   - "Anthropic" 蓝色 / "Vercel" 黑色 / "OpenAI" 绿色 / "OpenClaw" 橙色 / "社区" 灰色
3. [新增] 编辑点评 — editorCommentZh 截断 1 行显示（italic，次级色）
4. [新增] Freshness 角标 — Trending/New/Stale/Archived（右上角小标签）
5. [新增] 最后活跃 — "3 天前更新"（详情页，卡片可选）
```

### MCP 卡片升级（mcp-card.tsx → DB 驱动后重构）

```
变更清单：
1. [保留] 安装命令一键复制 — 这是 MCP 卡片的亮点，竞品也在学
2. [新增] 编辑点评 — editor_comment_zh 截断 1 行
3. [新增] 工具数量 — "5 个工具"（从 tools_count 字段）
4. [新增] Verified 标记 — Smithery verified 数据
5. [新增] Freshness 角标 — 同 Skills
6. [新增] 来源 Badge — "官方"/"Smithery"/"社区"
7. [新增] 详情页 — /mcp/[slug]，包含完整 README、安装配置、工具列表、评论
```

### MCP 列表页升级（mcp-grid.tsx → SSR + DAL）

```
变更清单：
1. [升级] 数据源 — 从 import 静态数据 → DAL 查询 Supabase
2. [新增] 排序 — Stars / 最新 / 编辑推荐
3. [新增] 来源筛选 — 官方 / Smithery / 全部
4. [新增] 分页 — 当数据 >50 时需要
5. [新增] 结果计数 — "共 N 个 MCP Server"（已有，保持）
6. [升级] 搜索 — 客户端 → 服务端（数据量增长后必须）
```

### SkillSource 类型扩展

当前 types.ts 中的 SkillSource：
```typescript
// 当前
type SkillSource = 'clawhub' | 'skills_sh' | 'anthropic' | 'skillsmp' | 'agentskill' | 'manual' | 'curated';

// 升级为
type SkillSource =
  | 'anthropic'       // anthropics/skills 官方
  | 'openai'          // openai/codex 官方
  | 'openclaw'        // OpenClaw 生态精选（SkillsMP API 获取）
  | 'awesome-list'    // awesome-agent-skills / awesome-claude-skills
  | 'skills-sh'       // Vercel skills.sh
  | 'curated'         // 已有的 7 仓库精选
  | 'manual';         // 手动录入

// 来源展示映射
const sourceLabels: Record<SkillSource, { label: string; color: string }> = {
  'anthropic':    { label: 'Anthropic',  color: 'blue' },
  'openai':       { label: 'OpenAI',     color: 'green' },
  'openclaw':     { label: 'OpenClaw',   color: 'orange' },
  'awesome-list': { label: '社区精选',    color: 'purple' },
  'skills-sh':    { label: 'Vercel',     color: 'black' },
  'curated':      { label: '编辑精选',    color: 'amber' },
  'manual':       { label: '手动录入',    color: 'gray' },
};
```
