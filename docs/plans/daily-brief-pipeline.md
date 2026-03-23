# 每日简报管线 (Daily Brief Pipeline)
Status: done
Progress: 7/7
Date: 2026-03-19
Feature: daily-brief

## 概述

AI 驱动的每日简报自动生成 + 多渠道分发管线。从 SkillNav 已有的文章库中抓取最近 24h 内容，LLM 策划生成每日精选，输出 5 种格式（Markdown / 公众号 HTML / X Thread / 知乎 Markdown / 小红书文案），通过 Admin Dashboard 审核后发布。

```
sync-articles (daily cron)  ──→  articles (translated)
                                       │
                             generate-daily (7am cron)
                                       │
                              daily_briefs (draft)
                                       │
                             Admin Dashboard (审核)
                                       │
                    ┌──────────┬────────┴─────────┐
                    ▼          ▼                   ▼
               RSS (auto)  WeChat (copy)     X Thread (copy)
```

## Phase 1 任务（已完成）

- [x] DB: `daily_briefs` + `brief_publications` 表
- [x] `scripts/generate-daily.mjs` — 每日简报生成器
- [x] `scripts/lib/publishers/` — 3 个平台适配器 (wechat/twitter/rss)
- [x] `scripts/publish-daily.mjs` — 多渠道发布脚本
- [x] Admin Dashboard — 列表 + 详情（预览/编辑/审核/复制/发布状态）
- [x] RSS feed API route — `/api/rss/daily`
- [x] 代码审查 — 8 个问题全部修复（XSS、状态机竞态、输入验证等）

## Phase 2 任务

- [x] 小红书适配器（文案格式 + Admin tab + copy-ready 输出）
- [x] 知乎适配器（Markdown 长文 + Admin tab + 文件输出）
- [x] DB: `content_zhihu` + `content_xhs` 列 + channel constraint 更新（xhs 统一命名）
- [x] Admin Dashboard: Zhihu/XHS tab + publication status tracking
- [x] Codex review 修复: channel name mismatch + false published + API allowlist
- [ ] 邮件 Newsletter（Resend 集成 + 订阅管理）
- [x] OpenClaw Skill（IM 渠道分发）— skillnav-daily skill, deployed to server, GitHub: skillnav-dev/skillnav-daily-skill
- [ ] 用户账号体系 + 个性化推荐
- [ ] X API 自动发布（$200/月 Basic tier）
- [ ] 公众号 API 自动发布（需已认证服务号）

## 关键文件

| 文件 | 说明 |
|------|------|
| `sql/create-daily-briefs.sql` | DB migration（已执行） |
| `scripts/generate-daily.mjs` | 每日简报生成（query → LLM → 3 formats → upsert） |
| `scripts/publish-daily.mjs` | 多渠道发布（RSS auto, WeChat/X copy-ready） |
| `scripts/lib/publishers/*.mjs` | 平台格式适配器 |
| `src/app/admin/daily/` | Admin Dashboard UI |
| `src/app/api/admin/daily/` | Admin API routes |
| `src/app/api/rss/daily/route.ts` | RSS feed endpoint |

## 运营流程

```bash
# Cron 配置
0 6 * * *  node scripts/sync-articles.mjs     # 6am 抓取信源
0 7 * * *  node scripts/generate-daily.mjs     # 7am 生成简报
# 人工审核 via /admin/daily
# 审核后执行:
node scripts/publish-daily.mjs                 # 发布到各渠道
```

## 设计文档

- 产品设计: `~/.gstack/projects/jianbao/apple-unknown-design-20260319-095150.md`
- 测试计划: `~/.gstack/projects/jianbao/apple-unknown-test-plan-20260319-101151.md`
