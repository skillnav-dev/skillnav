# Handoff — 自动化任务系统规划

## Objective
将所有数据同步脚本从本地手动执行迁移到 GitHub Actions 定时运行，解决国内网络不稳定问题，并规划 GPT 驱动的内容丰富化管线。

## Current State

### Completed
- **自动化方案设计完成**：7 个定时任务（T1-T7）全部规划，含 cron 时间、脚本、workflow 设计
- **方案文档保存**：`docs/plans/automation-tasks.md`
- **速度策略确定**：CI 用 openai 直连（不走国内代理）、GitHub fetch 间隔 CI 下降到 30ms
- **前序工作完好**：详情页双栏布局、507/6447 content 回填、29 篇文章同步、内容管线均正常

### In Progress
- **自动化系统未实施**：方案已定，代码未写

## Next Actions

### 优先级 1：公共基础设施
1. 创建 `scripts/lib/retry.mjs` — `withRetry()` 指数退避重试
2. 创建 `scripts/lib/validate-env.mjs` — 环境变量早期校验
3. 增强 `scripts/lib/logger.mjs` — 添加 `summary()` 方法写 `$GITHUB_STEP_SUMMARY`

### 优先级 2：现有脚本增强
4. `scripts/sync-articles.mjs` — 引入 retry + validateEnv + 退出码 + summary
5. `scripts/sync-clawhub.mjs` — validateEnv + CI 加速（30ms 间隔）+ 退出码
6. `scripts/sync-anthropic-skills.mjs` — validateEnv + 退出码

### 优先级 3：Workflow 文件
7. `.github/workflows/sync-articles.yml` — 每天 UTC 00:00，LLM_PROVIDER=openai
8. `.github/workflows/sync-skills.yml` — 每周一 UTC 02:00，两个 job（ClawHub + Anthropic）
9. `.github/workflows/health-check.yml` — 每天 UTC 06:00 + `scripts/health-check.mjs`

### 优先级 4：后续按需
10. `scripts/translate-skill-content.mjs` + workflow — content 回填完成后启用
11. `scripts/enrich-skills.mjs` + workflow — 有流量数据后启用
12. `scripts/check-links.mjs` + workflow — 数据稳定后启用

### 遗留：数据回填
13. content 回填仍需完成（507/6447），可通过 sync-skills workflow 自动增量补齐

## Risks & Decisions
- **GPT 代理不可用于 CI**：`gmn.chuangzuoli.com` 在国内，从 GitHub Actions（美国）访问延迟高。CI 必须用 openai/deepseek 直连
- **GitHub Secrets 需添加**：`SUPABASE_SERVICE_ROLE_KEY` 和 `OPENAI_API_KEY` 尚未配置到 GitHub
- **LLM 速度是不可压缩瓶颈**：翻译 10-30s/次，10 req/min 已接近上限，只能通过每天定时分摊
- **GitHub Actions cron 精度**：+/- 5-15 分钟延迟，对我们场景可接受

## Verification
- `npm run lint` — 零错误
- `cat docs/plans/automation-tasks.md` — 方案文档完整
- `node scripts/sync-articles.mjs --dry-run` — 文章同步脚本可运行
- `node scripts/sync-clawhub.mjs --dry-run --limit 3` — ClawHub 同步脚本可运行

## Modified Files (本次会话)
- `docs/plans/automation-tasks.md` — 新增，自动化任务系统完整方案

## Key References
- 自动化方案：`docs/plans/automation-tasks.md`
- 内容管线方案：`docs/plans/content-pipeline.md`
- 同步脚本：`scripts/sync-articles.mjs`、`scripts/sync-clawhub.mjs`、`scripts/sync-anthropic-skills.mjs`
- LLM 模块：`scripts/lib/llm.mjs`（5 providers: deepseek/gemini/anthropic/openai/gpt）
- DAL：`src/lib/data/skills.ts`、`src/lib/data/articles.ts`
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 域名：`skillnav.dev`
