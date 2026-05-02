---
title: SkillNav 修复计划
date: 2026-05-02
status: draft (awaiting decisions)
type: remediation-plan
based-on:
  - docs/reviews/2026-05-02-comprehensive-review.md (10-agent review)
  - .context/review-2026-05-02/M1-adversarial.md (devil's advocate)
  - .context/review-2026-05-02/M2-priority-recheck.md (independent re-rank)
  - .context/review-2026-05-02/M3-strategic-decisions.md (forced verdicts)
---

# SkillNav 修复计划（2026-05-02）

## 执行摘要

10 Agent 评审 + 3 Meta Agent 复审后，结论收敛：

- **真 P0：3 项**（不是综合报告的 7 项 —— PGroonga / README 索引 / failover 阈值都被 M1+M2 降级为 P1 文档卫生）
- **关键误诊修正**：综合报告说"修 `static.ts` 泛型一次删 89 处 cast"是**错的**（M1 验证）。`static.ts:9` 与 `server.ts:11` 已正确传 `<Database>`，89 处 cast 是历史防御代码，需**探针**而非根因式修复
- **关键副作用警告**：开 RLS 必须**配对**改 admin 写入路径（从 anon-key `createServerClient` 切到 service-role），否则开 RLS 当下 admin 写入立即挂
- **本周三件事**（M2+M3 一致）：① 安全批量 PR（鉴权+RLS+next 升级 → 不是 4h 是 0.5-1.5d）② revalidate + LIGHT_COLS（替代综合报告的 5min cargo-cult）③ 一周分发实验（停码、停爬虫、停重构）
- **战略 5 项**（M3 立场）：PGroonga Hold / 变现 Go / `/trending-v2` Kill / paper-channel 4-23 评估 Kill / `/weekly` Kill（bonus）

## 决策清单（请你拍板）

> M3 给的是建议立场，不是命令。我已倾向 M3 推荐，但你可以反对任何一项。

| # | 决策点 | M3 推荐 | 后果 | 我的立场 |
|---|-------|--------|------|---------|
| D1 | PGroonga 真装 vs 改文档 | **Hold**（改文档） | 节省 1-2d，承认 ILIKE 是真实搜索 | 同意 M3 |
| D2 | 4 周内做付费 spike | **Go**（最小 LemonSqueezy） | 强制 WTP 验证，打破"维护舒适区" | 同意 M3 |
| D3 | `/trending-v2` 去留 | **Kill**（删 v2，保 v1） | 删 521+852 行死代码 | 同意 M3 |
| D4 | paper-channel 4-23 正式评估 | **Kill 评估**，宣布 BAU | 把评估精力转去做分发指标 | 同意 M3 |
| D5 | `/weekly` + weekly-pipeline | **Kill**（M3 bonus） | 删死页 + 释放"周更"心智负担 | 同意 M3 |

**给你的问题**：D1-D5 你最终怎么选？最希望听你不同意哪一条以及为什么。

---

## Tier 0：本周必做（安全 + 高 ROI）

### T0-1：安全批量 PR ⚠️ 0.5-1.5 天

**根因**：A6（管理员鉴权可绕过 + Next CVE）+ A4/A6（RLS 缺失）+ A6（PostgREST 注入）

**M1 关键修正**：综合报告说"2-4 小时"是错的。实际 0.5-1.5 天，因为：
- next 升级要 Workers 重部署 + smoke test
- RLS 启用必须配对 admin 客户端切 service-role（否则 admin 写入立挂）
- HMAC 改造要新增 `ADMIN_SECRET` Worker secret + 让所有现有 session 失效

**任务清单**（一个 PR）：
1. **修管理员鉴权** —— `src/lib/admin-auth.ts:9-15` 改 HMAC 签名 cookie 或服务端持久化 token hash
   - 新增 `ADMIN_SECRET` env var
   - Cookie 写入时 `hmac(value, ADMIN_SECRET)` 附在 token 后
   - `requireAdmin()` 验证签名后才认账
   - 验证：手动用 curl 带乱码 cookie 应被 401
2. **配对修 RLS + admin 客户端**（M1 警告：必须一起改）
   - 新增 migration：`ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;` + service-role 写策略（参考 `supabase/migrations/20260325_*` 中 `pipeline_runs` 的写法）
   - 同样处理 `brief_publications`、`stars_snapshots`
   - **同时**把 `src/app/api/admin/daily/[id]/route.ts`、`…/approve/route.ts`、`…/publish/route.ts`、`…/community/[id]/route.ts` 从 `createServerClient`（anon）切到 service-role admin 客户端
   - 验证：本地跑 admin 改 brief 仍能成功；用 anon key 直打 PostgREST `daily_briefs` PATCH 应被 RLS 拒
3. **PostgREST `.or()` 注入修复**（M2 把这个升到 P0）
   - 加 `src/lib/utils.ts` 导出 `escapeIlikePattern(s) → s.replace(/[%_,()*]/g, "\\$&")`
   - 11 个站点替换：`api/skill/query/route.ts:99,271,282,292`、`lib/data/{mcp,articles,skills,admin}.ts` 中所有 `.or(...)` 调用
   - 验证：`q="a,b)"` 不破 filter，仍只搜 a 不暴露 hidden
4. **next 16.1.6 → 16.2.4**
   - `npm audit fix --force` 或手动 bump
   - **先**确认 `node_modules/@opennextjs/cloudflare/package.json` 的 peerDependencies 兼容（M1 警告）
   - 本地 `npm run build` + 本地 wrangler dev 跑通后才合
   - 验证：deploy 后 `/api/health` 200

**风险**：
- RLS 启用瞬间如果 admin 客户端切换没就位 → admin UI 立刻挂 → 必须**同 commit / 同 PR** 部署
- HMAC 切换会让所有现有 admin session 失效 → 你需要重新登录一次

**Staging**：建议本地 supabase + local Worker 验证一遍再上 prod。

### T0-2：1102 复发面修复 ⚡ ~1.5h

**根因**：A4（SELECT * 拉 120KB）+ A2/A5（列表页缺 revalidate）

**M1 关键修正**：单加 `export const revalidate = 300` 是 **cargo-cult** —— 列表页因 `searchParams` 强制 dynamic，加 `revalidate` 不变静态。**真正的 1102 防御是 LIGHT_COLS**。

**任务清单**：
1. **LIGHT_COLS 扫描**（核心防御）：8 个 article 列表 getter 套用与 `getArticleBySlug` 同款的 LIGHT_COLS 列裁剪
   - `src/lib/data/articles.ts:35,118,203,255,290,318,450,478`（`getArticles`、`getLatestArticles`、`getArticlesWithCount`、`getPapersWithCount`、`getEditorialArticles`、`getWeeklyArticles`、`getSeriesArticles`、`getAllSeriesArticles`）
   - admin listings 同样处理：`src/lib/data/admin.ts:179,643,805`
   - 验证：`/articles` 列表页 response payload 应从 N MB 降到 < 500KB
2. **`revalidate=300` 仍然加**（不是主防御，但有重复 searchParam combo 时确实省钱）
   - `src/app/{skills,mcp,articles,en/skills,en/mcp,weekly}/page.tsx`
3. **删除死路由 `/api/content/[slug]`**（M1 验证：源码 0 调用方）
   - 直接 `rm -rf src/app/api/content/`
   - 验证：`grep -r "api/content" src/` 应只剩注释或文档

### T0-3：CI 三红线（消噪 + 修热备）~1.5h

**根因**：A8 P0 #1+#2+#3

1. **Govern MCP Servers**：套 commit 3262ddb 模式 → "0 applied + N errors" 才 exit 1
2. **Sync Curated Skills**：把 `tree:neondatabase/agent-skills` 的 fetch 包在 try/catch，rate-limit 不杀整 job
3. **failover-check.mjs:22**：`DRY_MIN_RUNS = 3` 改为 `2`，或 `DRY_HOURS = 24` 改为 `36`

验证：等下周一/周五 CI 跑完再看是否仍假报警。

### T0-4：一周分发实验（**最重要**，但完全不写后端代码）

**根因**：A9 + M2 + M3 都把这个放在第一位。30 天 26 fix : 8 feat 是诊断 —— 项目在维护舒适区里待太久。

**严格规则**：
- 5 个工作日（周一 ~ 周五）只做分发
- **不写新爬虫**、**不开 sensing-sources-restructure v2**、**不重构 `admin.ts`**、**不动 89 cast**
- 任选 1 个渠道 end-to-end：X 自动发 / 微信公众号自动同步 / ClawHub 主页推广

**退出条件**：周五前其中之一发生
- ClawHub 下载 33 → 50+
- 单个付费用户（即便 ¥9.9 测试单也算）
- 微信公众号关注 0 → 100+

如三项都没动 → 见 T1-5 战略复盘。

---

## Tier 1：本月做（一周一项）

> M1 提醒：solo dev 在一周做完 9 个 P1 不现实，最多 2-3 项 + T0 包

### T1-1：89 个 type cast 探针 ~半天 → 可能 1 天可能 1 周

**M1 关键修正**：综合报告说"修一次 `static.ts` 删 89 cast"是**错诊断**。`static.ts:9` `createClient<Database>(...)` 已正确传 `<Database>`。89 个 cast 是历史防御代码，**根因不在 static.ts**。

**步骤（探针式）**：
1. 选 1-3 处 cast 删掉（推荐 `lib/data/admin.ts` 中最简单的一处）
2. 跑 `npx tsc --noEmit`
3. 三种结果：
   - **过了** → 89 个全是死代码，`sed` 批量删，半天搞定
   - **挂在某种 Insert/Update 类型不匹配** → 是 `@supabase/supabase-js` 版本与 `Database` 类型不兼容 → 需要 supabase 包 + 类型重生 → 1-2 天
   - **挂在 Database 类型本身缺表（如 `pipeline_runs`、`daily_briefs`）** → 重新 `supabase gen types typescript` → 半天
4. 根据 step 3 决定接下来路径，或暂缓
- **不要先承诺工时**，探针后再说

### T1-2：文档同步包 ~1 天

> M1 修正：综合报告说"半天"低估，实际 1 整天

**任务**：
1. 重新生成 `docs/README.md` 索引（从文件系统）
2. 修 `CLAUDE.md`：Next.js 15 → 16；删除 `next-intl`、`Resend`、`LemonSqueezy`、`Meilisearch` 或加 `(planned)` 标记
3. 修 `docs/approved-deps.md`：补 `cheerio` `katex` `rehype-katex` `remark-math` `pdf-parse`
4. 修 `.env.example`：grep `process.env.X` 全部脚本，列出 20+ 变量
5. README 加 "Getting Started"（Supabase 设置、`.env.local`、首次跑通验证）
6. 修 `.claude/rules/commands.md`：把缺的 20+ 脚本补上 OR 在 README 指明 `node scripts/X.mjs --help` 是入口
7. 关于 PGroonga：按 D1 决策，把 README + CLAUDE.md + operations-manual + Skill v2 spec 4 处宣传改成 ILIKE
8. 删 3 个 `update-brief-v*` 重复脚本中的 2 个，只保留 canonical 那一份

### T1-3：内容流水线小修 ~半天

**A3 P1 找到的 5 项**：
1. paper-radar.mjs:84-122 修 SS 重试控制流（catch 改 continue）
2. paper-radar.mjs / translate-paper.mjs 包进 `runPipeline` 让 Better Stack 看到
3. 社区采集 LLM summary 失败加 `withRetry` 包一层（避免 null `content_summary_zh`）
4. `lib/llm.mjs:131` 默认 provider 从 `"gpt"` 改 `"deepseek"`
5. Vault 路径硬编码改 `VAULT_DIR` env

### T1-4：治理删除（执行 D3+D5）

**D3 Kill /trending-v2**：
- `rm -rf src/app/trending-v2/`（含 6 个组件 + 852 行 raw CSS）
- 验证：`grep -r "trending-v2" src/` 应清空

**D5 Kill /weekly + weekly-pipeline**：
- `rm -rf src/app/weekly/`
- `git mv docs/plans/weekly-pipeline.md docs/archive/`
- 修 sitemap、修导航栏、修 features.md
- 验证：`/weekly` 应 404

**附带 D4 Kill paper-channel 4-23 评估**：
- `docs/plans/paper-channel-v3.md` frontmatter 改 `status: bau`
- MEMORY.md 状态表里"4/23 评估"改为"BAU active"

### T1-5：战略复盘（依赖 T0-4 结果）

**触发条件**：T0-4 周五退出条件均未满足

**动作**：
- 改 CLAUDE.md 删除"Skill 套件变现"叙事 OR 改写为"内容驱动的中文 AI 编辑站（公益/订阅暧昧待定）"
- 关 D2 付费 spike 计划，承认变现假设当前未验证
- 重排下一个月：把"采集源扩展"全部冻结到分发数据出现为止

---

## Tier 2：机会主义（本月内有空再说）

按 ROI 顺序：

1. 6 个文件拆分（>300 行）：`admin.ts` (867)、`articles.ts` (575)、`main-feed.tsx` (521)…
2. 删 6 个死组件 (~330 行)
3. 4 个 helper 去重（`truncate` / `formatDate` / `isSupabaseConfigured` / `STATUS_BADGE`）
4. 加 next.config.ts headers（CSP frame-ancestors 'none' on /admin、HSTS、X-Frame-Options）
5. API 加 zod 校验
6. article hero 迁 `next/image` + priority
7. 加 `error.tsx` 到 articles/[slug]、papers、mcp/[slug]、daily/[date]
8. sitemap 补 /daily /papers /trending
9. node 20 → 24（GHA actions 升 v5）
10. deploy.yml 加 post-deploy smoke test
11. components/admin 反向 import → actions 抽到 lib（M1 标 P2）
12. `mcp_servers.github_url_normalized` UNIQUE
13. categories 查询用 RPC 绕开 1000 行截断

---

## Tier -1：明确不做

按本计划归档/拒绝：

| 项 | 理由 | 依据 |
|----|------|------|
| 装 PGroonga | D1 Hold —— 搜索不是瓶颈 | M3 D1 |
| weekly-pipeline 继续推进 | D5 Kill | M3 bonus |
| sensing-sources-restructure v2 | A9 警告：分发未破前是错位投资 | A9 + M2 |
| docs/README 索引"P0 紧急修" | 实际 P1 文档卫生 | M1 / M2 |
| `dangerouslySetInnerHTML` XSS sink | A6 标 P1 但只在 generator 路径写，等 admin auth 修完后 P3 跟进 | M1 |
| stars_snapshots RLS 同优先级 | 比 daily_briefs 低风险（只有 trolls 改星数）| M1 |

---

## 风险与依赖

### 关键风险

1. **T0-1 RLS + admin 客户端切换必须同 PR 部署**，否则 admin UI 立挂（M1 警告）
2. **next@16.2.4 与 OpenNext-Cloudflare adapter 兼容性**：升级前必查 `@opennextjs/cloudflare` peer deps（M1 警告）
3. **89 cast 探针结果不可预测**：可能半天可能 1 周，不要先承诺时间窗（M1 警告）
4. **HMAC cookie 切换会强制重登**：你下次开 admin 会被踢出登录页

### 依赖

- 需要 `ADMIN_SECRET` 新增到 Cloudflare Worker secrets（用 `wrangler secret put`）
- 需要本地 supabase 镜像或 staging 项目验证 RLS 不破 admin
- D2 付费 spike 需要 LemonSqueezy 账号（如未注册，注册本身约 1 小时）

### 不确定项（需要回查）

- `daily_briefs` 现状 RLS 是否已在 Supabase dashboard 手动开启（migration 文件没记录但 dashboard 可能有）—— 上 dashboard `Auth → Policies` 看一眼即知
- `ADMIN_PASSWORD` 是否已在 Worker secrets 配置（A6 提到没文档化）

---

## 时间线（建议）

```
W1（本周）
  Mon-Fri: T0-4 一周分发实验（主线）
  Mon AM:  T0-3 CI 三红线修复（30 min）
  Mon PM:  T0-2 1102 复发面（LIGHT_COLS + revalidate + 删死路由，1.5h）
  Tue-Wed: T0-1 安全批量 PR（鉴权+RLS+注入+next，0.5-1.5d）
  Fri PM:  T0-4 退出判定 → 决策 T1-5 是否触发

W2（下周）
  T1-1 89 cast 探针（半天，结果决定后续）
  T1-2 文档同步（1 天）
  T1-4 删 trending-v2 + weekly（半天）

W3
  T1-3 内容流水线小修（半天）
  T1-5（如触发）战略复盘
  Tier 2 机会主义清单按情况

W4
  D2 付费 spike OR Tier 2 收尾
```

---

## 评审决策记录（不可驳回的依据）

- M1 抓到的 89 cast 误诊：`static.ts:9` + `server.ts:11` 已 `<Database>`，"修一次删 89"是错命题
- M1 抓到的 RLS 副作用：开 RLS 必须配对切 admin 客户端
- M1 抓到的 5-Agent 印证 ≠ 严重度：可见性不等于风险
- M2 算的实际 P0：4 项（鉴权+RLS+CI+next CVE，3h 一个 PR）—— 但 M1 修正为 0.5-1.5 天
- M3 五项立场：Hold/Go/Kill/Kill/Kill（D1-D5）

---

## 等待你的确认

1. **D1-D5** 五项决策是否照 M3 推荐执行？
2. **本周节奏**（T0-1 ~ T0-4）顺序与时间块 OK？
3. **T0-4 一周分发实验**是不是真的能锁日历不写代码？这是这个计划最重要也最容易破功的一项
4. **89 cast 探针**是直接做还是放到 W2 再说？

确认后我可以按此计划开始执行（或者只做你 OK 的子集）。
