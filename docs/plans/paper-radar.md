# 论文雷达 — 知识库感知层

Status: done
Progress: 3/3
Date: 2026-04-06

## 目标

每天自动感知 AI 前沿论文，填充知识库，保持认知框架领先。分享只是副产品。

## 设计原则

- 论文感知服务自己的知识库（~/Vault/知识库/AI/），不是日报的附属
- 感知是自动的，判断是人主导的
- 日报论文板块是"溢出"，不是目的

## 三源设计

| 源 | 信号类型 | 覆盖 |
|---|---------|------|
| HF Daily Papers API | 社区实践者投票 | ML/NLP 热门 |
| Semantic Scholar API | 学术引用热度 | 老论文重新热、全学科 |
| Newsletter LLM 提取 | 行业编辑判断 | Ben's Bites/Rundown 等 |

## 流程

```
paper-radar.mjs (每天)
  → 三源采集 → 合并去重 → 交叉标记 → LLM 翻译标题/简介
  → ~/Vault/知识库/AI/论文雷达/YYYY-MM-DD.md (checkbox 格式)

用户在 Obsidian 打勾
  → translate-paper.mjs <id>
  → DB (articles 表) + ~/Vault/知识库/AI/论文/ (双写)
```

## 任务清单

- [x] paper-radar.mjs 三源采集 + 中文翻译 + Vault 输出
- [x] translate-paper.mjs 双写 Vault（frontmatter + "我的看法"模板）
- [x] 端到端验证（6 篇论文翻译入库 + 发布）

## 多 agent 评审结论（2026-04-06）

4 视角评审（CEO/工程/魔鬼/UX）关键结论：
- alphaXiv 无公开 API → 用 Semantic Scholar 替代
- Newsletter 不含 arXiv ID → LLM 提取论文标题 + arXiv API 反查
- generate-daily 不改（CI 无 Vault，保持解耦）
- checkbox 替代 frontmatter status 标记（更轻的交互）
- 雷达放专用目录不放 inbox（避免积压焦虑）
- 3 天未处理自动归档

## 关键决策

- Semantic Scholar 替代 alphaXiv（无 API vs 免费稳定 API）
- 所有文章内容改为客户端加载（解决 CF Worker 1102）
- DB 是 source of truth，Vault 是衍生副本
