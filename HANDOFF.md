# HANDOFF
<!-- /checkpoint at 2026-03-28 -->

## Active Plan
Skill v2 — `docs/plans/skill-v2-proposal.md`（5/9, 56%）

## Session Tasks
- [x] MCP install_command 脏数据清理（135 条）+ 回填（1338 条）
- [x] `backfill-install-command.mjs` 支持 monorepo URL
- [x] `sync-clawhub.mjs` install 正则修复
- [x] W1.1: SKILL_VERSION 常量 + meta wrapper → `src/lib/constants.ts` + `route.ts`
- [x] W1.2: type=search 统一搜索 API → `src/app/api/skill/query/route.ts`
- [x] W1.3: SKILL.md v2.0.0（search/update/footer/version check）
- [x] W1.4: 推送 skillnav-skill repo `9cf3820` + 线上验证通过
- [x] MCP 第二次快照（5440 snapshots，下周再跑一次有 trending delta）

## Key Files
- `src/app/api/skill/query/route.ts` — 新增 type=search + meta.skill_version wrapper
- `src/lib/constants.ts` — SKILL_VERSION = "2.0.0"
- `skills/skillnav/SKILL.md` — v2.0.0 (6 commands)
- `scripts/backfill-install-command.mjs` — buildInstallCommand() 支持 monorepo
- `scripts/sync-clawhub.mjs` — install 正则收紧

## Next Actions
- [ ] Skill v2 Wave 2: 分发上架 → `docs/plans/skill-v2-proposal.md` Wave 2 章节
- [ ] 下周跑 `node scripts/refresh-tool-metadata.mjs --snapshot` 产出 MCP trending delta
- [ ] 4/23 Paper Channel Go/Hold/Kill 评估
