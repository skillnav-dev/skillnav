# Handoff — SkillNav
<!-- Updated at 2026-03-11 session 26 -->

## Objective
中文开发者的 AI 智能体工具站（Skills · MCP · 实战资讯），当前阶段：内容战略 2.0 实施中

## Completed

### 第 1 轮：基础设施 + 内容管线（session 1-3, ~Day 1-2）
- 站点上线 skillnav.dev（Cloudflare Workers + OpenNext）
- 168 精选 Skills（7 个源仓库）+ 6,447 ClawHub Skills（hidden）
- 13 RSS 源自动同步管线，~514 篇文章
- 长文翻译策略（分块/摘要）
- 内容治理 DB schema（quality_tier, is_hidden, status, relevance_score）
- Umami 分析 + GSC 验证
- About 页面 + 文章图片 fallback

### 第 2 轮：Admin 后台 + 安全修复 + 文章评分（session 4, Day 3）
- Phase 0 安全修复（draft 泄露防护 + 版权声明）
- Phase 1 Admin 后台（login/dashboard/articles/edit，1,278 行）
- 文章 LLM 评分完成（126 published / 95 draft / 293 hidden）

### 第 3 轮：生产环境配置 + 部署（session 5, Day 3）
- ADMIN_PASSWORD 配置到 Cloudflare Workers secret + GitHub Actions secret
- CI/CD 部署成功，Admin 后台生产环境可用

### 第 4 轮：战略重定位 + 信息源终审（session 6, Day 3）
- 3 轮深度调研（并行 Agent）：竞品分析 + KOL/内容源 + 开发者需求/市场
- 定位锁定: "中文开发者的 AI 智能体工具站（Skills · MCP · 实战资讯）"
- 数据源决策: 移除 5 源 + 新增 3 源，最终 11 个自动源
- 信息源终审文档: `docs/plans/content-sources-audit.md`

### 第 5 轮：数据源重构 + MCP 板块 + 全站升级（session 7, Day 4）
- **数据源重构**: 移除 5 源，新增 2 源（ai-coding-daily/thenewstack），收紧关键词
- **存量清洗 SQL**: migration 创建
- **分类升级**: article_type 新增 `review`
- **MCP 导航板块**: `/mcp` 页面 + 18 个精选 MCP Server
- **全站定位更新** + **原创文章脚本** `create-cornerstone-article.mjs`

### 第 6 轮：数据库清洗 + CI 修复 + 代码样式统一（session 8, Day 5）
- **SQL migrations 执行**: `20260306_add_review_type.sql` + `20260306_cleanup_articles.sql` 已在 Supabase 执行
- **清洗结果**: 49 published / 42 draft / 439 hidden（从 ~126 published 清洗至 49）
- **新源验证**: ai-coding-daily + thenewstack dry-run 通过
- **CI 修复**: sync-articles workflow `timeout-minutes: 30→45`，source 列表描述更新
- **LLM JSON 解析加固**: `sanitizeJsonString()` 修复 `Bad escaped character` 解析失败
- **代码块样式统一**: CodeBlock 加 `not-prose` + `font-mono` + `text-[13px]`，inline code 加 pill 样式

### 第 7 轮：内容管道规范制定（session 9, Day 7）
- **角色升级**: 战略合伙人（CEO/COO/CTO/CMO/CIO）+ 主编（Editor-in-Chief）
- **内容管道规范**: `docs/specs/content-pipeline-spec.md`（278 行），定义采集→质量管理→分发三段式管道
- **关键决策**: 去掉 `news` 类型精简为 3 类 / 双维度评分 / GitHub/TheNewStack 降级观察

### 第 8 轮：About 页面重构 + 资讯列表页布局优化（session 10, Day 7）
- **About 页面内容重写**: 痛点卡片 + 解法卡片 + 内容管线流程 + 数据概览 + CTA
- **资讯卡片瘦身**: 去掉封面图，改纯文字卡片，3 列网格
- **工具栏增强**: 新增排序 + 信源 Select 下拉

### 第 9 轮：Phase 1 类型精简 — news 重分类（session 11, Day 8）
- **LLM 逐篇分类**: 23 篇 published news → tutorial(2) / analysis(14) / guide(7)
- **DB 约束更新**: `article_type IN ('tutorial', 'analysis', 'guide')` — news/review 已移除
- **最终状态**: 49 published（35 analysis + 7 guide + 7 tutorial）、0 legacy types

### 第 10 轮：Skills 列表页布局优化（session 12, Day 8）
- **工具栏压缩**: 搜索/平台/排序聚合成一行（与资讯页同模式）
- **排序/平台 UI**: Button → Select 下拉

### 第 11 轮：GitHub 开源项目导航页方案设计（session 13, Day 8）
- **全面调研**: 6 轮并行 Explore Agent
- **方案修订**: 推翻静态 TS → Supabase DB + GitHub API 自动维护
- **方案文件丢失**: `.claude/plans/sequential-knitting-hejlsberg.md` 未提交，需重建

### 第 12 轮：内容战略 2.0 — 全面复审 + 战略重构（session 14, Day 8）
- **四维并行调研**: 内部现状审计 + 竞品内容策略 + 管线技术评估 + 市场趋势
- **竞品分析**: mcp.so / ai-bot.cn / HelloGitHub / 36氪 / 机器之心 / toolai.io
- **战略转型决策**: 从翻译聚合站 → 有编辑立场的策展品牌
- **内容战略 2.0 确认**: 混合模式 + RSS 降级为素材库 + 周刊底线承诺
- **5 份文档产出**: 4 份调研报告 + 1 份战略方案（共 981 行）

### 第 13 轮：UI/UX 全面复审 + 重构方案（session 15, Day 8）
- **四维并行调研**: 内部 UI/UX 审计 + 竞品 UI/UX 分析 + 标杆站点设计拆解 + 用户旅程 & 信息架构
- **内部审计**: 整体 6.5/10，61 个问题（2 P0 / 17 P1 / 42 P2）
- **重构方案 v1**: 6 个 Phase，~18h 总工作量
- **5 份文档产出**: 4 份调研报告 + 1 份重构方案（共 2,511 行）

### 第 14 轮：设计规范制定（session 16, Day 8）
- **设计规范 v1**: `docs/specs/design-system.md`（431 行）
- **4 份文档产出**: 3 份调研 + 1 份设计规范（共 1,314 行）

### 第 15 轮：UI/UX 重构 Phase 0-2 实施（session 17, Day 8）
- **Phase 0 信任修复**: StatsBar 真实数据 + 文章日期格式化
- **Phase 1 体验基线**: 导航高亮 + 整卡可点击 + 卡片精简 + 视觉一致性
- **Phase 2 首页重构**: Hero 新文案 + HeroSearch + EditorialHighlights 占位 + 3 列文章
- **22 个文件变更，4 个新文件**

### 第 16 轮：UI/UX 重构 Phase 3-4 实施（session 18, Day 8）
- **Phase 3 导航重构**: 去掉"首页"，保留 MCP，新增"周刊" → 5 项导航 (Skills | MCP | 周刊 | 资讯 | 关于)；`/weekly` + `/weekly/[slug]` 路由创建（空状态占位）；Hero CTA 新增"阅读周刊"；清理 `"/"` 死代码分支
- **Phase 4 转化漏斗**: 根 layout 添加 Toaster；`InlineNewsletterCta` 内联订阅框（文章页版权声明后）；`ShareButtons` 分享按钮 (Twitter/X + 复制链接 toast)（文章标题旁 + 文末）；文章↔Skills 双向交叉引流（文章页显示"相关工具" + Skill 页显示"相关资讯"）
- **8 个文件变更，4 个新文件** (weekly/page.tsx, weekly/[slug]/page.tsx, inline-newsletter-cta.tsx, share-buttons.tsx)

### 第 17 轮：UI/UX 重构 Phase 5 — 代码清理与打磨（session 19, Day 8）
- **CopyButton 提取**: 3 处重复 → `src/components/shared/copy-button.tsx` 共享组件
- **formatNumber 提取**: 4 处重复 → `src/lib/utils.ts` 统一函数
- **删除废弃文件**: `skill-install.tsx`（已被 `skill-install-tabs.tsx` 替代）
- **SectionHeader 多态**: 新增 `as` prop，列表页标题用 h1（SEO 标题层级修复）
- **Newsletter "即将推出"**: 去掉假表单，改为静态提示，组件不再是 client component
- **Giscus 评论配置**: 创建 `skillnav-dev/discussions` 公开仓库，配置 repoId/categoryId，安装 Giscus App
- **Select 移动端响应式**: `w-[140px]` → `w-full sm:w-[140px]`（skills-toolbar + articles-toolbar）
- **净减 206 行代码**（+92 / -298），19 个文件变更

### 第 18 轮：内容战略 2.0 数据层（session 19b, Day 8）
- **DB 迁移**: `content_tier` + `series` + `series_number` 列已添加
- **TypeScript 类型**: `ContentTier` / `ArticleSeries` 类型已定义
- **DAL 支持**: 查询函数已支持 content_tier/series 过滤

### 第 19 轮：周刊生成工具链（session 20, Day 8）
- **主脚本**: `scripts/generate-weekly.mjs`（~210 行）— 查询文章 → 按源分类 → LLM 编者按 → Markdown 组装 → 入库
- **CLI 参数**: `--dry-run` / `--week-of YYYY-MM-DD` / `--limit N` / `--no-llm`
- **GitHub Actions**: `.github/workflows/generate-weekly.yml` — 每周一 UTC 04:00 自动触发
- **操作文档**: `docs/plans/weekly-pipeline.md`（184 行）
- **Bug 修复**: `callLLM` 导出 + Supabase NULL 处理 (`.neq` → `.or`) + 时区安全 `formatDate`
- **npm script**: `generate:weekly` 添加到 package.json
- **Dry-run 验证通过**: 14 篇文章成功组装为周刊第 1 期预览

### 第 20 轮：GitHub 导航页方案设计 + 实施（session 21, Day 8）
- **三路并行调研**: 现有文档分析 + 站点架构模式分析 + 竞品深度调研（HelloGitHub / GrowingGit / OSSInsight / Trendshift / skills.sh / SkillsMP 等 8 个竞品）
- **设计方案 v2**: `docs/plans/github-nav-design.md`（233 行），推翻 session 13 的 DB 方案
- **4 个关键决策**: 静态 TS 数据 / 场景导向 7 分类 / 不做详情页 / 不加导航入口
- **实施完成**: 4 个新文件，1,025 行代码
  - `src/data/github-projects.ts` — 50 个精选项目 + 类型定义（Agent 框架 10 / AI 编码 8 / AI 应用平台 8 / RAG 6 / 模型推理 6 / 开发者工具 6 / 精选资源 6）
  - `src/components/github/github-card.tsx` — 项目卡片（名称、stars、中文描述、编辑点评、标签）
  - `src/components/github/github-grid.tsx` — 客户端搜索 + 分类过滤 + 网格布局
  - `src/app/github/page.tsx` — 页面入口（Static 预渲染）
- **构建验证通过**，`/github` 路由生成为静态页面

### 第 21 轮：移动端设计规范 + 修复 + 课程导读文章（session 22, Day 9）
- **设计规范补充**: `docs/specs/design-system.md` 新增 §7.4 移动端模式（M1-M5: 溢出防御 / 横滚渐变 / 触控目标 / 等宽文本 / 双列响应式）
- **移动端修复 6 项**:
  - Fix 1-2: MCP/Skill/Article 卡片添加 `overflow-hidden`（M1）
  - Fix 3: `ScrollFade` 共享组件 + Skills/Articles toolbar 集成（M2）
  - Fix 4: CopyButton `h-7 w-7` → `h-9 w-9` 触控目标（M3）
  - Fix 5: 搜索清除按钮 `p-2` 热区扩大（M3）
  - Fix 6: 安装命令 `text-xs sm:text-sm` 响应式字号（M4）
- **课程导读文章**: 「吴恩达 × Anthropic Agent Skills 课程完全指南」
  - 7,400 字中文，12 分钟阅读，editorial tier
  - 逐课导读 + SkillNav Skill 推荐 + SKILL.md 格式速查 + 3 条学习路径
  - 插入 Supabase 为 draft 状态，slug: `andrew-ng-agent-skills-course-guide`
  - 脚本: `scripts/create-course-guide.mjs`
- **热门课程监测调研**: DeepLearning.AI Sitemap 差量方案 + The Batch RSS + 多平台覆盖策略

### 第 22 轮：课程导读文章质量复审 + Admin 发布修复（session 23, Day 9）
- **课程导读文章质量复审**:
  - 第 1-2 课缺失问题：在「逐课导读」开头加过渡说明
  - 新增「社区反馈与编辑补充」段落：Skills vs 脚本判断 + 课程盲区补充 + 中文学习资源
  - 结尾声明调整："不翻译课程内容" → "不只是翻译课程内容"
  - 内容来源：DeepLearning.AI 社区论坛调研 + Datawhale/B站 中文资源
- **Admin 发布按钮修复（两层问题）**:
  - Bug 1: `status-toggle-form.tsx` 无 try/catch，server action 失败时 UI 静默 → 加 sonner toast
  - Bug 2: `SUPABASE_SERVICE_ROLE_KEY` 未设为 Cloudflare Worker secret → 线上回退 anon key → RLS 拦截写入但 Supabase 不报错 → 看起来成功实际未更新
  - Fix: `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` + `updateArticleStatus` 检查返回行数
- **课程导读文章已通过本地脚本发布**: status=published（Admin 线上修复部署中）

### 第 23 轮：内容分发规范制定（session 24, Day 9）
- **四路并行调研**: 微信公众号 + 小红书 + X/Twitter + 竞品分发策略/其他平台
- **调研覆盖**: 6 个竞品标杆 (机器之心/HelloGitHub/阮一峰/idoubi/少数派/即刻) + 8 个分发平台
- **分发规范 v1**: `docs/specs/content-distribution-spec.md`（373 行），定义平台选择/内容适配/SOP/自动化管线
- **4 份调研报告**: `docs/research/distribution/` 目录，共 612 行
- **关键决策**:
  - 第一梯队: X + 公众号 + 知乎 + 即刻（立即启动）
  - 第二梯队: 掘金 + CSDN（后期自动同步）
  - 不做: 小红书（严禁外链）、B站（视频成本过高）
  - 运营模型: "一鱼多吃" + 阮一峰极简 + idoubi Build in Public
  - 公众号发布规则更正: "发布"功能不限次数（关闭群发通知），群发每天 1 次

### 第 24 轮：内容运营管线规范制定（session 25, Day 10）
- **四路并行调研**: 管线配置审计 + CI 故障分析 + RSS 发布时间分布 + 运营最佳实践
- **CI 故障根因确认**: 3/5-3/7 timeout (旧 30min) + 3/8 GPT Proxy 503 宕机 + 3/9 恢复
- **RSS 时间分析**: 8/10 源集中 UTC 16:00-22:00 (CST 00:00-06:00) 发布，与中国读者高峰错位
- **运营规范 v1**: `docs/specs/content-operations-spec.md`（293 行），定义端到端时序编排
- **3 份调研报告**: `docs/research/content-ops-*.md`，共 238 行
- **关键决策（待审批）**:
  - 双时段采集: UTC 22:15 (CST 06:15) + UTC 10:15 (CST 18:15)，赶读者早/晚高峰
  - 健康检查移至 UTC 23:45（晨间采集后验证）
  - 周刊生成移至周一 UTC 00:00（晨间采集后生成）
  - LLM Fallback: GPT → DeepSeek 自动降级
  - Per-source 10min 超时，防单源拖垮全局
  - 成功也发 Slack 通知（摘要）
  - 每日 09:00 CST 固定编辑审核窗口（15-30min）
  - 三阶段实施: Phase 1 改 cron / Phase 2 可靠性 / Phase 3 审核增强
- **DB 现状盘点**: 50 published / 57 draft / 463 hidden，最新入库 3/9，今日 (3/10) 未采集
- **文章发布建议**: 12 篇 3 月 draft 待审核，推荐 3 篇（Markdown vs MCP / Anthropic×Mozilla / Cursor 第三时代）

### 第 25 轮：竞情分析 + SEO sitemap 精简（session 26, Day 11）
- **腾讯 SkillHub 竞情分析**: skillhub.tencent.com 上线（3/9），13K skills + WorkBuddy Agent + CLI 工具
  - 判断: 直接威胁中低（企业/运营用户 vs 我们的开发者），间接利好（教育市场 + 搜索量上升）
  - 应对: 不改战略方向，蹭热度产内容 + 继续深耕编辑差异化
- **GSC 索引报告分析**: 69 已索引 / 282 未索引，269 "已发现-尚未编入索引" + 9 个 404 + 4 "已抓取-未索引"
- **SEO sitemap 精简**: 950 → 224 URL，只给 Google 看精品
  - `getSitemapSkills()`: `source='curated'` 过滤，168 精选 skills
  - `getSitemapArticles()`: published articles，真实 `published_at` 时间戳
  - 补全 /mcp, /weekly, /about 静态页
  - `lastModified` 从 `new Date()` 改为 DB 真实时间戳
- **4 文件变更**: sitemap.ts + skills.ts + articles.ts + index.ts
- **已部署 + GSC 已重新提交 sitemap**

## In Progress
无（内容运营规范待审批，审批后进入 Phase 1 实施）

## Next Actions

### 内容运营管线 Phase 1（审批后立即执行）
1. **改 cron 配置**: sync-articles 双时段 + health-check/weekly 联动调整
2. **添加成功通知**: Slack success summary
3. **手动触发一次 sync**: 补上 3/8-3/10 缺失内容

### 内容运营管线 Phase 2（下次会话）
4. **LLM Fallback**: scripts/lib/llm.mjs 增加 provider 降级链
5. **Per-source timeout**: sync-articles.mjs 单源 10min 超时
6. **Workflow 重试**: nick-fields/retry@v3

### 内容分发启动
7. **蹭腾讯 SkillHub 热度** — 横评文章 "腾讯入局 AI Skills，开发者该怎么选？"
8. **注册 X 账号 + 开通 Premium** ($8/月)
9. **注册微信公众号** — 企业订阅号 + 认证
10. **注册知乎账号 + 即刻账号**
11. **X 支柱 Thread x3** — 冷启动内容准备

### 内容战略 2.0 继续
11. **首期周刊正式生成** — `npm run generate:weekly`
12. **EditorialHighlights 接入** — 首页组件接入周刊/编辑文章数据
13. **文章发布**: 审核 12 篇 3 月 draft，选 3 篇 published

### 后续优化
14. **Newsletter 接入 Resend API** — 当前为"即将推出"占位
15. **GitHub 页面内链引流** — 从首页/文章页引流到 `/github`
16. **n8n 自动化管线** — 文章 → X 推文草稿自动生成

## Risks & Decisions
- **UI/UX 重构方案 v1 全部完成**: Phase 0-5 已实施
- **设计规范 v1 已生效 + 移动端模式补充**: §7.4 M1-M5
- **导航决策变更**: 原方案 MCP 降至 Footer，用户决定保留 MCP 在主导航 → 5 项导航
- **EditorialHighlights 占位**: 硬编码 `hasEditorial = false`，return null，待周刊数据层就绪后接入
- **Newsletter 改为"即将推出"**: 不再欺骗用户，待 Resend API 接入后恢复表单
- **Giscus 用 General 分类**: GraphQL API 不支持创建自定义分类，用默认 General
- **文章↔Skills 交叉引流**: 基于关键词匹配，精度有限，未来可改为 mentioned_skills[] 标注
- **内容战略 2.0 已确认**: 混合模式 + RSS 降级为素材库 + 内容策略先行
- news 类型已完全移除，DB 约束锁定为 tutorial/analysis/guide
- 周刊是底线承诺，评测是 bonus
- **callLLM 已导出**: `scripts/lib/llm.mjs` 的 `callLLM` 从内部函数改为 `export`，供周刊脚本复用
- **Supabase NULL 陷阱**: `.neq("col", "val")` 会排除 NULL 行，需用 `.or("col.is.null,col.neq.val")`
- **GitHub 导航页决策 v2**: 推翻 session 13 的 DB 方案，改用静态 TS 数据（同 MCP 模式）；场景导向 7 分类；不做详情页直链 GitHub；不加导航入口
- **内容路线**: "先做再精"节奏正确，但不模仿 datawhalechina 翻译路径；我们的差异化是 168 个真实 Skill 数据 + 实战视角
- **Cloudflare Worker secrets 补全**: `SUPABASE_SERVICE_ROLE_KEY` 已添加（之前只有 `ADMIN_PASSWORD`）
- **Supabase RLS 静默失败**: update 被 RLS 拦截时返回 `{data:[], error:null}`，不抛错。必须检查返回行数
- **内容分发规范 v1 已确认**: 4 平台第一梯队 (X/公众号/知乎/即刻)，年成本 ~¥1,000，6-8h/周
- **小红书暂不做**: 严禁外链 + 图片制作成本高，无法形成引流闭环
- **B站不做**: 视频制作成本过高，1人团队不可持续
- **不维护社群**: 参考阮一峰经验，社群维护成本远大于收益
- **公众号发布规则**: 群发每天 1 次 + "发布"（关闭群发通知）不限次数，均可被算法推荐
- **内容运营规范 v1 待审批**: 双同步 + LLM fallback + 每日编辑 SOP + 三阶段实施
- **腾讯 SkillHub 不改变我们战略**: 他们打企业/运营市场，我们打开发者编辑精选，不正面竞争
- **SEO 策略: 少而精**: sitemap 只提交高质量页面，不追求 URL 数量；2 周后观察 GSC 索引率变化
- **CI 故障连续 4 天 (3/5-3/8)**: 根因已确认 — timeout 旧设置 + GPT Proxy 503，3/9 恢复
- **双同步理由**: US 源高峰 UTC 16:00-22:00 = CST 00:00-06:00，需 UTC 22:15 采集赶 08:00 早高峰
- **GitHub Actions 月预算**: 双同步后 ~1,182 min/月，免费额度 2,000 min，安全
- **编辑审核节奏**: 09:00 CST 固定窗口，2-3 篇/天 published，底线承诺周刊

## Verify
- `test -f docs/specs/content-operations-spec.md && echo OK` — OK
- `curl -s https://skillnav.dev/sitemap.xml | grep -o '<loc>' | wc -l | tr -d ' '` — 224
- `npm run build` — 构建通过

## Modified Files (Session 26)
- `src/app/sitemap.ts` — 重写，精选 skills + published articles + 6 静态页 + 真实时间戳
- `src/lib/data/skills.ts` — 新增 `getSitemapSkills()`（source=curated 过滤）
- `src/lib/data/articles.ts` — 新增 `getSitemapArticles()`（published + published_at 时间戳）
- `src/lib/data/index.ts` — 导出两个新 sitemap 函数

## Document Inventory
| 文件 | 状态 | 行数 | 说明 |
|------|------|------|------|
| `HANDOFF.md` | 更新 | ~280 | 交接文档 |
| `CLAUDE.md` | 未变 | ~150 | 项目规范 |
| `docs/specs/content-operations-spec.md` | **新增** | 293 | 内容运营管线规范 v1（待审批） |
| `docs/specs/content-distribution-spec.md` | 未变 | 373 | 内容分发规范 v1 |
| `docs/specs/design-system.md` | 未变 | 485 | 设计规范 v1 + §7.4 移动端模式 |
| `docs/specs/ui-ux-redesign-v1.md` | 未变 | 338 | UI/UX 重构方案 v1（全部完成） |
| `docs/specs/content-strategy-v2.md` | 未变 | 289 | 内容战略 2.0 最终方案（已确认） |
| `docs/specs/content-pipeline-spec.md` | 未变 | 278 | 内容管道规范 v1（生效中） |
| `docs/plans/github-nav-design.md` | 未变 | 233 | GitHub 导航页设计方案 v2（已实施） |
| `docs/plans/weekly-pipeline.md` | 未变 | 184 | 周刊生成工具链操作文档 |
| `docs/research/content-ops-*.md` | **新增** | 238 | 3 份运营调研报告 |
| `docs/research/distribution/*.md` | 未变 | 612 | 4 份分发渠道调研报告 |
| `docs/research/*.md` | 未变 | ~3.7K | 11 份调研报告 |
| `docs/plans/content-sources-audit.md` | 未变 | 248 | 信息源终审决策 |
| `docs/github/*.md` | 未变 | 877 | 4 个 GitHub 项目榜单源数据 |
