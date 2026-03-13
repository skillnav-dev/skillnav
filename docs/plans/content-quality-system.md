# SkillNav 内容体系与展示一体化方案

> 状态：已批准 | 创建日期：2026-03-13 | 编号：PLAN-007

## 背景与问题

SkillNav 定位为 "Wirecutter for AI Agent Skills"，但当前内容离 Wirecutter 标准差距明显：

1. **分类体系不合理** — 52 个 Skills（17%）落入"其他"；Skills 和 MCP 使用两套割裂的分类；分类基于关键词匹配而非用户场景
2. **数据质量参差** — alirezarezvani 的 10 个 Skills 描述为 "Tier: POWERFUL"；awesome-list 的 35 个无 tags 无有效描述
3. **平台字段错误** — SKILL.md 已是 17+ 平台通用标准，但我们标注 93.7% 为 Claude 专属
4. **UI 展示割裂** — Skills 和 MCP 零交叉引用；首页无 MCP 区块；平台下拉框无实际价值
5. **缺少编辑策展** — 除 S-tier 外无编辑判断，本质是数据库 dump

## 调研支撑

四项并行调研（2026-03-13）：

| 决策点 | 调研结论 | 决策 |
|--------|---------|------|
| 统一 /tools 页 vs 分开 | Smithery（直接竞品）也分开；1:15 数量差会淹没 Skills | **保持分开** |
| 导航改为"工具发现" | GitHub Marketplace、Figma 经验——本质不同的物件顶层分流 | **保持 Skills / MCP 分开** |
| 统计条保留 vs 删除 | 展示数字="全和多"；不展示="精和权威"；SkillNav 是混合模式 | **合并为一个大数字融入 Hero** |
| 场景导航 vs 分类导航 | Raycast Store 按功能域分；VS Code 混合分类；Vercel 用例优先 | **共享场景分类，内部各自筛选** |
| Skills 跨平台兼容性 | SKILL.md 是统一标准，17+ 平台原生支持，不存在平台锁定 | **删除平台下拉框** |

---

## 一、统一分类体系

### 设计原则

- **用户意图导向** — "我想做 X"，不是"这属于 Y 技术"
- **Skills + MCP 共用一套** — 用户在两个页面看到一致的分类语言
- **10 个分类，零"其他"** — 归不进去是编辑的问题，不是算法的
- **中英双语 slug** — 为 i18n 和 SEO 做好准备

### 分类定义

| 分类 | slug | 用户场景 | 覆盖举例 |
|------|------|---------|---------|
| 编码与调试 | `coding` | "帮我写代码、审查代码、修 bug" | code review, TDD, linter, debug, 框架最佳实践 |
| AI 与智能体 | `ai` | "帮我调用模型、编排 Agent、做 RAG" | LLM API, prompt engineering, RAG, embedding |
| 数据与存储 | `data` | "帮我操作数据库、处理文件、分析数据" | SQL, file system, ETL, data science, 文档提取 |
| 搜索与获取 | `search` | "帮我从外部获取信息" | web search, crawling, RSS, API 聚合, research |
| DevOps | `devops` | "帮我部署、监控、管基础设施" | CI/CD, Docker, AWS, monitoring, runbook |
| 内容与创意 | `content` | "帮我生成内容" | 写作, 翻译, PPT, 设计, 视频, 文档 |
| 效率与工作流 | `productivity` | "帮我自动化日常工作" | 任务管理, Excel, 日历, 笔记, 文件操作 |
| 安全与合规 | `security` | "帮我保护代码和系统安全" | 漏洞扫描, secrets, 审计, 加密, 合规 |
| 平台与服务 | `platforms` | "帮我连接某个具体平台" | Slack, GitHub, Stripe, Supabase, email |
| 行业场景 | `vertical` | "特定行业/角色的专用工具" | 金融分析, 简历优化, 教育, 法律, 3D/游戏 |

### 旧分类迁移映射

| 旧分类 | 新分类 | 变化 |
|--------|--------|------|
| 编码开发 (63) | 编码与调试 | 微调命名 |
| AI 智能体 (39) | AI 与智能体 | 微调 |
| 数据处理 (20) | 数据与存储 | 扩大（吸收 MCP 的文件系统+数据库） |
| 搜索研究 (5) | 搜索与获取 | 扩大（吸收爬虫、API 聚合） |
| 运维部署 (20) | DevOps | 改名 |
| 内容创作 (38) | 内容与创意 | 微调 |
| 效率工具 (37) | 效率与工作流 | 微调 |
| 安全监控 (12) | 安全与合规 | 微调 |
| 平台集成 (15) | 平台与服务 | 微调（吸收 MCP 的 Web & API） |
| 其他 (52) | 重新归类 | 逐个审核分配到以上 9 个 + 行业场景 |

---

## 二、内容质量标准

### Skill 最低发布标准

| 字段 | 要求 | 当前达标率 |
|------|------|-----------|
| `name` | 清晰的英文名 | ~95% |
| `name_zh` | 准确的中文名 | 0%（Phase 2 生成） |
| `description` | >=20 字的英文功能描述（非 "Tier: POWERFUL"） | ~80% |
| `description_zh` | >=30 字的中文描述 | 100%（已完成） |
| `category` | 10 选 1，不允许"其他" | 83%（Phase 1 修） |
| `tags` | >=1 个标签 | ~60% |
| `install_command` | 可直接复制的安装命令 | 0%（Phase 2 生成） |
| `github_url` | 有效链接 | ~95% |

**低于标准 -> status=draft，不对外展示。** 宁可减少展示数量，不降低信息质量。

### MCP 最低发布标准

| 字段 | 要求 |
|------|------|
| `name` / `display_name` | 清晰名称 |
| `description_zh` | >=30 字中文描述（A-tier 以上必须） |
| `category` | 10 选 1（统一分类） |
| `tools` | 有 tools JSONB 数据（知道它能做什么） |

---

## 三、平台字段处理

### 调研结论

SKILL.md 已是行业统一标准，被 17+ 平台原生支持（Claude Code、Codex、Gemini CLI、Cursor、GitHub Copilot、Windsurf、Aider 等）。不存在"平台锁定"。

| 维度 | SKILL.md（Skills） | AGENTS.md（项目规则） |
|------|-------------------|---------------------|
| 作用 | 模块化可复用能力 | 项目级编码规范 |
| 加载 | 按需/懒加载 | 始终在上下文中 |
| 可移植 | 跨项目、跨平台分发 | 跟随仓库 |
| 类比 | npm 包 | .editorconfig |

### 决策

1. **删除平台下拉筛选器** — 93.7% 标 Claude 是数据错误，实际都是通用的
2. **`platform` 字段清理** — 全部设为 `["universal"]` 或清空
3. **卡片去掉平台徽章** — 改为详情页展示"已验证平台"列表（可选）
4. **安装命令多平台化** — 详情页 Tab 展示各平台安装方式：
   - Claude Code: `claude skill add --url github.com/xxx`
   - Codex CLI: `codex skill install github.com/xxx`
   - Gemini CLI: `gemini skill add github.com/xxx`

---

## 四、页面展示设计

### 信息架构

```
导航：Skills | MCP | 周刊 | 资讯 | 关于          <- 保持不变

Skills 列表页 ─┐
               ├─ 共用统一的 10 个场景分类按钮    <- 横向连接
MCP 列表页   ─┘

Skill 详情页 ──── 底部推荐配套 MCP Server         <- 交叉引用
MCP 详情页   ──── 底部推荐配套 Skills              <- 交叉引用
```

调研依据：GitHub Marketplace（Actions vs Apps）和 Figma（Plugins vs Widgets）的经验——物件有本质差异时，顶层按类型分流、内部共享分类是行业标准。

### 首页重构

```
首页（新）
|
|-- Hero
|   标题: 中文开发者的 AI 工具生态指南
|   副标题: 5,000+ AI 开发工具收录 - 每日更新     <- 统计条融入 Hero
|   CTA: 浏览工具 / 阅读周刊 / 最新资讯
|
|-- 场景快捷入口（新增）
|   10 个分类图标按钮，点击进入对应分类的 Skills 或 MCP 页
|
|-- 编辑精选
|   左大卡: 本周最佳工具（Skill 或 MCP，编辑评语）
|   右小卡: 本周值得关注（2-3 个，混合 Skill + MCP + 文章）
|
|-- 精选 Skills（保留，3 卡）
|
|-- 精选 MCP（新增，3 卡）                         <- 补上缺失的 MCP 展示
|
|-- 最新资讯（保留，3 卡）
|
|-- 周刊 CTA + 订阅
```

关键变化：
- 统计条不再占独立区块，融入 Hero 副标题（一个合并大数字）
- 新增场景快捷入口（分类图标）
- 新增精选 MCP 区块
- 编辑精选混合展示工具和文章（当前只有文章）

### Skills 列表页调整

```
工具栏变化：
- 删除: 平台下拉框（Claude / Codex / Universal）
- 保留: 搜索框、排序、Tab（全部/精选/最新）
- 更新: 分类按钮换为统一 10 分类
```

### MCP 列表页调整

```
工具栏变化：
- 更新: 分类按钮换为统一 10 分类（与 Skills 页一致）
- 保留: 搜索框、排序、编辑精选快捷按钮
```

### 详情页调整

**信息层级重排**（Skill 详情页）：

```
当前: 名称 -> 描述 -> 安装命令 -> SKILL.md 全文 -> 编辑评测 -> 评论
优化: 名称 -> 编辑一句话 -> 描述 -> 安装命令（多平台 Tab）
      -> 配套推荐（MCP/Skills）-> 编辑评测 -> SKILL.md 文档 -> 评论
```

- 编辑一句话评语提到最前面（核心价值）
- 安装命令改为多平台 Tab
- 新增配套推荐区块（交叉引用）
- SKILL.md 全文移到靠后（参考文档，非决策依据）

---

## 五、编辑工作流

```
新 Skill/MCP 进入
    |
    v
[算法层] 自动分类 + 质量评分 + 描述生成
    |
    v
达到最低发布标准？
    |-- 是 -> status=published（B-tier 自动上线）
    |-- 否 -> status=draft（等待编辑补全或丢弃）
    |
    v
[编辑层] 周度审核 draft 池
    |-- 值得收录 -> 补全字段 -> published
    |-- 不值得   -> hidden
    |
    v
[精选层] S/A-tier 提升
    |-- 编辑评语 + 使用场景 + 配套推荐
```

核心思想：算法做 80% 的脏活（自动分类、自动描述），编辑做 20% 的判断（质量门槛、精选推荐）。质量门槛是刚性的——不达标就不上线。

---

## 六、执行计划

### Phase 1：分类统一 + 数据治理

目标：数据干净——零"其他"、统一分类、低质量下线、平台字段修正。

| # | 任务 | 类型 | 产出 |
|---|------|------|------|
| 1.1 | 确认 10 个统一分类名称和边界 | 内容 | 本文档（已完成） |
| 1.2 | 更新 `categorize.mjs` 关键词库 + 新增"行业场景"+"搜索与获取" | 脚本 | `scripts/lib/categorize.mjs` |
| 1.3 | 修复 alirezarezvani 描述截取（跳过 "Tier:" 前缀） | 脚本 | `scripts/sync-curated-skills.mjs` |
| 1.4 | 修复 awesome-list 解析（提取 README 章节标题作为分类信号） | 脚本 | `scripts/lib/sources/awesome-skills.mjs` |
| 1.5 | Skills 全量重分类（301 个 -> 零"其他"） | 数据 | DB 更新 |
| 1.6 | MCP 首次分类（4,616 个，复用 categorize 逻辑） | 数据 | DB 更新 |
| 1.7 | 低质量条目下线（描述空/无意义 -> draft） | 数据 | DB 更新 |
| 1.8 | `platform` 字段清理（全部 universal 或清空） | 数据 | DB 更新 |
| 1.9 | Skills 页 + MCP 页换用统一 10 分类按钮 | UI | toolbar 组件更新 |
| 1.10 | 删除平台下拉筛选器 | UI | toolbar 组件更新 |

### Phase 2：数据补全 + 首页增强

目标：每条 published 工具有完整中文信息，首页同时展示 Skills 和 MCP。

| # | 任务 | 类型 | 产出 |
|---|------|------|------|
| 2.1 | Skills `name_zh` 批量生成（301 个） | 数据 | DB 更新 |
| 2.2 | Skills `install_command` 构造（多平台） | 数据 | DB 更新 |
| 2.3 | Skills `tags` 补全（空标签用 LLM 补 3-5 个） | 数据 | DB 更新 |
| 2.4 | MCP A-tier `description_zh`（438 个） | 数据 | DB 更新 |
| 2.5 | Anthropic 官方 17 个 Skills 平台标注修复 | 数据 | DB 更新 |
| 2.6 | 首页新增精选 MCP 区块 | UI | `featured-mcp.tsx` |
| 2.7 | 首页统计条融入 Hero 副标题 | UI | `hero-section.tsx` |
| 2.8 | 首页新增场景快捷入口 | UI | `scenario-shortcuts.tsx` |
| 2.9 | 卡片去掉平台徽章 | UI | `skill-card.tsx` |
| 2.10 | 详情页安装命令改为多平台 Tab | UI | `skill-install-tabs.tsx` |

### Phase 3：编辑策展 + 交叉推荐

目标：Wirecutter 级体验——编辑策展、交叉推荐、场景驱动。

| # | 任务 | 类型 | 产出 |
|---|------|------|------|
| 3.1 | Top 30 Skills 编辑评语（使用场景 + 同类对比） | 内容 | DB 更新 |
| 3.2 | Top 50 MCP 编辑评语 | 内容 | DB 更新 |
| 3.3 | Skill <-> MCP 配套关系建立（人工匹配） | 数据 | DB 新表或字段 |
| 3.4 | 详情页新增交叉推荐区块 | UI | 详情页组件 |
| 3.5 | 详情页编辑评语前置 | UI | 详情页布局调整 |
| 3.6 | 首页编辑精选区重构（混合 Skill + MCP + 文章） | UI | `editorial-highlights.tsx` |
| 3.7 | 场景指南文章（"2026 最佳 AI 编码工具" 系列） | 内容 | 新文章 |

---

## 七、SEO 影响

| 变化 | 影响 | 处理 |
|------|------|------|
| 分类名称变更 | URL query 参数变化 `?category=编码与调试` | 旧参数做兼容重定向 |
| `/skills` 路由 | 不变 | 保留 |
| `/mcp` 路由 | 不变 | 保留 |
| `/skills/[slug]` 详情页 | 不变 | 保留所有已索引 URL |
| `/mcp/[slug]` 详情页 | 不变 | 保留 |
| 分类落地页（未来） | 可选 `/skills?category=coding` 独立页 | Phase 3 考虑 |

---

## 八、数据现状快照（2026-03-13）

### Skills 分类分布（301 published）

| 分类 | 数量 | 占比 |
|------|------|------|
| 编码开发 | 63 | 21% |
| 其他 | 52 | 17% <- 目标清零 |
| AI 智能体 | 39 | 13% |
| 内容创作 | 38 | 13% |
| 效率工具 | 37 | 12% |
| 运维部署 | 20 | 7% |
| 数据处理 | 20 | 7% |
| 平台集成 | 15 | 5% |
| 安全监控 | 12 | 4% |
| 搜索研究 | 5 | 2% |

### Skills 来源分布

| source | 数量 | "其他"数 | "其他"率 |
|--------|------|---------|---------|
| curated | 168 | 16 | 10% |
| awesome-list | 116 | 35 | 30% <- 最差 |
| anthropic | 17 | 1 | 6% |

### 平台字段分布

| platform | 数量 | 说明 |
|----------|------|------|
| `["claude"]` | 282 | 实际都是 universal |
| `[]` (空) | 17 | Anthropic 官方，漏标 |
| `["codex"]` | 2 | openai/codex 仓库 |

### "其他"分类误分根因

| 根因 | 影响数量 | 来源 |
|------|---------|------|
| 描述以 "Tier: POWERFUL" 开头 | 10 | alirezarezvani |
| 无 tags + 短描述 | 35 | awesome-list (VoltAgent) |
| 描述为空/无意义 | 3 | daymade, levnikolaevich |
| 关键词库未覆盖 | 4 | giuseppe (NestJS/Zod/Clean Arch) |

---

## 附录：调研参考来源

- Smithery.ai — MCP + Skills 分离导航
- Glama.ai — MCP 按资源类型分页
- mcp.so — 统一框架 + Tab 切换
- Product Hunt — 统一目录 + 分类系统
- GitHub Marketplace — Actions vs Apps 类型分流 + 场景子分类
- Raycast Store — 统一入口 + 功能域分类
- VS Code Marketplace — 统一市场 + 22 分类
- Chrome Web Store — 半分离模型
- Wirecutter — 编辑权威，无 stats bar
- G2.com — 海量数字 + 企业 logo 信任
- Agent Skills Specification (agentskills.io) — SKILL.md 开放标准
- AGENTS.md (agents.md) — Linux Foundation 项目级指令标准
