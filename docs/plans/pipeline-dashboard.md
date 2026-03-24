# Pipeline Dashboard 实施计划

> Status: active | Created: 2026-03-24 | Codex reviewed: 2026-03-24 | Progress: 9/9 (code done, pending DB migration)

## 目标

为 Admin Dashboard 增加管线可观测性：管线运行状态、漏斗数据、今日待办。

## 决策记录

- **数据来源**: 方案 A — 新建 `pipeline_runs` DB 表，脚本上报（非 GitHub Actions API）
- **理由**: 漏斗数据是核心价值；不依赖外部 API；一次性投入长期积累
- **范围**: P0 MVP — PipelineStatusBar + TodoList，不做趋势图和管线详情页
- **Codex 审阅**: 6 个问题已修复（见下方 Codex 反馈应对）

### Codex 反馈应对

| 问题 | 应对 |
|------|------|
| started_at/duration_s 语义错 | markStart() 记录开始时间，reportRun() 计算 duration |
| process.exit 覆盖不全（20 个 exit 点） | runPipeline wrapper：main() 返回结果，外层统一上报 |
| 缺 skipped 状态 | status CHECK 加 skipped |
| types.ts 缺 pipeline_runs | M1 同步更新 |
| anon vs service-role RLS 冲突 | 加 anon SELECT 策略（pipeline_runs 无敏感数据） |
| report-run.mjs 无超时 | 5s Promise.race |
| V1 范围过大 | 砍 OperationalMetrics，保留 TodoList |
| 空表首次加载 | CORE_PIPELINES 常量定义 4 条管线 |
| 时区漂移 | getTodayCST() 工具函数 |

## 架构

```
脚本层                        DB 层                     UI 层
sync-articles.mjs  ──┐
scrape-signals.mjs ──┤   pipeline_runs 表    ──→  Admin Dashboard
generate-daily.mjs ──┤   (summary JSONB)          ├─ PipelineStatusBar
publish-daily.mjs  ──┘                             └─ TodoList
                         ↑
                    runPipeline() → reportRun()
                    scripts/lib/run-pipeline.mjs
                    scripts/lib/report-run.mjs
```

**runPipeline wrapper 模式**:
```
main() 返回 { pipeline, status, summary, errorMsg, exitCode }
  → runPipeline() 统一 reportRun + log.done + process.exit
  → 所有 process.exit 改为 return，100% 覆盖
```

## 实施步骤

### M1: DB 迁移 + 类型更新

**文件**: `supabase/migrations/20260325_pipeline_runs.sql`

```sql
CREATE TABLE pipeline_runs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pipeline   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'success'
             CHECK (status IN ('success', 'partial', 'failure', 'skipped')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_s NUMERIC(8,1),
  summary    JSONB DEFAULT '{}'::jsonb,
  error_msg  TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_pipeline_runs_lookup
  ON pipeline_runs(pipeline, started_at DESC);

CREATE INDEX idx_pipeline_runs_failures
  ON pipeline_runs(status, started_at DESC)
  WHERE status IN ('failure', 'partial');

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
  ON pipeline_runs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "anon_select"
  ON pipeline_runs FOR SELECT
  USING (true);
```

**同步更新**: `src/lib/supabase/types.ts` 添加 pipeline_runs 表类型定义 + `PipelineRunRow` 别名。

**数据保留**: health-check.mjs 每天清理 90 天前记录（~500 行/90 天，极小）。

### M2: 上报基础设施

#### 2.1 report-run.mjs

**新建**: `scripts/lib/report-run.mjs`

```javascript
import { createAdminClient } from "./supabase-admin.mjs";

let _startTime = null;

/** Call at script entry to record actual start time */
export function markStart() {
  _startTime = Date.now();
}

/**
 * Report pipeline run to DB. Single INSERT with computed duration.
 * 5s timeout. Never throws.
 */
export async function reportRun(pipeline, status, summary = {}, errorMsg = null) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const now = Date.now();
  const startedAt = _startTime ? new Date(_startTime).toISOString() : new Date(now).toISOString();
  const durationS = _startTime ? parseFloat(((now - _startTime) / 1000).toFixed(1)) : null;

  try {
    const supabase = createAdminClient();
    await Promise.race([
      supabase.from("pipeline_runs").insert({
        pipeline, status, summary,
        error_msg: errorMsg?.slice(0, 500),
        started_at: startedAt,
        duration_s: durationS,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("report timeout")), 5000)),
    ]);
  } catch (e) {
    console.warn(`[report] Pipeline run report skipped: ${e.message}`);
  }
}
```

#### 2.2 run-pipeline.mjs

**新建**: `scripts/lib/run-pipeline.mjs`

```javascript
import { markStart, reportRun } from "./report-run.mjs";

/**
 * Universal pipeline runner.
 * main() should return { pipeline?, status, summary, errorMsg?, exitCode }.
 * On throw, catches and reports as failure.
 */
export async function runPipeline(mainFn, { logger, defaultPipeline, dryRunFlag = "--dry-run" }) {
  markStart();
  const dryRun = process.argv.includes(dryRunFlag);
  let result;

  try {
    result = await mainFn();
    if (!result) result = { status: "success", summary: {}, exitCode: 0 };
  } catch (e) {
    logger.error(e.message);
    result = { status: "failure", summary: {}, errorMsg: e.message, exitCode: 1 };
  }

  const pipeline = result.pipeline || defaultPipeline;

  if (!dryRun) {
    await reportRun(pipeline, result.status, result.summary || {}, result.errorMsg || null);
  }

  logger.done();
  if (result.exitCode) process.exit(result.exitCode);
}
```

### M3: scrape-signals.mjs 改造（端到端验证）

最简脚本（2 个 exit 点），第一个改造验证 wrapper 模式。

**改动**:
- 所有 `process.exit(N)` → `return { status, summary, errorMsg, exitCode: N }`
- 底部 `main().catch(...)` → `runPipeline(main, { logger: log, defaultPipeline: "scrape-signals" })`
- `"无文章"` → status `"skipped"`

**exit 点清单** (2 个):

| 行号 | 原 | 改为 |
|------|------|------|
| ~203 | `process.exit(1)` — 源 < 2 | `return { status: "failure", summary: { sources_ok, sources_failed }, errorMsg: "Too few sources", exitCode: 1 }` |
| ~248 | `main().catch` | 由 runPipeline 的 catch 兜底 |

### M4: generate-daily.mjs 改造

验证 skipped 状态。

**exit 点清单** (4 个):

| 行号 | 原 | 改为 |
|------|------|------|
| ~424 | `process.exit(0)` — brief 已存在 | `return { status: "skipped", summary: { date, reason: "already_exists" }, exitCode: 0 }` |
| ~439 | `process.exit(0)` — 无文章 | `return { status: "skipped", summary: { date, articles: 0, reason: "no_articles" }, exitCode: 0 }` |
| ~568 | `process.exit(1)` — upsert 失败 | `return { status: "failure", summary: { date }, errorMsg: upsertErr.message, exitCode: 1 }` |
| ~579 | `main().catch` | 由 runPipeline catch 兜底 |

### M5: publish-daily.mjs 改造

验证 partial 语义。

**exit 点清单** (5 个):

| 行号 | 原 | 改为 |
|------|------|------|
| ~43 | 无效 channel | `return { status: "failure", errorMsg: "Invalid channel", exitCode: 1 }` |
| ~62 | 查询 DB 失败 | `return { status: "failure", errorMsg: error.message, exitCode: 1 }` |
| ~67 | 无 brief | `return { status: "failure", errorMsg: "No brief found", exitCode: 1 }` |
| ~74 | brief 是 draft | `return { status: "failure", errorMsg: "Brief is draft", exitCode: 1 }` |
| ~193 | `main().catch` | 由 runPipeline catch 兜底 |

**语义**: summary 用 `channels_prepared`（非 published），因为非 RSS 渠道只准备文件不发布。

### M6: sync-articles.mjs 改造（风险最高，最后做）

**exit 点清单** (9 个):

| 行号 | 原 | 改为 |
|------|------|------|
| ~351 | 不存在的源 | `return { status: "failure", errorMsg: "Unknown source", exitCode: 1 }` |
| ~370 | retranslate-truncated 查询失败 | `return { pipeline: "sync-articles:retranslate", status: "failure", ... }` |
| ~440 | retranslate-truncated 部分失败 | `return { pipeline: "sync-articles:retranslate", status: "partial", ... }` |
| ~468 | retranslate-drafts 查询失败 | 同上模式 |
| ~538 | retranslate-drafts 部分失败 | 同上模式 |
| ~564 | retranslate-published 查询失败 | 同上模式 |
| ~634 | retranslate-published 部分失败 | 同上模式 |
| ~921 | 主流程有失败文章 | 正常 return |
| ~926 | `main().catch` | 由 runPipeline catch 兜底 |

**额外改动**: 新增 `totalFiltered` 变量修复计数缺失（原始触发问题）。

### M7: Admin 数据访问层

**修改**: `src/lib/data/admin.ts` 新增常量 + 2 个函数

```typescript
// Pipeline registry
export const CORE_PIPELINES = [
  { key: "sync-articles",   label: "文章采集" },
  { key: "scrape-signals",  label: "信号采集" },
  { key: "generate-daily",  label: "日报生成" },
  { key: "publish-daily",   label: "日报发布" },
] as const;

export interface PipelineStatus {
  pipeline: string;
  label: string;
  status: "success" | "partial" | "failure" | "skipped" | null;
  started_at: string | null;
  duration_s: number | null;
  error_msg: string | null;
}

// getPipelineStatus(): 4 条管线各取最近 1 次运行，Promise.all 并行
// 无记录时 status = null，UI 显示灰点 + "暂无数据"

export interface TodoSummary {
  pendingBriefs: number;       // daily_briefs: brief_date = today(CST), status in (draft, approved)
  recentDraftArticles: number; // articles: status = draft, created_at >= 7 days ago
}

// getTodayTodos(): 查 daily_briefs + articles，用 getTodayCST() 解决时区

function getTodayCST(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().slice(0, 10);
}
```

### M8: UI 组件（2 个新组件，均为 RSC）

#### PipelineStatusBar

**新建**: `src/components/admin/pipeline-status-bar.tsx` (~80 行)

```
┌─ 管线状态 ──────────────────────────────────────┐
│ ● 文章采集  成功 3h前  │ ● 信号采集  成功 5h前  │
│ ● 日报生成  跳过 6h前  │ ● 日报发布  失败 6h前  │
│                         │  ↳ Brief is draft     │
└─────────────────────────────────────────────────┘
```

- `grid grid-cols-2 md:grid-cols-4`
- 状态圆点: 绿(success) / 蓝(skipped) / 黄(partial) / 红(failure) / 灰(null)
- failure/partial 时展示 error_msg 第一行（truncate 50 字）
- 相对时间工具函数 `getRelativeTime()`

#### TodoList

**新建**: `src/components/admin/todo-list.tsx` (~60 行)

```
┌─ 今日待办 ──────────────────────────┐
│ 待审核日报         1    → 查看日报  │
│ 近期待复核文章      3    → 查看草稿  │
│                                     │
│ (全部完成时: "✓ 今日无待办")         │
└─────────────────────────────────────┘
```

- TodoList 不依赖 pipeline_runs 表，只查 daily_briefs + articles
- Link 目标: `/admin/daily`、`/admin/articles?status=draft`

### M9: Dashboard 集成 + 验证

**修改**: `src/app/admin/page.tsx`

布局（从上到下）:
1. 标题 "Dashboard"
2. **PipelineStatusBar** ← 新增
3. **TodoList** ← 新增（全宽）
4. 文章统计（现有）
5. Skills 统计（现有）
6. MCP 统计（现有）

```typescript
const [articleStats, skillStats, mcpStats, pipelineStatus, todos] =
  await Promise.all([
    getArticleStats(),
    getSkillStats(),
    getMcpStats(),
    getPipelineStatus(),
    getTodayTodos(),
  ]);
```

**验证清单**:
- [ ] `npm run build` 通过
- [ ] 本地 `/admin` 空表状态：4 个灰点 + "暂无数据"
- [ ] `node scripts/scrape-signals.mjs --dry-run` — 不上报
- [ ] `node scripts/scrape-signals.mjs` — pipeline_runs 有记录
- [ ] 刷新 `/admin` — PipelineStatusBar 显示运行结果
- [ ] 验证 failure 路径：传入无效参数触发错误退出，确认上报 failure
- [ ] 验证 TodoList：有 draft brief 时显示数字，无 draft 时显示 "无待办"

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `supabase/migrations/20260325_pipeline_runs.sql` | DB 迁移 + anon SELECT 策略 |
| 修改 | `src/lib/supabase/types.ts` | +pipeline_runs 类型 |
| 新建 | `scripts/lib/report-run.mjs` | markStart + reportRun（5s 超时） |
| 新建 | `scripts/lib/run-pipeline.mjs` | 通用 wrapper |
| 修改 | `scripts/scrape-signals.mjs` | exit→return + runPipeline |
| 修改 | `scripts/generate-daily.mjs` | exit→return + runPipeline + skipped |
| 修改 | `scripts/publish-daily.mjs` | exit→return + runPipeline + channels_prepared |
| 修改 | `scripts/sync-articles.mjs` | exit→return + runPipeline + totalFiltered |
| 修改 | `src/lib/data/admin.ts` | +CORE_PIPELINES + getPipelineStatus + getTodayTodos |
| 新建 | `src/components/admin/pipeline-status-bar.tsx` | 管线状态条 |
| 新建 | `src/components/admin/todo-list.tsx` | 今日待办 |
| 修改 | `src/app/admin/page.tsx` | 集成 2 个新组件 |

## summary JSONB 字段约定

| 管线 | 字段 |
|------|------|
| sync-articles | fetched, deduped, filtered, inserted, failed |
| sync-articles:retranslate | mode, total, retranslated, failed |
| scrape-signals | sources_ok, sources_failed, total_chars |
| generate-daily | date, articles, highlights, reason?(skipped 时) |
| publish-daily | date, channels_prepared[], channels_failed[] |

## 不做的事

- OperationalMetrics（briefStreakDays 虚荣、successRate 已被状态点覆盖）
- 趋势图（P2，需要 recharts）
- 管线详情页 `/admin/pipeline/[name]`（P1）
- 实时 WebSocket / Slack 推送
- 按源分布统计（P1）
- 非核心管线上报（health-check, govern 等）
- running/canceled 状态（CI 通知已覆盖）
- 两步 start/finish 模式（单步 + markStart 够用）
