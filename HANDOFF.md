# HANDOFF
<!-- /checkpoint at 2026-03-27 -->

## Active Plan
无活跃方案。Content Experience Redesign 已完成（11/11）→ `docs/plans/content-experience-redesign.md`

## Session Tasks
- [x] W2.1: API route 新增 type=paper handler → `src/app/api/skill/query/route.ts`
- [x] W2.2: SKILL.md 新增 paper 命令路由 + 格式规则 → `skills/skillnav/SKILL.md`
- [x] W3.1: generate-daily 工具信号查询 + LLM prompt + markdown 板块 → `scripts/generate-daily.mjs`
- [x] W3.2: parse-brief.ts BriefTool + parseToolSection + section=tools → `src/lib/parse-brief.ts`
- [x] W3.3: WeChat publisher 工具样式 → `scripts/lib/publishers/wechat.mjs`
- [x] SKILL.md 同步到 skillnav-skill repo → pushed `d25f397`
- [x] Trending 回填: refresh-tool-metadata --snapshot → Skills 217 trending

## Key Files
- `src/app/api/skill/query/route.ts` — 新增 type=paper (id/q 两模式)
- `src/lib/parse-brief.ts` — BriefTool + parseToolSection + parsePapersFromBriefs
- `scripts/generate-daily.mjs` — queryToolSignals + LLM tools prompt + 🔧 工具雷达
- `skills/skillnav/SKILL.md` — paper 命令 + brief tools section

## Next Actions
- [ ] 下周跑 `node scripts/refresh-tool-metadata.mjs --snapshot` 产生 MCP 第二次快照，才有 MCP trending delta
- [ ] MCP install_command 全 null 需排查回填 → `scripts/refresh-tool-metadata.mjs` 或手动
- [ ] Skill v2 方案推进 → `docs/plans/skill-v2-proposal.md`
- [ ] 4/23 Paper Channel Go/Hold/Kill 评估
