# HANDOFF
<!-- /checkpoint at 2026-03-27 -->

## Active Plan
Content Experience Redesign — `docs/plans/content-experience-redesign.md`（7/11, 64%）

## Session Tasks
- [x] 方案设计：content-experience-redesign.md（3-agent 调研 + 综合输出）
- [x] 产品走查：API + 网站 + Admin 三线并行（发现 parse-brief 80%空、/daily 404、trending 空）
- [x] W0.1: 修复 parse-brief.ts（highlights + papers 解析重写）
- [x] W0.2: 新建 /daily 列表页 + /daily/[date] 详情页
- [x] W0.3: 导航栏 + footer 添加"日报"入口
- [x] W1.1: parse-brief.ts 支持 section 过滤（news/papers/tools）
- [x] W1.2: API route 支持 `?section=` 参数
- [x] W1.3: SKILL.md brief 子参数 + 格式规则
- [x] W1.4: 构建验证 + 同步 skillnav-skill repo

## Key Files
- `src/lib/parse-brief.ts` — BriefPaper 接口扩展 + 解析重写 + section 过滤
- `src/app/api/skill/query/route.ts` — section 参数传递
- `src/app/daily/page.tsx` — 日报列表页（新建）
- `src/app/daily/[date]/page.tsx` — 日报详情页（新建）
- `skills/skillnav/SKILL.md` — brief 子参数路由 + 格式规则

## Next Actions
- [ ] W2: 论文查询 API `type=paper&id=xxx` + `type=paper&q=keyword` → `src/app/api/skill/query/route.ts`
- [ ] W2: SKILL.md 新增 paper 命令路由 → `skills/skillnav/SKILL.md`
- [ ] W3: generate-daily.mjs 新增 tools section → `scripts/generate-daily.mjs`
- [ ] 修复 trending 空数据（降低 weekly_stars_delta 阈值或回填）
