# HANDOFF
<!-- /checkpoint at 2026-04-12 (session 2: 内容管线元技能入库) -->

## Active Session Summary

本次会话主要工作在 **Vault 知识库**，为 SkillNav 内容管线的踩坑经验抽象元技能文档。SkillNav 代码未改动（本次会话无代码产物）。

## Completed (本次会话)

- [x] 修复社区热议采集断档：`scrape-community-signals.yml` 增加 UTC 06:00 冗余点（commit `d5d4e23`），已手动触发补采
- [x] 新增 L2 专题文档：`~/Vault/知识库/技术积累/内容管线工程/内容管线工程.md`（453 行）
  - 8 agent 并行调研（内容管线架构 / 开源框架 / SRE / 质量控制 / 4 视角评审）
  - codex 独立评审给出 FAIL 判定，列出 5 大问题
  - 按 B 方案中等修订：修正 LLM judge 数据错误 + 新增合规安全 + 前提变量 + 规模裁剪 + 硬词降级 + 一致性修复
- [x] Vault commit: `7efb2c2` (main)

## Key Artifacts

- **Vault 文档**：`~/Vault/知识库/技术积累/内容管线工程/内容管线工程.md`
  - Asset-Centric + Negative Engineering 心智模型
  - 8 条核心原则（P0 幂等/去重/源隔离/置信度路由 + P1 熔断/监控外移/demotion/judge 隔离）
  - 反模式三层（架构/实现/运维）
- **codex session id**：`.context/codex-session-id` = `019d8216-4dc3-77c0-a014-1962b219516a`
  - 可用于后续续聊，验证修订版是否解除 FAIL 判定
- **索引卡**：`~/Vault/知识库/技术积累/_index.md` 已新增"L2 专题 — 内容管线工程"分区

## Next Actions (本次会话遗留)

### 知识库后续
- [ ] 可选：用 codex 续聊 session 跑 second-pass review 验证 FAIL 解除
- [ ] 可选：新建 L3 动手手册卡（`runPipeline` 骨架 / LLM schema 校验工具选型 / confidence 路由实现）——A2 评审的"动手手册 5/10"缺口

### SkillNav 项目 Action Items（从调研中发现）
- [ ] **judge 家族隔离**：当前翻译和评分都用 DeepSeek，存在自我偏好风险。建议评分改用 Gemini/Claude
- [ ] **分层重试审计**：LLM SDK + lib/llm.mjs + run-pipeline.mjs 是否存在重试栈叠加？
- [ ] **jitter 补齐**：审计 LLM retry 是否已加 jitter（Full 或 Decorrelated）
- [ ] **近似去重**：SimHash/MinHash 可防 RSS 转载重复
- [ ] **Honeypot 漂移监测**：固定 ground-truth 样本做 judge 漂移检测

---

## Previous Session (论文翻译批次 · 2026-04-12 早段)

> 以下是上一次会话遗留的未完成项，仍需处理。

### Active Plan
论文频道 v3 — `docs/plans/paper-channel-v3.md`（M1+M2 done, M3 持续迭代中）

### Completed
- [x] 扫描 4/11 论文雷达 + 4/10 遗留勾选项，去重得 9 篇待翻译
- [x] 跑 `auto-translate-radar.mjs` 批量翻译，首轮 7 成功 / 2 ETIMEDOUT
- [x] 失败 2 篇单独后台并行重试：`translate-paper.mjs 2604.06628` + `2604.08224` 全部成功
- [x] 写临时 `scripts/_publish-papers.mjs` 验证数据库状态 → 发现 9 篇已 published → 删除脚本

### Key Files (上次)
- `scripts/auto-translate-radar.mjs` — 批量翻译入口，spawnSync 超时对长论文不友好
- `scripts/translate-paper.mjs` — 单篇翻译；**日志 bug**：插入后打 `Status: draft (review and publish from admin UI)` 但实际写入 `published`
- `~/Vault/知识库/AI/论文/2604-*.md` — 9 份双写副本已生成
- DB `articles` 表：9 行 status=published，source_url=`https://arxiv.org/abs/<id>`

### Remaining Next Actions
- [ ] **决策**：`translate-paper.mjs` 日志与行为脱节，二选一
  - (a) 改日志文案为 "Status: published"
  - (b) 改行为回 draft 插入，恢复 admin 审核流程（符合 paper-channel-v3 纪律）
- [ ] `auto-translate-radar.mjs` 长文超时兜底：>30K 源字符延长 spawnSync 超时，或失败自动重试一次
- [ ] Phase 3 回测评估：积累 1-2 周具身智能数据后评估覆盖效果
- [ ] 社区热议"新"标签：标记当日新入库的信号
- [ ] X KOL handle 验证：7 个具身 KOL 首次采集时观察
- [ ] OpenAI 订阅恢复后改回 `LLM_PROVIDER=gpt`（`.env.local` + 6 CI workflow）

### Published Papers (2026-04-12)
| arxiv_id | 标题 |
|----------|------|
| 2604.05117 | 先看后答：视觉基础后训练提升视频理解 |
| 2604.06268 | RAGEN-2：智能体强化学习中的推理崩溃 |
| 2604.06628 | 推理SFT泛化条件分析 |
| 2604.07430 | HY-Embodied-0.5（腾讯具身） |
| 2604.08224 | LLM 智能体外化综述 |
| 2604.08364 | MegaStyle 风格数据集 |
| 2604.08377 | SkillClaw 集体技能演化 |
| 2604.08523 | ClawBench 智能体评估 |
| 2604.08546 | NUMINA 文生视频数字对齐 |

---

## Verify (本次会话)

```bash
# 确认 Vault 文档已入库
ls -la ~/Vault/知识库/技术积累/内容管线工程/
grep -c "内容管线工程" ~/Vault/知识库/技术积累/_index.md   # 应 ≥2

# 检查社区信号采集 CI 增强已部署
git log --oneline -5 | grep "scrape-community"

# 如需续聊 codex 评审
cat .context/codex-session-id
```
