# SkillNav 内容体验重设计 — 从"千人一面"到"按需取餐"

Status: draft
Date: 2026-03-27

---

## 0. 这份方案要解决什么

SkillNav 已经建成了丰富的内容资产（300+ 文章、168 Skills、4,000 MCP、每日论文导读、5 源 Newsletter 信号），但用户只有一个入口：**一份固定格式的日报**。

同时存在一个独立的"AI 论文采集系统"方案（本地 Python + 文件系统），设计了"发现 → 筛选 → 下载翻译 → 归档"四阶段交互，但与 SkillNav 完全割裂。

**根本矛盾**：内容丰富度在增长，但用户触点没有跟着长。不同用户要的东西不一样，现在所有人拿到同一份菜单。

---

## 1. 用户是谁，要什么

从 content-strategy-v3、paper-channel-proposal、user-journey-ia-analysis 三份文档中提炼，SkillNav 的用户归为**三种消费模式**（不是人群画像，一个人可以在不同时刻切换模式）：

| 模式 | 典型场景 | 核心问题 | 消费时间 | 当前是否满足 |
|------|---------|---------|---------|------------|
| **扫一眼** | 通勤、站会前、等编译 | "今天 AI 圈有什么大事？" | 30 秒 | 基本满足（日报） |
| **找工具** | 开发中遇到需求 | "有没有好用的 XX MCP？" | 2 分钟 | 部分满足（mcp 搜索） |
| **深挖** | 周末、做技术选型、写方案 | "这篇论文/这个方向值得跟吗？" | 10-30 分钟 | 不满足（论文只有导读卡，无法深入） |

**关键洞察**：前两个模式已经有对应产品（daily brief + mcp search），第三个模式完全空白。独立的"论文采集系统"方案本质上就是在补这个空白，只不过用了错误的方式（独立项目、本地文件、脱离 SkillNav 体系）。

---

## 2. 诊断：现有体系哪里断了

### 2.1 日报是单向广播，不是对话

```
generate-daily → LLM 选 5-8 条 → 一份固定日报 → 所有渠道
                                                    ↓
                                        用户只能"看完"或"关掉"
```

用户无法表达"我只关心论文"或"今天的工具推荐没兴趣"。没有反馈回路，编辑无法知道用户真正在意什么。

### 2.2 论文体验断在"导读卡之后"

Paper Channel v3 做了导读卡（M1）和全文翻译脚本（M2），但：
- 导读卡嵌在日报中，用户无法单独获取论文内容
- 全文翻译是编辑侧工具（`translate-paper.mjs`），用户不能自助触发
- 论文没有独立的浏览/发现入口

### 2.3 Skill 只暴露了 20% 数据资产

Skill v2 方案已指出：300+ 文章、168 Skills、12 概念全部不可通过 Skill 搜索。`/skillnav brief` 是唯一高频命令，`mcp` 和 `trending` 使用频率远低于预期。

### 2.4 独立论文系统是体系分裂的信号

"AI 论文采集系统"方案想解决的问题是对的（发现 → 筛选 → 深入 → 归档），但做成独立 Python 项目 + 本地文件系统，等于把 SkillNav 已有的论文数据（HF API、articles 表、translate-paper 脚本）全部重建一遍。

---

## 3. 设计：按需取餐，不是自助餐

### 3.1 核心理念

不做个性化推荐（规模太小），不做独立产品线（违反纪律）。做的是：**把日报从"一份报纸"变成"一个有目录的报纸"，用户可以按板块取自己要的内容。**

类比：不是从"报纸"变成"今日头条"，而是从"一张传单"变成"一份有分栏的报纸"。编辑权不变，用户只多了"翻到我关心的版面"的能力。

### 3.2 内容板块化

把日报的内容拆成独立可寻址的板块：

| 板块 | 内容 | 来源 | 频率 |
|------|------|------|------|
| **headline** | 今日头条 + 为什么重要 | 编辑漏斗 | 0-1/天 |
| **news** | 值得关注的行业动态 | Newsletter + 文章池 | 3-5/天 |
| **papers** | 论文导读卡 + 态度标签 | HF Daily Papers | 3-5/天 |
| **tools** | 新发现/趋势工具 | Skills + MCP 数据库 | 0-3/天（有则推，无则省略） |

关键约束：
- 板块由编辑定义，不由用户创建
- 每个板块独立可查询，也可以合并为完整日报
- 板块数量固定（4 个），不做"自定义板块"

### 3.3 Skill 交互重设计

现在：
```
/skillnav brief    → 完整日报（全部内容混在一起）
```

改为：
```
/skillnav brief              → 完整日报（默认，向后兼容）
/skillnav brief papers       → 只看论文板块
/skillnav brief news         → 只看行业动态
/skillnav brief tools        → 只看工具推荐
```

**为什么是子参数而不是独立命令？**
- 保持 5 命令上限（skill v2 的设计约束）
- `brief` 是日报的入口，板块是日报的子集，语义清晰
- 用户不需要记新命令，只需要知道 `brief` 后面可以加过滤词

### 3.4 API 适配

现有 `/api/skill/query?type=brief` 返回完整日报 JSON。扩展为：

```
GET /api/skill/query?type=brief              → 完整日报（向后兼容）
GET /api/skill/query?type=brief&section=papers  → 只返回论文板块
GET /api/skill/query?type=brief&section=news    → 只返回动态板块
GET /api/skill/query?type=brief&section=tools   → 只返回工具板块
```

返回结构保持不变（ParsedBrief），只是 `highlights` 和 `papers` 按 section 过滤。零破坏性变更。

### 3.5 论文深挖路径（吸收"论文采集系统"的核心交互）

"论文采集系统"的四阶段交互（发现 → 筛选 → 下载翻译 → 归档）是对的，但应该融入 SkillNav 而不是独立建设。

在 Skill 中的体验：

```
用户: /skillnav brief papers
  → 看到 3-5 篇论文导读卡（每篇 ~300 字 + 态度标签）

用户: "2603.23483 这篇展开讲讲"
  → Skill 调用 /api/skill/query?type=paper&id=2603.23483
  → 如果已有全文翻译 → 返回摘要 + 关键发现 + 工具关联
  → 如果没有翻译 → 返回 arXiv 原文摘要 + "完整中文翻译: skillnav.dev/articles/{slug}"

用户: "最近有什么 agent 相关的论文？"
  → Skill 调用 /api/skill/query?type=paper&q=agent
  → 返回最近 7 天含 "agent" 关键词的论文导读卡
```

对应的 API 扩展：

```
GET /api/skill/query?type=paper&id=2603.23483    → 单篇论文详情
GET /api/skill/query?type=paper&q=agent          → 论文搜索（最近 7 天）
```

**数据来源**：不建新表。论文导读卡已经存在于 daily_briefs.content_md 中（`## 论文速递` section）。全文翻译存在于 articles 表（translate-paper.mjs 的产出）。API 只需要查询已有数据。

### 3.6 论文采集系统的正确归宿

| 原方案功能 | 归入 SkillNav 的方式 | 备注 |
|-----------|-------------------|------|
| L1 每日发现 | generate-daily.mjs 已做（HF API top 10） | 不需要重建 |
| L2 人工筛选 | Admin UI 审日报时选择 | 已有 |
| L3 按需翻译 | translate-paper.mjs | 已实现 |
| L4 分类归档 | articles 表 + tags | 已有基础设施 |
| 本地文件系统 | 不需要 | Supabase 已覆盖 |
| Python 脚本 | 不需要 | Node 脚本已覆盖 |

**结论**：独立论文采集系统方案可以归档。它想解决的问题在 SkillNav 体系内已经有 80% 的基础设施，剩下 20% 就是本方案的"论文深挖路径"。

---

## 4. 工具板块：从被动推送到主动发现

当前日报中没有"工具推荐"板块。tools 数据存在但没有进入日报编辑漏斗。

### 4.1 工具信号来源

| 信号 | 数据 | 判断依据 |
|------|------|---------|
| 新入库工具 | sync-articles + tool-intelligence | 过去 24h 新增且 quality_score >= 7 |
| 趋势工具 | weekly_stars_delta | 周增 stars > 50 |
| 编辑精选 | editor_comment_zh | 有编辑点评的工具 |

### 4.2 生成逻辑

在 generate-daily.mjs 的 LLM prompt 中新增 tools section：

```json
"tools": [
  {
    "slug": "mcp-server-name",
    "name": "XXX MCP Server",
    "why": "一句话推荐理由",
    "install": "npx @xxx/mcp-server"
  }
]
```

约束：0-3 个/天。大部分日子是 0。有值得推荐的才推，没有就不推。克制即品牌。

---

## 5. 实施计划

### Wave 0：修复基础层（产品走查发现的阻塞项）

产品走查（2026-03-27）发现 Wave 1-3 的前提条件不成立：

**问题 1：parse-brief.ts 解析质量差**
- brief API 返回的 10 条 highlights 中 8 条 summary/comment 为空字符串
- papers 数组为空（`parsePaperSection()` 找不到 `## 论文速递` section）
- 根因：content_md 的实际格式与解析器的正则不匹配（bullet 格式 vs `###` 块格式混用）
- 修复：对照实际 content_md 重写解析逻辑，确保 highlights 和 papers 全部正确提取

**问题 2：日报没有公开页面**
- `/daily` 和 `/daily/2026-03-26` 均返回 404
- `src/app/daily/` 路由不存在，日报仅在 admin 后台可见
- RSS 链接的 `skillnav.dev/daily/2026-03-26` 指向 404
- 修复：新建 `/daily` 列表页 + `/daily/[date]` 详情页

**问题 3：trending 完全不可用**
- `/api/skill/query?type=trending` 返回空数组
- `weekly_stars_delta` 数据从未回填，阈值 >= 5 无数据命中
- 修复：降低阈值或回填数据（可延后到 Wave 3）

| # | 任务 | 文件 | 阻塞 |
|---|------|------|------|
| 0.1 | 修复 parse-brief.ts 解析（highlights + papers） | `src/lib/parse-brief.ts` | Wave 1 |
| 0.2 | 新建 /daily 公开页面（列表 + 详情） | `src/app/daily/` | 所有日报链接 |
| 0.3 | 首页导航栏添加"日报"入口 | `src/components/layout/` | 日报可发现性 |

### Wave 1：板块化 API + Skill 适配（1 session）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | parse-brief.ts 扩展 section 过滤 | `src/lib/parse-brief.ts` | getLatestBrief 新增 section 参数 |
| 2 | API route 支持 section 参数 | `src/app/api/skill/query/route.ts` | `?type=brief&section=papers` |
| 3 | SKILL.md 更新 brief 子参数 | `skills/skillnav/SKILL.md` | brief + brief papers/news/tools |
| 4 | 同步 GitHub + 本地验证 | skillnav-skill repo | 测试全部子命令 |

### Wave 2：论文查询 API（1 session）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | API: type=paper 查询 | `src/app/api/skill/query/route.ts` | 按 id 查单篇 + 按 q 搜索 |
| 2 | 论文数据提取函数 | `src/lib/parse-brief.ts` 或新建 `src/lib/paper-query.ts` | 从 daily_briefs 提取论文卡片 |
| 3 | SKILL.md 新增 paper 命令路由 | `skills/skillnav/SKILL.md` | 复用 brief papers 的格式规则 |
| 4 | 验证：Skill 中查论文 | 本地测试 | `/skillnav paper agent` |

### Wave 3：工具板块 + 完整日报升级（1 session）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1 | generate-daily prompt 增加 tools section | `scripts/generate-daily.mjs` | 查询趋势工具，传入 LLM context |
| 2 | assembleMarkdown 增加工具板块 | `scripts/generate-daily.mjs` | `## 工具雷达` section |
| 3 | parse-brief.ts 解析工具板块 | `src/lib/parse-brief.ts` | 新增 BriefTool 接口 |
| 4 | 各 publisher 适配工具板块 | `scripts/lib/publishers/*` | 微信/X/知乎/小红书格式 |

### 不做的事

| 提议 | 为什么不做 |
|------|----------|
| 用户偏好存储 | 安装量 < 50，过早优化 |
| 独立 /papers 页面 | 4/23 评估前不建新页面（paper-channel 纪律） |
| 本地论文文件系统 | Supabase + articles 表已覆盖 |
| 独立 Python 采集脚本 | Node 脚本 + HF API 已覆盖 |
| AI 论文采集系统独立项目 | 归档，核心交互融入 SkillNav |
| 推送频率/语言偏好 | 当前只有中文，一天一次，没有选择空间 |

---

## 6. 命令体系终态

```
/skillnav brief              今日 AI 日报（完整版）
/skillnav brief papers       只看论文导读
/skillnav brief news         只看行业动态
/skillnav brief tools        只看工具推荐
/skillnav mcp <keyword>      搜索 MCP Server
/skillnav trending           本周热门工具
/skillnav paper <id|keyword> 查论文详情或搜索论文
/skillnav search <keyword>   全站搜索（Skill v2）
/skillnav update             更新到最新版本
```

命令数从 3 → 5（加 paper + search），brief 子参数不算独立命令。符合 Skill v2 的"5 命令上限"约束。

---

## 7. 成功标准

| 指标 | 当前 | 1 个月后 |
|------|------|---------|
| brief 子命令使用率 | 0（不存在） | papers 占 brief 调用 > 20% |
| paper 命令使用频率 | 0（不存在） | > 10 次/周 |
| 论文点击率（go/paper） | 有数据但未分析 | CTR > 5% |
| 日报打开率 | 未追踪 | 建立基线 |
| 独立论文系统需求 | 1 份方案待实施 | 归档，需求被吸收 |

---

## 8. 与现有方案的关系

| 方案 | 关系 |
|------|------|
| Skill v2 (skill-v2-proposal.md) | 兼容。search + update 命令保留，paper 命令是新增 |
| Paper Channel v3 (paper-channel-v3.md) | 演进。M1/M2 产出直接被板块化 API 消费 |
| AI 论文采集系统 (方案书) | 吸收后归档。核心交互融入 SkillNav，不再独立建设 |
| Content Strategy v3 | 落地。渐进披露 + 编辑漏斗的 Skill 端实现 |
| Content Distribution Spec | 补充。Skill 渠道从"单一 brief"变成"板块化 brief" |
