# SkillNav 自动化任务系统

## 为什么做

数据同步脚本全在本地手动跑，国内网络不稳定（GitHub/Supabase 经常断连）。迁移到 GitHub Actions 后，美国机房直连这些服务，网络问题彻底消失。公开仓库 Actions 分钟无限，零成本。

## 设计原则

1. **脚本负责逻辑，workflow 只做调度** — 脚本本地可跑、CI 可跑，workflow 是薄壳
2. **CI 感知** — 脚本通过 `process.env.CI` 自动调整行为（加速 fetch、输出 summary）
3. **LLM Provider 按环境切** — CI 用 `openai` 直连，本地用 `gpt` 代理
4. **幂等 & 增量** — 所有同步脚本支持重复运行，不会产生重复数据

---

## 任务总览

```
每天 ─┬─ 08:00  T1 文章同步         ← RSS → LLM翻译 → DB     [立即]
      ├─ 12:00  T4 Skill内容翻译     ← DB读content → LLM → DB  [后续]
      └─ 14:00  T6 数据健康检查      ← DB统计 → 报告           [立即]

每周 ─┬─ 周一 10:00  T2 ClawHub同步   ← GitHub API → DB       [立即]
      ├─ 周一 11:00  T3 Anthropic同步  ← GitHub API → DB       [立即]
      └─ 周日 13:00  T5 GPT丰富化     ← DB → LLM生成评测 → DB  [后续]

每月 ── 1号 11:00  T7 死链检测        ← DB读URL → HEAD → 报告  [后续]
```

（时间为北京时间，[立即] = 本次实施，[后续] = 规划好待启用）

---

## 公共基础设施

本次新增 3 个共享模块，所有脚本复用：

**`scripts/lib/retry.mjs`** — 指数退避重试
```js
export async function withRetry(fn, { maxRetries = 3, baseDelay = 1000, label = '' })
// 1s → 2s → 4s，网络调用必套
```

**`scripts/lib/validate-env.mjs`** — 环境变量早期校验
```js
export function validateEnv(required) // 缺失 → process.exit(2) 快速失败
```

**`scripts/lib/logger.mjs`** — 增强 `summary()` 方法
```js
summary(msg) // CI 环境写 $GITHUB_STEP_SUMMARY，本地 fallback console.log
```

**退出码规范**: 0=成功, 1=部分失败, 2=致命错误

---

## T1 文章同步（每天，立即实施）

**Workflow**: `.github/workflows/sync-articles.yml`
**Cron**: `0 0 * * *` (UTC 00:00)
**脚本**: `scripts/sync-articles.mjs`（已有，需增强）
**耗时**: 2-5 分钟 | **timeout**: 30 分钟

脚本改动：
- 引入 `withRetry` 包装 `extractContent()` 和 LLM 调用
- 引入 `validateEnv()` 校验 `SUPABASE_SERVICE_ROLE_KEY` + LLM key
- main 末尾设退出码 + 写 summary

Workflow 设计：
- `LLM_PROVIDER: openai`（CI 直连 OpenAI，不走国内代理）
- `concurrency: sync-articles`（禁止并行）
- 手动触发支持 source / limit / dry_run 参数

---

## T2+T3 Skills 同步（每周，立即实施）

**Workflow**: `.github/workflows/sync-skills.yml`（一个 workflow 两个 job）
**Cron**: `0 2 * * 1` (UTC 02:00 每周一)
**脚本**: `sync-clawhub.mjs` + `sync-anthropic-skills.mjs`（已有，需增强）
**耗时**: ClawHub 5-50min + Anthropic 1-2min | **timeout**: 90 分钟

脚本改动：
- 两个脚本都加 `validateEnv()` + 退出码 + summary
- `sync-clawhub.mjs` 检测 `CI` 环境变量，fetch 间隔从 100ms 降到 30ms
- Anthropic job 设 `needs: clawhub`，ClawHub 完成后再跑

Workflow 设计：
- 默认 `--skip-existing`（增量同步）
- 手动触发支持 skip_existing / limit / dry_run 参数

---

## T4 Skill 内容翻译（每天，后续启用）

**Workflow**: `.github/workflows/translate-skills.yml`
**Cron**: `0 4 * * *` (UTC 04:00)
**脚本**: `scripts/translate-skill-content.mjs`（新建）
**耗时**: 10-30 分钟 | **timeout**: 60 分钟

新脚本逻辑：
- 查询 `WHERE content IS NOT NULL AND content_zh IS NULL LIMIT 50`
- 逐条调 `translateSkillContent()` → UPDATE content_zh
- 复用 `createRateLimiter(10)`，CLI 支持 `--limit --dry-run`

`llm.mjs` 新增导出：
```js
export async function translateSkillContent({ name, content })
// Prompt: 翻译 SKILL.md 保留 markdown/代码块/技术术语，返回纯文本
```

**启用条件**: content 回填完成（目前 507/6447）

---

## T5 GPT 内容丰富化（每周，后续启用）

**Workflow**: `.github/workflows/enrich-skills.yml`
**Cron**: `0 5 * * 0` (UTC 05:00 每周日)
**脚本**: `scripts/enrich-skills.mjs`（新建）
**耗时**: 5-15 分钟 | **timeout**: 30 分钟

新脚本逻辑：
- 查询 `WHERE editor_review_zh IS NULL AND content IS NOT NULL LIMIT 30`
- GPT 生成 JSON: `{ descriptionZh, editorReviewZh, editorRating }`
- 解析后 UPDATE 三个字段

`llm.mjs` 新增导出：
```js
export async function enrichSkill({ name, description, tags, content })
// Prompt: 生成一句话描述 + 100-200字评测 + A/B/C/D评级
```

**启用条件**: GA/Umami 有流量数据，优先丰富化高流量页面

---

## T6 数据健康检查（每天，立即实施）

**Workflow**: `.github/workflows/health-check.yml`
**Cron**: `0 6 * * *` (UTC 06:00)
**脚本**: `scripts/health-check.mjs`（新建）
**耗时**: 1-2 分钟 | **timeout**: 10 分钟

检查项：DB 连接 → 总数 → content 覆盖率 → 翻译覆盖率 → 7/30天新增 → 分类分布

输出纯文本报告 → Job Summary。失败时自动创建 GitHub Issue。

---

## T7 死链检测（每月，后续启用）

**Workflow**: `.github/workflows/check-links.yml`
**Cron**: `0 3 1 * *` (每月 1 号 UTC 03:00)
**脚本**: `scripts/check-links.mjs`（新建）
**耗时**: 10-20 分钟 | **timeout**: 30 分钟

逻辑：批量 HEAD 请求检测 source_url/github_url，10 并发，报告 404 链接。

**启用条件**: 数据稳定后

---

## GitHub Secrets 配置

| Secret | 用途 | 何时添加 |
|--------|------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | DB 写入 | 立即 |
| `OPENAI_API_KEY` | CI 环境 LLM 调用 | 立即 |
| `DEEPSEEK_API_KEY` | 备选 LLM | 可选 |

---

## 文件清单

### 立即实施（8 个文件）

| 操作 | 文件 |
|------|------|
| 新增 | `.github/workflows/sync-articles.yml` |
| 新增 | `.github/workflows/sync-skills.yml` |
| 新增 | `.github/workflows/health-check.yml` |
| 新增 | `scripts/lib/retry.mjs` |
| 新增 | `scripts/lib/validate-env.mjs` |
| 新增 | `scripts/health-check.mjs` |
| 改动 | `scripts/lib/logger.mjs` — +summary() |
| 改动 | `scripts/sync-articles.mjs` — +retry +env校验 +退出码 |
| 改动 | `scripts/sync-clawhub.mjs` — +env校验 +CI加速 +退出码 |
| 改动 | `scripts/sync-anthropic-skills.mjs` — +env校验 +退出码 |

### 后续按需（6 个文件）

| 操作 | 文件 | 触发条件 |
|------|------|---------|
| 新增 | `.github/workflows/translate-skills.yml` | content 回填完成 |
| 新增 | `.github/workflows/enrich-skills.yml` | 有流量数据 |
| 新增 | `.github/workflows/check-links.yml` | 数据稳定 |
| 新增 | `scripts/translate-skill-content.mjs` | content 回填完成 |
| 新增 | `scripts/enrich-skills.mjs` | 有流量数据 |
| 新增 | `scripts/check-links.mjs` | 数据稳定 |
| 改动 | `scripts/lib/llm.mjs` — +translateSkillContent +enrichSkill | 对应任务启用时 |
| 改动 | `package.json` — +npm scripts | 对应任务启用时 |

---

## 验证流程

1. 本地 `node scripts/sync-articles.mjs --dry-run` 验证增强逻辑
2. 推送 → GitHub Actions 手动 `workflow_dispatch` 触发
3. 检查 Actions 日志 + Job Summary
4. Supabase 确认数据更新
5. 等首次 cron 自动触发，确认定时正常
