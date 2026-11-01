# 竞品网站目录

SkillNav 长期跟踪的竞品清单：每家的网址、类别、为什么盯、可借鉴的功能。这是一份活文档，竞品有变化就直接改这里，并在文末「更新记录」加一行。

- **最近核对**：2026-10-31（规模数字为各站首页自述；技术层信息来自 [rea](https://github.com/morluto/rea) 6.8.0 抓包 + 前端 bundle 分析）
- **完整分析与升级方案**：[SkillNav 竞品调研与迭代升级方案](https://claude.ai/artifact/LvRrKXLXuGvDQh69vtBZyz)
- **历史调研**：[2026-03-08 竞品内容策略](2026-03-08-competitive-content-analysis.md)、[2026-03-08 竞品 UX](2026-03-08-competitive-ux-analysis.md)

## 分级规则

| 级别 | 含义 | 复查频率 |
|------|------|----------|
| **必盯** | 定位重合、会直接抢用户，或定义了行业标尺 | 每月过一遍首页和新功能 |
| **可跟** | 有单点值得学，或是我们的上游数据源 | 每季度过一遍 |

类别：`中文目录`（中文 Skills/MCP 导航）· `全球目录`（英文 Skills/MCP 目录或市集）· `官方`（厂商官方入口）· `资讯`（日报/周刊）· `平台`（托管、注册表）

## 总览

| 级别 | 站点 | 类别 | 一句话 | 威胁 |
|------|------|------|--------|------|
| 必盯 | [AgentHub](https://myagenthub.cn/) | 中文目录 | 中文 MCP + Skills，生成多客户端配置，最像直接对标 | 高 |
| 必盯 | [SkillGuide](https://skillguide.ai/zh) | 中文目录 | Skills + MCP + Plugins 中英双语精选索引，已变现 | 高 |
| 必盯 | [AskSkill](https://askskill.ai/) | 中文目录 | 按职业发现 Skill/MCP，强调一键装到各客户端 | 中 |
| 必盯 | [SkillsMP](https://skillsmp.com/) | 全球目录 | 全球规模 Skills 市集，内容与排序标尺 | 低 |
| 必盯 | [skills.sh](https://skills.sh/) | 全球目录 | Vercel Agent Skills 目录与安装量热度榜 | 中 |
| 必盯 | [MCP.so](https://mcp.so/) | 全球目录 | 老牌社区 MCP 目录，SEO 强 | 中 |
| 必盯 | [Claude Marketplace](https://claude.com/marketplace/plugins) | 官方 | Anthropic 官方插件 / Skills 入口 | 中 |
| 必盯 | [PulseMCP](https://www.pulsemcp.com/) | 全球目录 + 资讯 | MCP 目录 + 生态周刊，最接近我们想做的形态 | 低 |
| 必盯 | [AI 码力日报](https://radar.zsyvoid.com/daily/) | 资讯 | 中文 AI 编程圈日更，和每日译讯抢早间注意力 | 中 |
| 可跟 | [AI 开发者日报](https://ainews.liduos.com/) | 资讯 | 汇总 X / Reddit / Discord 讨论的中文日报 + 播客 | 低 |
| 可跟 | [AI 简报](https://go2-ai.com/) | 资讯 | 模型厂商与编程 Agent 一手动态，每条标来源 | 低 |
| 可跟 | [Glama](https://glama.ai/) | 全球目录 + 平台 | 官方 MCP Registry 超集，评分方法论公开 | 低 |
| 可跟 | [Smithery](https://smithery.ai/) | 平台 | MCP 托管 + 认证平台 | 低 |
| 可跟 | [MDSkill](https://mdskill.dev/) | 全球目录 | Skills 目录，每条显示 0–100 安全分 | 低 |
| 可跟 | [ClawHub](https://clawhub.ai/) | 平台 | OpenClaw 生态 Skills / 插件注册表 | 低 |
| 可跟 | [Flowy Skills](https://www.flowy.sh/marketplace/skills) | 全球目录 | 5.6 万 Skills 索引，详情页展示 SKILL.md 原文 | 低 |

## 必盯（9）

### AgentHub

- **网址**：https://myagenthub.cn/
- **类别**：中文目录
- **规模**：MCP 51,184 · Skills 10,246 · 提示词 1,018
- **为什么盯**：定位和我们几乎重合，数量和功能都在前面；但没有评测和"该不该装"的结论。
- **核心打法**：为 Cursor / Claude Code / VS Code / Windsurf 等生成配置 JSON；场景选型；热度榜；AI 日报；国内 MCP 专区（飞书、钉钉、高德、Trae）。
- **技术与接口**：Next.js App Router，国内机房自建（ICP 备案）。公开 `GET /api/search`，数据源为官方 MCP Registry、mcp-cn、ClawHub、SkillsMP、GitHub；另有 `llms.txt`、收录徽章 `/badge/{id}`。详情页覆盖 13 个客户端（含 Trae、通义灵码、CodeBuddy、Cherry Studio），标注 JSON 语法校验通过，附国内 npm 镜像排障 FAQ。安全等级（A+）+ 0–100 分。
- **可借鉴**：多客户端配置生成器；国内生态专区；收录徽章；公开搜索 API；国内镜像排障 FAQ。

### SkillGuide

- **网址**：https://skillguide.ai/zh
- **类别**：中文目录
- **规模**：Skills 28,204 · MCP 13,944 · Plugins 427，每周更新
- **为什么盯**：同样讲"精选"，且已用 Pro 会员变现，是我们走编辑路线最直接的对手。
- **核心打法**：AI 增强搜索；"来源已核验"标签；99 个技能包写明适用场景与授权边界；装机必备；Pro 会员本地一键安装。
- **技术与接口**：Vite SSR + Cloudflare。条目字段含 `qualityScore`、`riskLevel`、`testedAt` 等，有自动化收录流水线；本地助手 `skillguide-helper.py` 做一键安装。
- **可借鉴**：技能包 / 装机必备；权限边界说明；来源核验标签；付费模型可行性的佐证。

### AskSkill

- **网址**：https://askskill.ai/
- **类别**：中文目录
- **规模**：61,864 项（MCP 58,805 · Skills 3,059）
- **为什么盯**：广而浅，但用职业入口吸引非开发者，扩大了用户面。
- **核心打法**：8 个职业入口（开发、运维、产品、设计、市场…）；"复制提示词即安装"到 Claude Code / Codex / Cursor；Bundles；AdSense。
- **技术与接口**：Next.js ISR + Cloudflare，无公开 API。支持 npx / bunx / pnpm 三种运行器；Cursor 一键深链 `cursor://anysphere.cursor-deeplink/mcp/install`；每条有 LLM 生成的安全评估段落。
- **可借鉴**：按职业发现；用提示词代替安装命令；Cursor 深链；运行器切换；安全评估段落。

### SkillsMP

- **网址**：https://skillsmp.com/
- **类别**：全球目录
- **规模**：约 1.7 万 Skills
- **为什么盯**：全球最大 Skills 市集之一，是内容规模和排序的标尺，也是我们的潜在数据源。
- **核心打法**：自动同步 GitHub（≥2 star 才收录）；语义搜索；有 `marketplace.json` 即标可一键装。
- **技术与接口**：Cloudflare 人机验证拦截无头浏览器，rea 未测到。
- **可借鉴**：把收录门槛写成公开规则；语义搜索。

### skills.sh

- **网址**：https://skills.sh/
- **类别**：全球目录
- **规模**：累计约 156 万次安装
- **为什么盯**：Vercel 出品，定义了"按真实安装量排序"的热度榜标准，用户会拿来对比。
- **核心打法**：`npx skills add owner/repo` 兼容约 20 个 Agent；安装量榜（总榜 / 24h / Hot）；Audits 安全页；Official / Packs。
- **技术与接口**：跳转到 www.skills.sh，本次网络白名单未放行，rea 未测到。
- **可借鉴**：用安装量排序；直接复用其 CLI 作为 Skills 安装命令；Packs。

### MCP.so

- **网址**：https://mcp.so/
- **类别**：全球目录
- **为什么盯**：最老牌的社区 MCP 目录，SEO 强；首页也挂了 `/grok-bot` 栏目，和我们的 Grok Bot 页正面重叠。
- **核心打法**：扩展到 Remote Servers、Clients、CLI、Skills、Agents、Collections、Feed；提交审核；广告位。
- **技术与接口**：ShipAny 模板（Vite）+ Cloudflare。条目字段含 `installCount`、`viewCount`、`qualityScore`；`/api/sponsor-ads`、`/api/guest-posts` 为变现接口；13 个客户端配置（含 Kiro、Goose、LM Studio）；另有 `/rankings`。
- **可借鉴**：Remote Servers 单列；Collections 合集；排行榜页。

### Claude Marketplace

- **网址**：https://claude.com/marketplace/plugins
- **类别**：官方
- **规模**：530 个插件
- **为什么盯**：用户会直接去官方装；它定义了"官方可信"。我们要做它的中文解读层。
- **核心打法**：一键安装；"Anthropic verified"徽章；开放提交。
- **技术与接口**：Next.js + Cloudflare，静态页无业务 API；安装命令统一为 `claude plugin install <名>@claude-plugins-official`。
- **可借鉴**：认证标签体系；挑 Top 30 插件做中文选型页。

### PulseMCP

- **网址**：https://www.pulsemcp.com/
- **类别**：全球目录 + 资讯
- **为什么盯**："目录 + 周刊"正是我们想做的形态，是英文侧的标杆。
- **核心打法**：「Agentic Loop」周刊；子注册表 API（带热度、安全、兼容性富化）；用例库；统计页。
- **技术与接口**：Cloudflare 人机验证拦截，rea 只拿到首页外壳；官网禁止抓取，资料来自第三方。
- **可借鉴**：目录 + 周刊组合；可申请其 API 作数据源（优先级排在公开接口之后）。

### AI 码力日报

- **网址**：https://radar.zsyvoid.com/daily/
- **类别**：资讯
- **为什么盯**：中文 AI 编程圈日报，每天 8:00 发布，和我们的每日译讯抢早间注意力。
- **核心打法**：每期 3–4 条要点；GitHub 热门 + 工具 + 3 分钟小教程；RSS。不标来源、无搜索。
- **技术与接口**：纯静态 GitHub Pages + Cloudflare，AdSense，无 API。
- **可借鉴**：固定发布时间点；"3 分钟教程"格式。

## 可跟（7）

| 站点 | 类别 | 为什么跟 | 可借鉴 |
|------|------|----------|--------|
| [AI 开发者日报](https://ainews.liduos.com/) | 资讯 | 汇总 X / Reddit / Discord 讨论的中文日报，文章 + 播客，RSS + 邮件 | 日报配音频版；邮件订阅 |
| [AI 简报](https://go2-ai.com/) | 资讯 | 跟踪模型厂商和编程 Agent 一手动态，附中英摘要、原始链接和价格对比表；前端读取 `coverage.json`，公开 59 个信源的抓取与核验状态 | 每条标来源；按对象（Claude Code、Codex…）筛选；价格表带核验日期；区分"正式更新 / 预告 / 观点"；日报头部写"今日覆盖 N 个源" |
| [Glama](https://glama.ai/) | 全球目录 + 平台 | 官方 MCP Registry 超集（11.3 万 MCP、121 万 tool）；公开 OpenAPI `/api/mcp/openapi.json` | 健康检查 + 安全审计 + 公开评分方法论；可作候选数据源 |
| [Smithery](https://smithery.ai/) | 平台 | MCP 托管 + 认证平台，2.7 万+ MCP，按调用量展示；MCP Proxy 已于 2026-10-31 停用 | 关注其作为同步源的变动 |
| [MDSkill](https://mdskill.dev/) | 全球目录 | 3.25 万 Skills，自家 CLI `npx mdskill add`，兼容 `npx skills add` | 每条显示 0–100 安全分 + 安装量 |
| [ClawHub](https://clawhub.ai/) | 平台 | OpenClaw 生态注册表，签名清单 + 审核发布；skillnav Skill 的发布渠道；公开 `GET /api/v1/skills`（含 downloads、installs、stars） | 扫描器 + LLM 审查给出 CAUTION 建议；可作候选数据源 |
| [Flowy Skills](https://www.flowy.sh/marketplace/skills) | 全球目录 | 5.6 万 Skills 索引，每个插件只取一个 Skill 上榜 | 详情页直接展示 SKILL.md 原文；坦白说明测试范围 |

## 借鉴清单进度

来自升级方案的 15 个借鉴功能。S = 1–2 天，M = 3–5 天，L = 1–2 周。上线后把状态改成 PR 编号。

| # | 功能 | 学谁 | 量 | 状态 |
|---|------|------|----|------|
| 1 | 多客户端安装配置 | AgentHub、MCP.so | M | 已上线（PR #19） |
| 2 | Cursor 一键深链 | AskSkill | S | 已上线（PR #19） |
| 3 | npx / bunx / pnpm 切换 | AskSkill | S | 已上线（PR #19） |
| 4 | 国内 npm 镜像排障 FAQ | AgentHub | S | 已上线（PR #35） |
| 5 | 权限边界 / 安全评估段落 | AskSkill、SkillGuide | M | 待合并（#24） |
| 6 | 收录徽章 | AgentHub | S | 已上线（PR #35） |
| 7 | 日报"今日覆盖 N 个源" | AI 简报 | S | 已上线（PR #35） |
| 8 | 装机必备 + 技能包 | SkillGuide、skills.sh | M | 未开始（#27） |
| 9 | 按职业发现 | AskSkill | S | 未开始（#28） |
| 10 | 国内生态专区 | AgentHub | M | 未开始（#29） |
| 11 | 新数据源（官方 Registry、ClawHub、Glama） | AgentHub | L | 未开始（#30） |
| 12 | 自动质量分 | Glama、MCP.so、MDSkill | M | 未开始（#31） |
| 13 | 热度榜（总榜 / 本周新榜） | skills.sh、SkillGuide | M | 未开始（#32） |
| 14 | 公开搜索 API + llms.txt | AgentHub | S | 已上线（PR #35） |
| 15 | 本地一键安装助手 | SkillGuide | L | 未开始（#34） |

**暂不抄**：MCP 托管和网关（Glama、Smithery）、广告位和付费收录（MCP.so、AskSkill）、用户提交。前两项投入重，广告会削弱"精选"的可信度。

## 怎么维护

- 新增或降级一家：改「总览」和对应分级小节，写清为什么。
- 竞品上线新功能：补进该站「核心打法」，值得学就加进「借鉴清单进度」。
- 再跑一轮 rea：更新「技术与接口」，并改「最近核对」日期。

## 更新记录

| 日期 | 变更 |
|------|------|
| 2026-10-31 | 初版：必盯 9 家 + 可跟 7 家，含 rea 技术层结果 |
| 2026-11-01 | 借鉴清单：2、3 标为已上线（PR #19），4–15 关联 issue #23–#34 |
