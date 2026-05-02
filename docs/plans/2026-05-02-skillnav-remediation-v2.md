---
title: SkillNav 修复计划 v2
date: 2026-05-02
status: draft (awaiting 2 strict blocker decisions)
type: remediation-plan
supersedes: docs/plans/2026-05-02-skillnav-remediation.md
based-on:
  - v1 (10-agent A1-A10 + M1-M3 meta)
  - .context/review-2026-05-02/E1-E5*.md (二阶元评审 5 路)
  - .context/review-2026-05-02/D1-D3*.md (路径选择 3 路)
soft-note: |
  9 任务 7 fix 是否自我应验维护舒适区？— 不阻塞本计划。
  W1 末 retro 议题：若 T0-4 退出条件均未满足且 T0-1 撞墙率 ≥1 次，
  W2 必须把变现/分发升为双主线，T1-1/T1-3 全冻结。
---

# SkillNav 修复计划 v2（2026-05-02）

## 与 v1 的差异（5 大变更）

| # | v1 | v2 | 来源 |
|---|----|----|------|
| 1 | T0-1 单 PR 0.5-1.5d | T0-1 拆 PR1（鉴权+注入，半天）+ PR2（RLS+admin+next，1d，配对部署） | E1+E2+E5 收敛 |
| 2 | 无回滚剧本 | 新增 §回滚剧本：down migration / wrangler rollback / cron 暂停 | E2-R1 致命 |
| 3 | T0-4 退出条件挂在空气中 | 加硬要求：周一 AM 前置作业 + 每日 CSV + 周五 16:00 判定会 | E4 致命 |
| 4 | 无 release smoke | 新增 §部署后 smoke：12 端点 post-deploy.mjs + 24h canary | E4-V3/V4 |
| 5 | T0-2 行号偏移、写"N MB→500KB" | 行号刷新实测；LIGHT_COLS 探针式（先改 2 个）；改 curl 量化 baseline | E1+E4 |

---

## ⚠️ 2 个 Strict Blocker 决策卡（请勾选）

> 不展开讨论。二选一勾选位。其余讨论留 W1 末 retro。

### Blocker 1: D2 付费包 SKU（决定 W4 是否能上线）
```
□ A. Skill 套件 + MCP 精选导航 ¥99（绑工作流工具包，与 D4/D5 内容削减相容）
□ B. 日报订阅 ¥9.9/月（与 D4 paper-channel BAU 化矛盾，需推翻 D4）
□ C. 推迟 D2 → 等 T0-4 分发数据出来再定（W4 spike 取消）
```

### Blocker 2: W1 硬约束 = 1 件还是 4 件？
```
□ A. "停码周"是硬规则 → T0-1 推 W2；W1 严格只做 T0-2/T0-3（共 ~3h）+ T0-4 分发
□ B. "停码周"是修辞 → T0-1 PR1（鉴权+注入）周末做（5/3 周日）；W1 Mon-Fri 守 T0-4，Tue/Thu 各塞 PR2 半天
```

**默认推荐**（如不勾选则按此执行）：Blocker 1 → A；Blocker 2 → B

---

## Tier 0：本周必做

### T0-1：安全批量 PR — 拆为 2 个 PR

**根因**：A6 鉴权可绕过 + Next CVE + RLS 缺失 + PostgREST `.or()` 注入

#### PR1：鉴权 + 注入（半天，零部署风险）
1. **修管理员鉴权** — `src/lib/admin-auth.ts:9-15` 改 HMAC 签名
   - 新增 `ADMIN_SECRET` env var（≥32 字符）
   - **boot-time guard**: `requireAdmin()` 首次调用检查 `ADMIN_SECRET` 存在且 ≥32 字符，缺失 → throw + health endpoint degraded
   - 验证：`scripts/smoke/security-matrix.mjs` HMAC 段（缺/篡改/过期/正常 4 用例）
2. **PostgREST `.or()` 注入** — 加 `src/lib/utils.ts` 导出 `escapeIlikePattern()`
   - **实测 12 处**（v1 写 11 处）：`api/skill/query/route.ts:98,270,281,292` + `lib/data/{mcp,articles,skills,admin}.ts` 中所有 `.or()`
   - 验证：单测覆盖 `% _ , ( ) * \ '` 8 字符 + 1 hidden 暴露反例

**HMAC 切换会强制重登一次**。

#### PR2：RLS + admin 客户端 + next 升级（1d，配对部署）
1. **migration**: `daily_briefs` / `brief_publications` ENABLE RLS + service-role 写策略
   - 同 migration 写**配套 down.sql**（`DISABLE ROW LEVEL SECURITY`）
   - `stars_snapshots` 不在本 PR（v1 自相矛盾，按 Tier-1 优先级降级到 Tier 2）
2. **admin 客户端切 service-role**：4 个文件
   - `src/app/api/admin/daily/[id]/route.ts`
   - `src/app/api/admin/daily/[id]/approve/route.ts`
   - `src/app/api/admin/daily/[id]/publish/route.ts`
   - `src/app/api/admin/community/[id]/route.ts`（注：表名为 `community_signals`，v1 文字错误）
3. **next 16.1.6 → 16.2.4**
   - **预检**：`@opennextjs/cloudflare` peer 是 `next >=15.5.15 <16 || >=16.2.3` ✅，但本地装的 `^1.17.1` 是否满足该 peer 需 `npm install` 时验
   - 升级后 smoke：`/articles` 第二次访问 `cf-cache-status: HIT` + R2 bucket 写入新对象
4. **删除死路由** `src/app/api/content/`（grep 0 调用方）

**配对部署窗口**（必须遵守）：
- 部署前先 `gh workflow disable` 所有 cron（除 health-check）
- 部署完 + smoke 通过 → `gh workflow enable`
- 选周日凌晨人最少时间窗

### T0-2：1102 复发面修复（探针式，1.5h → 视结果可能 2.5h）

**M1 修正后**：单加 `revalidate=300` 是 cargo-cult，**真正的 1102 防御是 LIGHT_COLS**。

**步骤**（探针式）：
1. **先改 2 个最热路径**：`getArticles@11` + `getArticlesWithCount@151`
   - 把 `LIGHT_COLS` 从 `getArticleBySlug` 内部 const 抽到模块顶层
   - 验证 mapper 兼容（grep 是否依赖 `content`/`content_zh` 长字段）
2. **量化 baseline**：
   - 改前：`curl -w '%{size_download}\n' -o /dev/null -H 'Accept-Encoding: gzip' https://skillnav.dev/articles?page=1`
   - 改后：同命令，gzip 后阈值 **<200KB**
   - 同测 `/papers`、`/skills`、`/mcp`、`/daily`
3. **看 CF Worker memory metric** 1h 后再决定剩余 6 个 getter 是否逐个改
4. **加 `revalidate=300`**（不是主防御，但有重复 searchParam combo 时省钱）：6 个 page.tsx
5. **删 `src/app/api/content/`**（已并入 PR2）

**v1 行号已偏移**，实测：getArticles@11、getLatestArticles@106、getArticlesWithCount@151、getPapersWithCount@234、getEditorialArticles@276、getWeeklyArticles@303、getSeriesArticles@433、getAllSeriesArticles@464

### T0-3：CI 三红线（30 min）

1. **Govern MCP Servers**: 套 commit `3262ddb` 模式 → "0 applied + N errors" 才 exit 1
2. **Sync Curated Skills**: `tree:neondatabase/agent-skills` fetch 包 try/catch
3. **failover-check.mjs:22**: `DRY_MIN_RUNS = 3` → `2`

**主动验证**（不被动等下周 CI）：本地构造 `applied=0, errors=5` 和 `applied=10, errors=0` 两个 mock 跑脚本，断言 exit code 1/0。

### T0-4：一周分发实验（最重要 + 加硬要求）

**严格规则**：5 个工作日（Mon-Fri）只做分发；不写新爬虫、不开 v2 重构、不动 89 cast。

**周一 AM 前置作业**（必做，否则后面 4 天白忙）：
- [ ] 确认 ClawHub 是否有下载数 API；若无 → 每日 11:00/22:00 手抓两次截图入 Google Sheet
- [ ] 微信公众号渠道决策：账号若未注册 → 当周 Kill 微信指标，改"X 关注 0→50"或"小红书 0→200"
- [ ] LemonSqueezy 账号当天注册（D2 spike 前置），否则 D2 退出条件删除

**每日 EOD 落表**：`experiments/2026-W1-distribution.csv`：date, channel, metric, value, source, screenshot_path。**没数写 0，不允许跳过**。

**"没动"客观定义**（写进计划，否则周五吵）：
- ClawHub: `week_end - week_start < 5` 视为没动（33→34 没动；33→38 微动；33→50 成）
- 付费: 严格二元，0 或 ≥1
- 替代渠道: < 计划目标 30% 算没动

**破功豁免清单**：
- ✅ `/api/health` 红 → 允许修，记进 incident log
- ❌ 主观"我想优化一下" → 拒绝
- 触发豁免 ≥2 次 → 本次实验**作废**而非"打折评估"，重排到 W2

**周五 16:00 判定会**（自己开）：填三行结论 + 触发 T1-5 yes/no，落进 `docs/retro/2026-W1-distribution.md`。

---

## §回滚剧本（v2 新增）

**T0-1 PR2 撞墙时按此执行，不要凭直觉裸 git revert**：

1. **症状识别**：
   - admin UI 401 → HMAC `ADMIN_SECRET` 配错 → `wrangler secret delete ADMIN_SECRET && wrangler secret put ADMIN_SECRET`
   - admin 写 brief 失败 → RLS policy 漏路径 → 跑 down migration `ALTER TABLE daily_briefs DISABLE ROW LEVEL SECURITY`
   - `/articles` 列表 5xx 或 `cf-cache-status` 全 MISS → next/OpenNext 协议错配 → `wrangler rollback` 回上版

2. **rollback 命令清单**（贴进 operations-manual）：
   ```bash
   wrangler rollback --message "T0-1 PR2 emergency rollback"
   # 同时跑 RLS down
   psql $DATABASE_URL -f supabase/migrations/down/{timestamp}_disable_rls_daily_briefs.sql
   # 同时重启 cron
   gh workflow enable --all
   ```

3. **24h canary**：合并后 launchd 每 30min 跑 `scripts/smoke/post-deploy.mjs`，连续 2 次失败短信告警

---

## §部署后 smoke（v2 新增）

**新建 `scripts/smoke/post-deploy.mjs`**：12 端点
```
/  /articles  /articles/[已知 slug]  /papers  /papers/[已知 slug]
/skills  /mcp  /daily  /daily/[最新 date]  /trending
/api/health  /admin (应 401)
```

**deploy.yml 集成**：Wrangler deploy 后加一步 `node scripts/smoke/post-deploy.mjs`，任一非 2xx（除 admin 401）→ exit 1 触发 rollback。

---

## Tier 1：本月做（一周一项）

### T1-0（v2 新增）：W1 末 W2 闸门 — 触发 T1-5 判定

**条件**（W1 周五 16:00 判定会输出）：
- T0-4 三项指标均未触发 → 触发 T1-5 战略复盘
- T0-1 撞墙 ≥1 次（用 §回滚剧本） → 暂停 T1-1/T1-3，把变现/分发升 W2 双主线

### T1-1：89 cast 探针 — 不变

探针式（删 1-3 处 → `tsc --noEmit` → 三种结果分支）。**不预承诺工时**。

### T1-2：文档同步包（拆分）

- **A 包**（半天）：README 索引 + CLAUDE.md 版本修正 + approved-deps 补 5 项 + .claude/rules/commands.md 补脚本 + PGroonga 4 处叙事改 ILIKE + 删 `update-brief-v*` 重复脚本
- **B 包**（半天 spike）：`.env.example` 重生成 — 跑 `grep -rh "process\.env\." scripts/ src/` 后人工筛动态拼接，**单列**不塞 A 包

### T1-3：内容流水线小修（半天） — 不变
- paper-radar.mjs:84-122 修 SS 重试控制流
- paper-radar / translate-paper 包 runPipeline
- 社区采集 LLM summary 加 withRetry
- `lib/llm.mjs:131` 默认 `"gpt"` → `"deepseek"`
- Vault 路径硬编码改 `VAULT_DIR` env

### T1-4：治理删除（D3+D5）

**D3 Kill /trending-v2** — 不变。

**D5 Kill /weekly + weekly-pipeline** — 工时上调 **1 天**（v1 写"半天"低估，实测 47 个相关文件）：
- `rm -rf src/app/weekly/`
- `git mv docs/plans/weekly-pipeline.md docs/archive/`
- 修：sitemap.ts:45,104; constants.ts:16-21（导航）; editorial-highlights.tsx:39-42（首页精选）; features.md
- 验证：`grep -r "weekly" src/` 应只剩注释 + `/weekly` 应 404

**D4 Kill paper-channel 4-23 评估** — `paper-channel-v3.md` frontmatter 改 `status: bau`；MEMORY.md 同步。

### T1-5：战略复盘（依赖 T1-0 触发）

**触发**：T1-0 闸门输出"全未触发"

**动作**：
- 改 CLAUDE.md 删除"Skill 套件变现"叙事 OR 改写为"内容驱动的中文 AI 编辑站"
- 关 D2 付费 spike，承认变现假设当前未验证
- W2-W4 重排：采集源扩展全部冻结到分发数据出现为止

---

## Tier 2：机会主义（不变）

> 13 项按 ROI，含 stars_snapshots RLS、6 文件拆分、死组件删除、API zod、headers CSP、article hero next/image、补 error.tsx、sitemap 补路径、node 升 24、deploy.yml smoke、components/admin 反向 import、`mcp_servers.github_url_normalized` UNIQUE、categories RPC

---

## Tier -1：明确不做（v1 不变 + 修正）

| 项 | 理由 | 依据 |
|----|------|------|
| 装 PGroonga | D1 Hold | M3 |
| weekly-pipeline 继续 | D5 Kill | M3 |
| sensing-sources-restructure v2 | 分发未破前是错位投资 | A9 |
| ~~stars_snapshots RLS 同 PR2~~ | **v2 修正**：从 PR2 移到 Tier 2（v1 自相矛盾） | E5 |

---

## 时间线 v2

```
W1（本周）
  Sat 5/3 (今天):  出 v2 + 你拍 2 个 Blocker → 我开始 T0-1 PR1（如 Blocker 2 选 B）
  Sun 5/4:         T0-1 PR1（鉴权+注入，半天）合 + smoke
  Mon AM:          T0-4 前置作业（数据源/账号注册）+ T0-3 CI 三红线（30 min）
  Mon PM:          T0-2 LIGHT_COLS 探针（先 2 个 getter）
  Tue:             T0-4 主线分发（如 Blocker 2=A 全天分发；如 =B 上午分发下午 PR2 part 1）
  Wed:             T0-4 主线分发
  Thu PM:          T0-1 PR2（RLS+admin+next，配对部署，2-3h）
  Fri 16:00:       T0-4 判定会 → 触发 T1-0 W2 闸门 yes/no

W2（下周，依赖 T1-0 闸门）
  T1-1 89 cast 探针（半天）
  T1-2 A 文档（半天）+ B env spike（半天）
  T1-4 治理删除（含 /weekly 1 天）
  如 T1-0 触发 → T1-5 战略复盘 + 暂停 T1-1/T1-3

W3-W4
  T1-3 流水线小修
  D2 付费 spike（如 Blocker 1=A/B；如 =C 跳过）
  Tier 2 机会主义
```

---

## 等你确认

1. **Blocker 1**（D2 SKU）勾选哪个？
2. **Blocker 2**（W1 硬约束）勾选哪个？
3. v2 整体节奏 OK 吗？还想加/砍哪条？

确认后我按此执行（Blocker 2=B 时今晚先开 T0-1 PR1；=A 时等 Mon AM）。
