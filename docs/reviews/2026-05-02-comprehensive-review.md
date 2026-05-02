---
title: SkillNav 全面评审报告
date: 2026-05-02
type: comprehensive-review
status: final
reviewers: 10 parallel agents (A1–A10)
---

# SkillNav 全面评审报告（2026-05-02）

## 总分 6.0 / 10

整体处于"基础设施成熟、文档/治理失修、变现真空"的状态。代码层面没有崩坏的部分，但存在 **2 个严重安全红线**、**1 个文档系统级失修**、**1 个战略级变现真空** 需要立即处理。

## 维度雷达

| # | 维度 | 分数 | P0 | P1 | P2 | 关键评价 |
|---|------|-----:|---:|---:|---:|---------|
| A1 | 代码质量 | 6.5 | 1 | 6 | 6 | TS 严格 + lint 干净，但 89 处 type 逃逸口指向同一根因 |
| A2 | 架构 | 6.5 | 0 | 3 | 5 | 分层清晰但 architecture.md 与现实偏差 ~30%，列表页缺 ISR |
| A3 | 内容流水线 | 7.5 | 0 | 5 | 9 | **本次最高分**。11/12 已知 bug 未回归，错误隔离做得好 |
| A4 | 数据库 | 6.0 | 2 | 3 | 6 | PGroonga 是空话，3 张表未开 RLS |
| A5 | 前端 UX | 7.0 | 0 | 4 | 8 | SEO/JSON-LD 全套到位，但 ISR 缺、i18n 是壳、无 next/image |
| A6 | 安全 | **4.0** | 2 | 3 | 5 | **管理员鉴权可绕过 + Next 高危 CVE** |
| A7 | 文档体系 | **4.0** | 2 | 3 | 4 | README 只索引一半 plans，CLAUDE.md 信息过时 |
| A8 | CI / 监控 | 6.5 | 3 | 4 | 6 | 3 个工作流 30 天 0% 通过率 + failover 从未触发 |
| A9 | 战略 Gap | — | — | — | — | 引流 6 / 留存 5 / **变现 1**（PPT debt） |
| A10 | DX | 6.0 | 3 | 5 | 7 | 运维 DX 好，新人 onboarding 4-8 小时 |

---

## 🔴 P0 — 必须立即修复（7 项）

### 1. 管理员鉴权可任意绕过 ⚠️ 严重安全
**A6 #1**。`src/lib/admin-auth.ts:9-15` 与所有 `api/admin/**` 的 `checkAdmin()` 只判断 `!!session?.value`。登录时生成的 token **从未存储或比对**。`Cookie: admin_session=任意字符串` 即可通过所有守卫。

- 关联站点：`src/app/api/admin/daily/[id]/route.ts:5-9`、`…/approve/route.ts:10-14`、`…/publish/route.ts:10-14`、`…/community/[id]/route.ts:5-9`
- 修复：HMAC 签名 cookie 或服务端持久化 token hash 后比对
- 与 #2 复合放大

### 2. 三张表未启用 RLS ⚠️ 与 #1 复合放大
**A4 #2 + A6 #2**（双 Agent 印证）。`daily_briefs`、`brief_publications`、`stars_snapshots` 的 migration 文件（`sql/create-daily-briefs.sql`、`sql/create-stars-snapshots.sql`）**从未** `ENABLE ROW LEVEL SECURITY`。anon key 已打包进 JS bundle —— 任何访客直接打 Supabase REST 即可改 daily_briefs 草稿/发布状态，cookie 守卫只挡 Next 路由。
- 修复：`ALTER TABLE … ENABLE ROW LEVEL SECURITY;` + service-role 写入策略（参考 `pipeline_runs` migration 20260325）
- 需人工 verify 当前 Supabase dashboard 的 RLS 状态

### 3. Next.js 16.1.6 高危 CVE
**A6 #3**。npm audit 报告：HTTP request smuggling (GHSA-ggv3-7p47-pfv8)、SSR DoS (GHSA-q4gf-8mx6-v5v3, CVSS 7.5)、**Server Actions CSRF bypass** (GHSA-mq59-m269-xvcx)。最后一条与 #1 cookie 漏洞复合放大。
- 修复：`npm audit fix --force` → next@16.2.4

### 4. PGroonga 是空话
**A4 #1**。README、CLAUDE.md、operations-manual、所有 Skill v2 spec 都宣称 "PostgreSQL + PGroonga 中文全文搜索"。实际 **0 个 migration 安装扩展，0 个 PGroonga 索引**。`route.ts:68` 的 `.textSearch(..., "websearch")` 静默 fallback 到英文 tsvector，对中文无效。**ILIKE 才是真实搜索引擎**。
- 修复二选一：(a) 真装 PGroonga + 加索引；(b) 改文档承认 ILIKE-only

### 5. docs/README.md 索引严重失修
**A7 #1**。索引：14/25 plans、**1/6 ADRs**、2/20 troubleshooting 文档、9 个 `claude-design/` 全孤儿。CLAUDE.md L70-73 的"先查 docs/adr/ / docs/troubleshooting/"规则因此**失效** —— 入口看不到 80% 的内容。
- 修复：从文件系统重新生成 README（约 1 小时）

### 6. 三个工作流 30 天 0% 通过率（噪声泛滥）
**A8 #1+#2**。
- **Govern MCP Servers**：每周五 7302 errors → exit 1（与 sync-articles 4/29 修掉的 soft-fail 反模式相同）。Slack 已假报警 4+ 次
- **Sync Curated Skills**：每周一被单一 GitHub repo (tree:neondatabase/agent-skills) 的 rate-limit 拖垮整个 job
- 修复：套用 commit 3262ddb 的 "0 applied + N errors 才 exit 1" 模式 + 单 repo 失败用 try/catch 包

### 7. failover-check 阈值 off-by-one（热备从未触发）
**A8 #3**。`DRY_MIN_RUNS=3` + sync-articles 每天 2 次 cron → `data.length < 3` 永远成立 → 永远 `dry: false`。本地 launchd 30 天**运行 720 次，0 次触发**。
- 修复：阈值改 2，或窗口 24h → 36h

---

## 🟡 P1 — 本周修复（高 ROI）

### 8. 列表页缺 `export const revalidate` —— 1102 复发面 ⚡ 跨 Agent 印证
**A2 P1-1 + A5 P1**（双印证）。6+ 个带 searchParams 的列表页直接违反 `react-nextjs.md` 第 4 条（项目自定的硬规则）：
- `src/app/{skills,mcp,articles,en/skills,en/mcp,weekly}/page.tsx`
- `revalidate` 缺失 → CF Worker 每请求 SSR → 已被两次咬伤的同一伤口
- 修复：每文件顶部加一行 `export const revalidate = 300`，5 分钟搞定

### 9. 89 处 Supabase 类型逃逸口（一处根因）
**A1 P0**。69× `from("X" as "skills")` + 16× `(supabase.from(...) as any)` + 4× `.update({...} as never)`。**根因在 `src/lib/supabase/static.ts` 的 client 泛型未正确传 `<Database>`**。
- 修一次根因 → 删除 89 处 cast 与所有 `eslint-disable`
- 半天工作量，最高杠杆

### 10. 文章列表 `select("*")` 拉 120KB content（1102 风险面）
**A4 P1-3**。`getArticleBySlug` 已用 LIGHT_COLS，但 8 个列表 getter 仍 wildcard：`getArticles`、`getLatestArticles`、`getArticlesWithCount`、`getPapersWithCount`、`getEditorialArticles`、`getWeeklyArticles`、`getSeriesArticles`、`getAllSeriesArticles`。`/articles` 列表页可拉 5-10MB。
- 修复：所有列表 getter 套 LIGHT_COLS

### 11. PostgREST `.or()` filter 注入面（11 处）
**A4 P1-2 + A6 P1**（双印证）。用户输入的 `q` 直接拼进 `.or('name.ilike.%${q}%, …')`。逗号/括号是 PostgREST 的语法字符 → 攻击者可追加 filter clause 读取 draft/hidden 行。
- 修复：`escapeIlikePattern` 转义 `[%_,()*]`

### 12. CLAUDE.md 技术栈与现实严重脱节
**A7 #2**。
- L15：写"Next.js 15"，实际 16.1.6
- L17：列 `next-intl`，**package.json 没装**
- 列 Resend、LemonSqueezy、Meilisearch —— 全部未实装
- 修复：标记 `(planned)` 或删除

### 13. paper-radar / translate-paper 不在 pipeline_runs 监控
**A3 P1 #2**。两者都跳过 `runPipeline` wrapper，failover-check + Better Stack 看不到它们的运行状态。卡住的话没人知道。
- 修复：包进 `runPipeline`

### 14. paper-radar Semantic Scholar 重试控制流 bug
**A3 P1 #1**。`paper-radar.mjs:84-122` 的 catch 返回 `[]` 而非 `continue`，非-429 错误永不重试；行 122 的 `return []` 是死代码。

### 15. 社区采集 LLM summary 失败静默
**A3 P1 #3**。`scrape-x/hn/reddit-signals.mjs` 的 `summarizeTweets/summarizeStories/summarizePosts` 失败时返回 `[]`，整批 `content_summary_zh` 变 null，0 重试 0 警报。下游 daily brief 上下文降级。

### 16. `/trending-v2` 平行实现无方案文档 ⚡ 5 Agent 印证
**A1 + A2 + A5 + A7 + A9**（**5 个 Agent 同时点名**）。4-29 commit `a55ba69` 引入完整平行 trending 实现（aside/hero/main-feed 521 行/masthead）+ 一个 852 行 raw CSS 文件（违反"无 raw CSS"硬规则）。无 plan 文档、违反"先架构后细节"。
- 决策：要么明确切换、要么删除、要么写 ADR 解释

### 17. `.env.example` 漏 80% 必需变量
**A10 P0**。脚本读 20+ 环境变量，`.env.example` 仅 ~426 字节。默认 `LLM_PROVIDER=gpt` 需要 `GPT_API_KEY`（自定义代理 gmn.chuangzuoli.com），整个项目仅 `lib/llm.mjs:131,155` 处提及。新人首次跑必坑。

### 18. 列表/admin 反向 import `app/admin/actions`
**A2 P1-3**。10 处 `components/admin/*` import `@/app/admin/.../actions` —— 违反项目自定的 call direction（`app → components → data → lib`）。

### 19. `article-content.tsx` 客户端绕过 wrapper 直拼 PostgREST URL
**A2 P1-2**。`src/components/articles/article-content.tsx:98-110` 直接拼 PostgREST URL 调 Supabase；同时 `app/api/content/[slug]/route.ts` **无人调用**（文档声称在用）。可删除路由或改用 `/api/content/[slug]` 启用 ISR。

### 20. approved-deps.md 漏 5+ 运行时依赖
**A7 #4**。`cheerio` / `katex` / `rehype-katex` / `remark-math` / `pdf-parse` 全部在用但未列入。CLAUDE.md L121 自定的"加依赖必更新 approved-deps"规则未落实。

---

## 🟢 P2 — 机会主义修复（节选）

- **6 个文件 >300 行**（A1）：`lib/data/admin.ts` 867 行（拆 articles/skills/mcp）、`data/github-projects.ts` 835 行、`lib/data/articles.ts` 575 行、`trending-v2/main-feed.tsx` 521 行、`admin/daily/[id]/brief-detail.tsx` 446 行、`api/skill/query/route.ts` 433 行
- **6 个死组件 ~330 行**（A1）：featured-mcp、featured-skills、callout、skill-meta、未用的 shadcn navigation-menu/separator
- **4 个 helper 重复 3+ 次**（A1）：`truncate` / `formatDate` / `isSupabaseConfigured` / `STATUS_BADGE_CLASSES`
- **next.config.ts 完全空**（A6）：无 CSP / HSTS / X-Frame-Options / Permissions-Policy
- **API 无 zod 校验、无 rate limit**（A6）
- **无 next/image**（A5）：article hero 是 LCP 元素，仍用 raw `<img>` 无 priority/srcset
- **0 个 loading.tsx，仅 1 个 error.tsx**（A5）：详情页失败 bubble 到全局
- **i18n 是装饰**（A5）：next-intl 未装但 hreflang 已 advertise → SEO 重复内容信号
- **sitemap 漏 /daily /papers /trending**（A5）
- **MCP categories 查询被 1000 行截断**（A4）：8400 MCP 实际分类不全
- **mcp_servers.github_url 无 UNIQUE**（A4）：与 articles D1 模式不一致
- **scripts 无 `dotenv.config()` 回归**（A10）：MEMORY 已记录的 bug 类，7 个新脚本又中招
- **9 个脚本无 header 注释**（A10）
- **3 个 `update-brief-v*` 重复脚本无 canonical 标记**（A10）
- **deploy.yml 无 post-deploy smoke test**（A8）
- **Reddit signals 30 天 dry，无 escalation**（A8）：仅写 `/tmp/` 日志
- **/trending-v2/trending-v2.css** 852 行违反 Tailwind-only 规则（多 Agent 重复印证）

---

## 📈 战略 Gap（A9）

### 飞轮三段失衡（核心结论）

| 段 | 分数 | 证据 |
|----|----:|------|
| 引流 | 6/10 | SEO 武装齐全 + 4 期日报 + 30+ 论文翻译；但 X 号 6 周无突破，没有任何流量数据被引用决策（盲飞） |
| 留存 | 5/10 | 9 个内容表面已部署；但 USER-01（用户系统）+ SEARCH-01（全站搜索）—— 两个最大留存抓手 —— 全 `planned` |
| 变现 | **1/10** | **CLAUDE.md 宣称 LemonSqueezy，package.json 0 个 payment 依赖，0 个 checkout 路由，0 个 pricing 页**。"Skill 套件变现"是叙事，不是基建 |

### Plan Portfolio：23 个计划

- **13 Go**（含 maintain/close out）
- **5 Hold**：perception-trending（trending-v2 漂移）/ skill-v2-proposal（分发瓶颈）/ tool-intelligence-pipeline（M4 周刊路线）/ content-visibility-strategy / github-nav-design
- **3 Kill**：weekly-pipeline（7 周 0/5）/ content-quality-review（停在 3.1）/ automation-tasks（被 GH Actions 实际取代）
- **1 Decide**：sensing-sources-restructure v2（5-01 提出 L1-L6 六层重构，野心大但分发未破前是错位投资）
- **1 Archive**：skillnav-skill-mvp（被 v2 替代）

### 30 天活动模式

26 fix + 26 checkpoint + 8 feat —— 项目陷入"采集管线维护"的局部最优。维护远多于增长。

### 最大错位

1. **变现叙事 vs 现实** —— 战略层 PPT debt，影响所有 stakeholder 信任
2. **trending vs trending-v2 平行实现** —— 4-29 出现，无方案档，违反"先架构后细节"
3. **paper-channel-v3 4/23 评估缺席** —— 失去停损机制，迭代被稀释成"日常运维"
4. **CMO 角色明显缺位** —— "主编+CTO+战略合伙人"叠加但分发执行薄弱

---

## 🎯 行动建议（按 ROI 排序）

### 紧急安全包（本周内，2-4 小时）
1. 修 `requireAdmin` token 比对（HMAC 或 DB session）
2. 给 `daily_briefs`/`brief_publications`/`stars_snapshots` 开 RLS
3. 升级 `next@16.2.4`
4. 修 `Govern MCP` / `Sync Curated Skills` / `failover-check` 三个 CI 红线（应用 3262ddb 模式）

合并起来一次 PR，2-4 小时。

### 文档同步包（半天）
5. 重新生成 `docs/README.md` 索引
6. 更新 CLAUDE.md（Next 16、移除 next-intl/Resend/LemonSqueezy 或标 planned）
7. 同步 `approved-deps.md` 5 个漏掉的依赖
8. 修 `.env.example`（grep 出全部 `process.env.X`）+ 写 README Getting Started
9. PGroonga：要么真装、要么改文档

### 代码根因包（1 天）
10. 修 `lib/supabase/static.ts` 类型 → 删除 89 处 cast
11. 6 个列表页加 `revalidate`
12. 8 个 article 列表 getter 套 LIGHT_COLS
13. 加 `escapeIlikePattern` 修 11 处注入面

### 治理包（半天）
14. `/trending-v2` 决策（写 ADR 或删除）
15. 三个 Kill 计划归档（weekly-pipeline / content-quality-review / automation-tasks）
16. paper-radar / translate-paper 包进 `runPipeline`
17. 关停 `/trending-v2/trending-v2.css`（迁 Tailwind 或加 `@layer` 例外条款）

### 战略验证包（4 周）
18. **2 周分发冲刺**：选 1 个渠道（X 自动发 / 微信）做端到端，目标 ClawHub 33 → 100 下载 OR 微信号 0 → 500 关注
19. **1 周变现 spike**：最小 LemonSqueezy 集成（卖一个 ¥99 的 Skill 包），不为收钱，为验证 willingness-to-pay
20. **冻结 sensing-sources-restructure v2**：等分发破局后再回看

如果 4 周后下载/关注/付费三个数字均无明显移动，"中文 AI 编辑品牌 → 变现"假设需要根本性修订。

---

## 📋 Cross-Agent 印证矩阵（高置信度发现）

| 发现 | 印证 Agent | 置信度 |
|------|----------|------:|
| `/trending-v2` 平行实现无方案 | A1, A2, A5, A7, A9 | **5×** |
| 列表页缺 `revalidate`（1102 复发面） | A2, A5 | 2× |
| RLS 缺失（daily_briefs/brief_publications） | A4, A6 | 2× |
| `architecture.md` 与现实 ~30% 偏差 | A2, A7 | 2× |
| `.env.example` 严重过时 | A10, A6（间接） | 2× |
| 89 type cast 是同一根因 | A1（深度）| 1× |
| PGroonga 是空话 | A4（深度）| 1× |
| 管理员鉴权可绕过 | A6（深度）| 1× |

---

## 评审方法说明

- **10 个并行 Agent**（每个聚焦单一维度，只读模式，明确排除项）
- **总耗时**：~16 分钟（Phase A+B 并行）+ ~5 分钟（Phase C 综合）
- **原始报告**：`.context/review-2026-05-02/A{1-10}-*.md`（共 ~109KB）
- **方法论**：维度切分 + 单一 Agent 排除项 + 跨 Agent 印证 → 排除单 Agent 偏见

下次评审建议增加：**业务/数据 Agent**（流量/留存/付费数据 vs MEMORY.md 推断）—— 本次盲飞最严重的就是缺数据视角。
