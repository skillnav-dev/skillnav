# HANDOFF
<!-- /checkpoint at 2026-04-09 -->

## Active Plan
感知层 + 热度看板 — `docs/plans/perception-trending.md`（2/3 phases, Phase 0-2 done）

## Session Tasks
- [x] MCP 查询根因排查：确认查询正常，根因是 monorepo 占满排名位
- [x] Codex 独立审查确认分析
- [x] 修复：per-repo 去重 + half/half 混合组合 → `src/lib/get-trending-tools.ts`
- [x] Trending 视觉层次优化：section header + top3 徽章 + 社区子标题
- [x] per-track 更新时间戳（替代误导性全局时间戳）
- [x] 论文翻译 5 篇（Video-MME-v2, Claw-Eval, Agent Trajectories, Vanast, Beyond Accuracy）
- [x] 具身智能感知源覆盖：X +7 KOL, HN +5 关键词, Reddit +2 subreddit

## Key Files
- `src/lib/get-trending-tools.ts` — per-repo 去重 + 混合组合核心逻辑
- `src/lib/trending-data.ts` — 移除冗余 dedupeMonorepo + 新增 fetchTrackTimestamps
- `src/components/trending/track-components.tsx` — 视觉层次改进 + per-track 时间戳
- `config/x-kol-list.json` — 47 KOL（新增 7 具身智能）
- `scripts/scrape-hn-signals.mjs` — 新增 robotics 正向关键词
- `scripts/scrape-reddit-signals.mjs` — 新增 r/robotics + r/reinforcementlearning

## Next Actions
- [ ] Phase 3 回测评估：积累 1-2 周具身智能数据后评估覆盖效果
- [ ] 社区热议"新"标签：标记当日新入库的信号，增强变化感知
- [ ] X KOL handle 验证：新增的 7 个具身 KOL handle 需确认有效（首次采集时观察）
- [ ] OpenAI 订阅恢复后改回 `LLM_PROVIDER=gpt`（`.env.local` + 6 个 CI workflow）
