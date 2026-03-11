# Handoff — SkillNav
<!-- Updated at 2026-03-11 session 31 -->

## Completed

### 第 1-29 轮摘要（session 1-30, Day 1-11）
- 站点上线 skillnav.dev + 168 精选 Skills + 99 篇文章（13 RSS 源自动管线）
- 编译模式（LLM prompt 从翻译→编译）+ 全量回炉 48 篇 + 数据清洗
- UI/UX 重构 Phase 0-5 + 设计规范 v1 + 移动端修复
- Admin 后台 + MCP 18 个精选 + GitHub 50 个项目 + 周刊工具链
- 内容战略 2.0 + 运营规范 + 分发规范 + 竞情分析（腾讯 SkillHub）
- SEO: sitemap 精简 950→224, llms.txt, 英文路由, GEO 优化
- ClawHub 7,159 条全量删除，DB 精简至 185 skills + 99 articles

### 第 30 轮：工具情报管线方案设计（session 31, Day 11）
- **四路并行调研**: Skills 发现源 + MCP 发现源 + 竞品展示分析 + 保鲜机制技术方案
- **腾讯 SkillHub 补充调研**: ClawHub CDN 镜像，无 API，无编辑深度，低威胁
- **方案 v2 产出**: `docs/plans/tool-intelligence-pipeline.md`（含全部调研结论）
- **关键决策**: OpenClaw 精选应做（50-100 个带编辑点评）；MCP 必须入库；编辑点评是最大差异化武器
- **发现源选型**: Skills P0=awesome-agent-skills+skills.sh / MCP P0=Official Registry+Smithery
- **Memory 重构**: MEMORY.md 精简 + 新建 `memory/tool-intelligence-pipeline.md`

## Next

1. **用户审批方案** — `docs/plans/tool-intelligence-pipeline.md` 待拍板
2. **M1: MCP 入库** — 创建 `mcp_servers` 表 + 迁移 18 条数据 + DAL + 页面改造
3. **M2: Skills 管线** — 接入 awesome-agent-skills + skills.sh + OpenClaw 精选
4. **M3: 保鲜层** — `refresh-tool-metadata.mjs` + GraphQL 批量 + freshness 角标
5. **M4: 周刊枢纽** — 升级 `generate-weekly.mjs` 整合三支柱
6. **审核 36 篇 draft** — Admin 后台 publish/hide
7. **内容运营 Phase 2** — LLM fallback + per-source timeout

## Verify
- `test -f docs/plans/tool-intelligence-pipeline.md && echo OK` — 方案文档存在
- `test -f src/app/llms.txt/route.ts && echo OK` — llms.txt 路由存在
- `test -f src/app/en/skills/page.tsx && echo OK` — 英文 Skills 页存在
- `npm run build` — 构建通过

## Risks & Decisions
- **工具情报管线方案 v2 待审批**: 四路调研完成，方案含发现源/展示/保鲜/实施路径
- **OpenClaw 精选已决策**: 做，50-100 个带编辑点评，source='openclaw'
- **编辑点评是护城河**: 竞品（mcp.so/SkillHub）都是量无观点，我们做"精+有观点"
