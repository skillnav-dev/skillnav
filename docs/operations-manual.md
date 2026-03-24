# SkillNav 运营手册

> 版本: 1.1 | 日期: 2026-03-24 | 维护人: CEO + Claude Code
>
> 技术栈、架构、编码规范 → 见 `CLAUDE.md`
> 本手册覆盖**运营 SOP、编辑标准、监控与故障排查**。

## 目录

- [0. 快速开始](#0-快速开始)
- [1. 项目概览](#1-项目概览)
- [2. 内容管线 SOP](#2-内容管线-sop)
- [3. 数据运维 SOP](#3-数据运维-sop)
- [4. CI/CD 调度表](#4-cicd-调度表)
- [5. 编辑标准](#5-编辑标准)
- [6. Skill 分发](#6-skill-分发)
- [7. 监控与指标](#7-监控与指标)
- [8. 故障排查](#8-故障排查)

---

## 0. 快速开始

### 本地开发

```bash
git clone <repo> && cd skillnav
npm install
npm run dev          # http://localhost:3000
```

### 必需环境变量 (`.env.local`)

```bash
# Supabase（所有功能必需）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM 提供商（内容管线必需）
DEEPSEEK_API_KEY=              # sync-articles, generate-daily
GEMINI_API_KEY=                # 以上脚本的 fallback
GPT_API_KEY=                   # backfill, curated-skills（经代理）

# GitHub（元数据刷新必需）
GITHUB_TOKEN=

# 数据分析（本地开发可选）
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
NEXT_PUBLIC_GSC_VERIFICATION=

# 通知（仅 CI 使用）
SLACK_WEBHOOK_URL=
```

### 管理后台

管理后台入口 `/admin/login`，基于 Session Cookie 认证。

### 卡片图生成

需要 `gstack browse`（即 `$B` 变量），安装方式见 gstack 文档。

---

## 1. 项目概览

**SkillNav** — 中文开发者的 AI 智能体工具站 (skillnav.dev)

**核心飞轮**: 资讯翻译(引流) → 工具导航(留存) → Skill 套件(变现)

**当前阶段**: 内容 + 工具基础建设。变现通过 Skill 付费层级（规划中，详见 `skillnav-monetization-roadmap.md`）。

### 1.1 数据规模（近似值）

| 类型 | 规模 | 更新频率 |
|------|------|---------|
| Skills | 150+ 已发布 | 每周（周一） |
| MCP Servers | ~4,000 已发布 | 每周（周一） |
| 文章 | 240+ 已发布 | 每日（2 次采集） |
| 日报 | 持续增长 | 每日 |
| RSS 信源 | 15 个 | 稳定 |
| 信号源 | 5 个 newsletter | 稳定 |

> 精确数据：运行 `node scripts/audit-content.mjs` 或查看 `/admin`。

### 1.2 成本结构

| 项目 | 提供商 | 预估月费 |
|------|--------|---------|
| LLM（翻译、日报） | DeepSeek | ~$5-10 |
| LLM（回填、推理任务） | GPT 经代理 | ~$10-20 |
| LLM（fallback） | Gemini | ~$1-2 |
| 数据库 | Supabase (Free/Pro) | $0-25 |
| 托管 | Cloudflare Workers | $0（免费额度） |
| 域名 | Cloudflare Registrar | ~$10/年 |
| CI/CD | GitHub Actions | 免费额度 |

---

## 2. 内容管线 SOP

### 2.1 文章采集管线

```
15 个 RSS 信源 → 抓取 → 相关性过滤 (L0) → 内容提取 → 翻译 → 质量门控 (L1/L2) → 入库
```

**调度**: 每日 06:15 CST（晨间）+ 18:15 CST（午后）

**LLM**: DeepSeek（主）+ Gemini（fallback）

**命令**:
```bash
node scripts/sync-articles.mjs                          # 全量同步（15 个信源）
node scripts/sync-articles.mjs --source anthropic       # 单信源同步
node scripts/sync-articles.mjs --dry-run --limit 5      # 预览模式
node scripts/sync-articles.mjs --retranslate-published   # 用新 prompt 重译已发布文章
node scripts/sync-articles.mjs --retranslate-drafts      # 重译草稿
```

**质量门控（三层）**:

| 层级 | 方法 | 成本 | 效果 |
|------|------|------|------|
| L0 | 按信源配置关键词白名单 | 零 | 74% 无关内容拦截，0 误杀 |
| L1 | content_zh < 200 字 → draft | 零 | 捕获翻译失败 |
| L2 | LLM 双维度评分：audience_fit + credibility（各 0-10） | ~$0.01/篇 | af≥7 且 cr≥7 → 发布，af<4 或 cr<4 → 隐藏，其余 → 草稿 |

**关键配置**: 在 `scripts/sync-articles.mjs` 中搜索 `RELEVANCE_KEYWORDS` 和 `SOURCES` 数组。`relevanceFilter: null` 的信源（CrewAI、AI Coding Daily）全量接收，其余信源（包括 Anthropic）使用关键词过滤。

### 2.2 日报生成管线

```
信号采集 → 加载文章（24h）→ LLM 编辑漏斗 → 多格式输出 → 入库（draft）
→ 后台预览 → 审批 → 发布（多渠道）
```

**触发**: sync-articles 完成后自动触发（workflow_run）

**LLM**: DeepSeek（主）+ Gemini（fallback）

**命令**:
```bash
# 第 1 步：信号采集（已内置于 generate-daily，也可手动运行）
node scripts/scrape-signals.mjs
node scripts/scrape-signals.mjs --date 2026-03-23

# 第 2 步：生成日报
node scripts/generate-daily.mjs                  # 今日
node scripts/generate-daily.mjs --dry-run         # 预览
node scripts/generate-daily.mjs --hours 48        # 扩展回看窗口

# 第 3 步：在 /admin/daily 审阅并审批
#   - 打开 /admin/daily → 预览各格式
#   - 如需编辑（内联编辑器）
#   - 点击 Approve → 状态变为 'approved'

# 第 4 步：发布
node scripts/publish-daily.mjs                    # 全渠道
node scripts/publish-daily.mjs --channel rss      # 仅 RSS
node scripts/publish-daily.mjs --channel wechat   # 微信版本
node scripts/publish-daily.mjs --channel x        # X 推文版本
```

> 注意: `--skip-signals` 仅在 CI workflow 输入中有效，不是 CLI 参数。

**信号源**（5 个）: TLDR AI、Ben's Bites、The Rundown AI、Superhuman、The Neuron

**输出格式**: Markdown（DB）、微信 HTML、X 推文线程、小红书文案、知乎 Markdown

**卡片图**（手动，需要 gstack browse `$B`）:
```bash
python3 -m http.server 8765 --directory scripts/templates &
$B goto http://localhost:8765/daily-card.html
$B screenshot --clip 0,0,1080,1350 xhs-1.png    # 6 张小红书卡片
$B screenshot --clip 0,8240,1080,608 wechat-header.png
```

**状态流转**: `draft` →（后台审批）→ `approved` →（publish-daily）→ `published`

对未审批的日报运行 `publish-daily.mjs` 会被跳过，必须先审批。

---

## 3. 数据运维 SOP

### 3.1 Skills 管线

| 来源 | 脚本 | 调度 | LLM |
|------|------|------|-----|
| ClawHub | `sync-clawhub.mjs`（经 sync-skills.yml） | 周一 10:00 CST | 无 |
| Anthropic | `sync-anthropic-skills.mjs`（经 sync-skills.yml） | 周一 10:00 CST | 无 |
| 精选仓库 | `sync-curated-skills.mjs` | 周一 09:00 CST | GPT（使用 --evaluate 时） |

**命令**:
```bash
node scripts/sync-curated-skills.mjs --incremental --evaluate  # 增量同步 + LLM 评估
node scripts/govern-skills.mjs --audit                          # 质量审计（仅报告）
node scripts/govern-skills.mjs --apply                          # 应用治理规则
```

### 3.2 MCP Servers 管线

| 来源 | 脚本 | 调度 |
|------|------|------|
| MCP 官方 Registry | `sync-mcp-servers.mjs --source mcp-registry` | 周一 13:00 CST |
| Smithery | `sync-mcp-servers.mjs --source smithery` | 周一 13:00 CST |

**命令**:
```bash
node scripts/sync-mcp-servers.mjs --dry-run                    # 预览
node scripts/govern-mcp-servers.mjs --audit                     # 治理审计
node scripts/govern-mcp-servers.mjs --apply                     # 应用规则
```

**编辑字段保护**: 同步时会剥离 `status`、`quality_tier`、`editor_comment_zh`，防止覆盖人工编辑。

### 3.3 元数据刷新

```bash
node scripts/refresh-tool-metadata.mjs              # 每日：stars、活跃度
node scripts/refresh-tool-metadata.mjs --snapshot    # 每周（周一）：+ 趋势计算
```

**更新字段**: `stars`、`forks_count`、`pushed_at`、`is_archived`、`freshness`、`weekly_stars_delta`、`is_trending`

**活跃度规则**（按顺序检查）:
1. `is_archived = true` → `archived`
2. `pushed_at` 为 null → `stale`
3. 最后更新 < 30 天 → `fresh`
4. 最后更新 30-180 天 → `active`
5. 最后更新 > 180 天 → `stale`

**趋势阈值**: `weekly_stars_delta > 10` 或 `growth_rate > 5%`

### 3.4 数据回填

**调度**: 每日 13:30 CST（sync-mcp-servers 之后）

**LLM**: GPT 经代理（推理任务）

| 任务 | 脚本 | 目标字段 |
|------|------|---------|
| 中文名 | `backfill-skills-name-zh.mjs` | skills.name_zh |
| 标签 | `backfill-skills-tags.mjs` | skills.tags |
| MCP 中文描述 | `backfill-mcp-description-zh.mjs --tier A` | mcp_servers.description_zh |
| 重新分类 | `reclassify-all.mjs --mcp-only --llm-assist` | mcp_servers.category |
| 编辑点评 | `backfill-editor-comments.mjs --type all` | editor_comment_zh（两张表） |

**手动回填**:
```bash
node scripts/backfill-skills-name-zh.mjs --apply --limit 50
node scripts/backfill-mcp-description-zh.mjs --apply --tier B
node scripts/backfill-editor-comments.mjs --type skills --limit 30
```

### 3.5 内容审计

```bash
node scripts/audit-content.mjs                    # Skills 内容质量审计
node scripts/govern-articles.mjs --audit           # 文章状态/评分报告
node scripts/govern-articles.mjs --apply           # 按评分调整状态
```

---

## 4. CI/CD 调度表

### 4.1 设计原则

- **每天只有心跳**（采集 + 健康检查 + 日报），零人工
- **周任务按品类分天**，互不干扰，故障隔离
- **降频即降本** — backfill 每周一次，元数据刷新每周两次（月省 ~1900min CI）
- **周末自治** — 采集和日报照跑，CEO 零投入，周一补审

### 4.2 每日心跳（每天自动运行）

| 时间 CST | 工作流 | 触发方式 | 时长 | LLM |
|---------|--------|---------|------|-----|
| 06:15 | sync-articles（晨间） | cron | 30-60min | DeepSeek |
| 采集后 | generate-daily | workflow_run | 10-15min | DeepSeek |
| 07:45 | health-check | cron | 5min | — |
| 18:15 | sync-articles（午后） | cron | 30-60min | DeepSeek |
| 采集后 | generate-daily | workflow_run | 10-15min | DeepSeek |

### 4.3 周任务分布

| 时间 CST | 周一 | 周二 | 周三 | 周四 | 周五 |
|---------|------|------|------|------|------|
| 08:00 | 周刊生成 | | | | |
| 09:00 | 精选 Skills 同步 | | | | |
| 10:00 | Skills 全量同步 | 元数据刷新 | | | 元数据刷新 |
| 11:00 | 元数据快照(trending) | | | | |
| 13:00 | | | 数据回填 | MCP 同步 | |
| 13:30 | | | | | MCP 治理 |

**周末**：仅每日心跳（采集 + 日报 + 健康检查），无周任务。

### 4.4 CEO 周节奏

| 日 | 投入 | 事项 |
|----|------|------|
| 周一 | ~40min | 日报审批 + 周刊审批 + 清理周末 draft |
| 周二-四 | 各 ~10min | 日报审批 |
| 周五 | ~25min | 日报审批 + 可选周回顾 |
| 周末 | 0 | 采集和日报自动跑，draft 攒着周一处理 |

**总计 ~1.5h/周**。

### 4.5 依赖关系图

```
每日心跳：
  sync-articles (06:15 + 18:15)
    └──[workflow_run]──→ generate-daily（自动触发，含 scrape-signals）
                           └── 写入 daily_briefs（draft）
  publish-daily ← 人工审批 via /admin/daily

周任务（按品类分天，互不干扰）：
  周一: Skills 日   → sync-curated → sync-skills → metadata snapshot
  周二: 元数据刷新  → refresh-tool-metadata
  周三: 数据质量日  → backfill-data（回填周一新增数据）
  周四: MCP 日      → sync-mcp-servers
  周五: 治理日      → govern-mcp-servers + 元数据刷新
```

### 4.6 CI 预算

| 项目 | 优化前 (月) | 优化后 (月) |
|------|-----------|-----------|
| 文章采集 + 日报 | ~900min | ~900min |
| 健康检查 | ~60min | ~60min |
| 元数据刷新 | ~450min | ~120min |
| 数据回填 | ~1800min | ~240min |
| Skills/MCP/治理 | ~360min | ~360min |
| 部署 + 其他 | ~120min | ~120min |
| **合计** | **~3,700min** | **~1,800min** |

GitHub Actions 免费额度 2,000min/月，优化后回到安全范围。

### 4.7 部署

- **触发**: 推送到 main 分支（自动）或 workflow_dispatch
- **步骤**: lint → 类型检查 → OpenNext 构建 + 部署到 Cloudflare Workers
- **超时**: 15 分钟
- **地址**: skillnav.dev

---

## 5. 编辑标准

> 权威来源: `docs/specs/content-strategy-v3.md`

### 5.1 核心原则

- **编辑品牌**: "SkillNav 推荐 = 值得用"
- **克制即品牌**: 宁漏发不误发
- **修源优先**: 62% 质量问题用配置解决，不需要 AI

### 5.2 日报编辑漏斗

| 层级 | 标准 | 日均量 |
|------|------|--------|
| **头条 (0-1)** | 2+ 个 newsletter 提及 或 行业格局变化 | 0-1 条 |
| **值得关注 (3-5)** | 值得 AI 开发者关注，有实操或趋势价值 | 3-5 条 |
| **跳过** | 纯 PR、重复、与 AI 工具生态无关 | 大部分 |

**信号通过率目标**: < 15%（大量输入，严格筛选）

**editor_comment_zh**（编辑点评）是核心差异化。每条 Brief 和 MCP 推荐必须包含编辑点评。格式：blockquote，30-80 字，讲清核心问题 + 差异化优势。

### 5.3 内容质量红线

**不发的情况**（品牌保护）:
- 内容低于 200 字中文（翻译失败）
- 纯广告稿 / PR 新闻稿（audience_fit < 4）
- 事实性错误或过期信息
- Brief 只有 1 条或 0 条高质量内容 → 当天不发，不凑数

### 5.4 角色与决策权

| 角色 | 权限 | 升级路径 |
|------|------|---------|
| CEO（主编） | 日报最终审批权、编辑评论终审、质量体系调参 | — |
| Claude Code | 管线执行、代码变更、数据运维 | 决策类问题问 CEO |
| 未来：运营实习生 | 日常管线执行、社交分发、后台审核 | 质量问题升级 CEO |

---

## 6. Skill 分发

### 6.1 API 端点

**GET** `/api/skill/query?type={brief|mcp|trending}&q={keyword}&limit={1-20}`

| 类型 | 用途 | 关键字段 |
|------|------|---------|
| brief | 今日日报 | headline, highlights, is_fallback |
| mcp | 搜索 MCP 服务器 | PGroonga + ILIKE fallback, editor_comment_zh, install_command |
| trending | 本周热门工具 | skills + mcp 合并按 weekly_stars_delta 排序 |

**缓存**: ISR 5 分钟 | **认证**: 无（anon key）

### 6.2 SKILL.md

位置: `skills/skillnav/SKILL.md`

**安装**:
```bash
mkdir -p ~/.claude/skills/skillnav && curl -sL \
  https://raw.githubusercontent.com/skillnav-dev/skillnav-skill/main/SKILL.md \
  -o ~/.claude/skills/skillnav/SKILL.md
```

**使用**: `/skillnav brief` | `/skillnav mcp <关键词>` | `/skillnav trending`

---

## 7. 监控与指标

### 7.1 Slack 通知

| 事件 | 消息 |
|------|------|
| 采集成功 | `✅ SkillNav 晨间采集完成 +N 篇` |
| 采集失败 | `❌ Sync Articles failed [链接]` |
| 日报失败 | `❌ Generate Daily Brief failed [链接]` |
| 回填失败 | `Backfill Data Quality had failures [链接]` |

### 7.2 关键指标

| 指标 | 查看方式 | 目标 |
|------|---------|------|
| 每日新增文章 | Slack 通知 / `govern-articles.mjs --audit` | 5-15 篇/天 |
| 日报发布 | `/admin/daily` | 工作日 1 篇/天 |
| API 响应时间 | Cloudflare Analytics | < 500ms |
| 网站流量 | Umami 仪表盘 / GA4 | 持续增长 |
| Skill 安装量 | API 日志（待建） | 上线后跟踪 |
| LLM 成本 | 各提供商后台 | 合计 < $30/月 |

### 7.3 每日检查清单

```
[ ] sync-articles: 运行成功（查看 Slack）
[ ] generate-daily: 日报已生成（查看 /admin/daily）
[ ] 日报已审阅并审批
[ ] 已发布到 RSS（自动）+ 社交渠道（手动）
```

### 7.4 每周检查清单（周一）

```
[ ] 所有周一同步任务完成
[ ] refresh-tool-metadata --snapshot: 趋势数据已更新
[ ] 周刊已生成 (generate-weekly)
[ ] 审核草稿文章 /admin/articles
[ ] 查看 health-check 报告
```

---

## 8. 故障排查

### 8.1 已知 Bug（已修复）

| Bug | 根因 | 修复 |
|-----|------|------|
| `is_hidden` 字段不存在 | 应使用 `status !== "hidden"` | 已修复 refresh-tool-metadata.mjs |
| 快照查询静默截断 | 无分页，>1000 行丢失 | 已修复：使用 `fetchAllRows()` |
| `ignoreDuplicates` 阻止更新 | upsert 跳过已有行 | 已修复：设为 false + 剥离编辑字段 |
| 日报时区错误 | `new Date()` 在 CI 返回 UTC | 已修复：显式 CST 转换 |
| Beehiiv CF 403 | GitHub Actions IP 被封 | 已修复：改用首页嵌入 JSON 解析 |

### 8.2 常见问题

| 症状 | 可能原因 | 处理 |
|------|---------|------|
| 过去 24h 无文章 | sync-articles 未运行或信源无新内容 | 手动运行 `sync-articles.mjs` 或 `--hours 48` |
| 日报生成为空 | 回看窗口内无已发布文章 | 检查采集状态，扩展 `--hours` |
| PGroonga 搜索返回 0 | 短查询或分词问题 | 自动 ILIKE fallback 会处理 |
| LLM 翻译超时 | API 配额耗尽 | 自动 fallback 到 Gemini；检查 token 有效期 |
| 部署失败 | TypeScript 或 lint 错误 | 先本地运行 `npm run build` |

### 8.3 紧急流程

**数据库不可达**:
1. 检查 Supabase 控制台状态
2. 验证 `.env.local` 凭证
3. 所有管线会在下次定时运行时自动重试

**LLM 提供商宕机**:
1. DeepSeek → 自动 fallback 到 Gemini（sync-articles、generate-daily）
2. GPT → 无 fallback（backfill、curated-skills）— 次日自动重试
3. 手动切换: `LLM_PROVIDER=gemini node scripts/sync-articles.mjs`

**漏发日报**:
```bash
node scripts/generate-daily.mjs --hours 48    # 扩展回看窗口
# 在 /admin/daily 审阅，然后审批 + 发布
```
