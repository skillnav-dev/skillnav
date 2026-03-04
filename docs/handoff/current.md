# Handoff — 自动化任务系统实施

## Objective
将所有数据同步脚本从本地手动执行迁移到 GitHub Actions 定时运行，解决国内网络不稳定问题。

## Current State

### Completed
- **公共基础设施**：`scripts/lib/retry.mjs`（指数退避重试）、`scripts/lib/validate-env.mjs`（环境变量校验）
- **Logger 增强**：`scripts/lib/logger.mjs` 新增 `summary()` 方法，支持 GitHub Actions Job Summary
- **3 个同步脚本增强**：sync-articles/sync-clawhub/sync-anthropic-skills 全部添加了 validateEnv、retry、退出码、Job Summary
- **Health Check 脚本**：`scripts/health-check.mjs`，7 项数据健康指标 + 分类分布
- **3 个 GitHub Actions Workflow**：
  - `sync-articles.yml` — 每天 UTC 00:00，GPT 代理翻译
  - `sync-skills.yml` — 每周一 UTC 02:00，ClawHub → Anthropic 串行
  - `health-check.yml` — 每天 UTC 06:00，数据健康报告
- **Slack 失败通知**：3 个 workflow 均添加 `if: failure()` 通知
- **README 状态徽章**：Deploy / Sync Articles / Sync Skills / Health Check 四个徽章
- **GitHub Secrets 配置完成**：SUPABASE_SERVICE_ROLE_KEY、GPT_API_KEY、SLACK_WEBHOOK_URL
- **全部 CI 测试通过**：Health Check ✅、Sync Articles (dry-run) ✅、Sync Skills (dry-run) ✅、Sync Articles (GPT 代理真实运行) ✅

### Not Started (后续任务)
- T4: `scripts/translate-skill-content.mjs` — content_zh 翻译（content 回填完成后启用）
- T5: `scripts/enrich-skills.mjs` — GPT 丰富化（有流量数据后启用）
- T7: `scripts/check-links.mjs` — 死链检测（数据稳定后启用）

## Next Actions
1. 添加 `OPENAI_API_KEY` 到 GitHub Secrets（如需切换回 openai 直连 provider）
2. content 回填继续（507/6447），可通过 sync-skills workflow `--skip-existing=false` 增量补齐
3. 实施 T4：`scripts/translate-skill-content.mjs` — 批量翻译 skill content 为中文
4. 监控 Slack 通知确认 cron 稳定运行

## Risks & Decisions
- **GPT 代理已验证可用于 CI**：从 GitHub Actions 访问 `gmn.chuangzuoli.com` 正常，workflow 使用 `LLM_PROVIDER=gpt`
- **LLM 速度是不可压缩瓶颈**：翻译 10-30s/次，10 req/min 已接近上限，通过每天定时分摊
- **GitHub Actions cron 精度**：+/- 5-15 分钟延迟，对本场景可接受
- **OPENAI_API_KEY 未配置**：暂不需要，当前使用 GPT 代理

## Verification
- `npm run lint` — 零错误
- `npm run build` — 构建通过
- `node scripts/sync-articles.mjs --dry-run --limit 2` — 文章同步
- `node scripts/sync-clawhub.mjs --dry-run --limit 3` — ClawHub 同步
- `node scripts/sync-anthropic-skills.mjs --dry-run --limit 3` — Anthropic 同步
- `node scripts/health-check.mjs` — 健康检查（需 Supabase 连接）

## Modified Files (本次会话)
- `scripts/lib/retry.mjs` — 新增，指数退避重试
- `scripts/lib/validate-env.mjs` — 新增，环境变量校验
- `scripts/lib/logger.mjs` — 新增 summary() 方法
- `scripts/sync-articles.mjs` — +validateEnv +retry +summary +exitCode
- `scripts/sync-clawhub.mjs` — +validateEnv +CI加速 +summary +exitCode
- `scripts/sync-anthropic-skills.mjs` — +validateEnv +summary +exitCode
- `scripts/health-check.mjs` — 新增，数据健康检查脚本
- `.github/workflows/sync-articles.yml` — 新增，每日文章同步
- `.github/workflows/sync-skills.yml` — 新增，每周技能同步
- `.github/workflows/health-check.yml` — 新增，每日健康检查
- `README.md` — 新增状态徽章

## Key References
- 自动化方案：`docs/plans/automation-tasks.md`
- 内容管线方案：`docs/plans/content-pipeline.md`
- 同步脚本：`scripts/sync-articles.mjs`、`scripts/sync-clawhub.mjs`、`scripts/sync-anthropic-skills.mjs`
- LLM 模块：`scripts/lib/llm.mjs`（5 providers: deepseek/gemini/anthropic/openai/gpt）
- Supabase 项目：`caapclmylemgbrtgfszd`
- Worker URL：`skillnav.wh759705.workers.dev`
- 域名：`skillnav.dev`
