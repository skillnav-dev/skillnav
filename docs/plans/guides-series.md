# Guides (专栏) — 一级内容产品

Status: approved
Progress: 7/8
Feature: GUIDE-01
Date: 2026-03-16

---

## Context

SkillNav 的内容体系有三层：资讯（RSS 日更素材库）、周刊（编辑策展品牌）、系列（深度策展）。系列是编辑价值最高的内容，但藏在文章详情页里没有独立入口。需要把"专栏"提升为一级内容产品。

首个系列：Simon Willison 的 Agentic Engineering Patterns（12 篇 + 1 篇序言）。

## Design

### 信息架构

```
导航栏：Skills | MCP | 周刊 | 专栏 | 资讯 | 关于
```

```
/guides                              → 专栏列表页
/guides/agentic-engineering-patterns  → 系列落地页（章节目录）
/articles/{slug}                     → 文章详情页（含系列导航条）
```

### 数据模型

不建新表。系列元数据（标题、作者、章节结构）存 `src/data/series.ts`。
文章通过 `series` + `series_number` 字段关联。

### 页面设计

- 列表页：一个系列一张大卡片（标题 + 作者 + 篇数 + 描述）
- 落地页：按章节分组的完整目录，每条可点击
- 详情页：已有 SeriesNav 组件（前/后篇 + 进度）

### 入口体系

| 位置 | 改动 |
|------|------|
| 导航栏 | navItems 加"专栏" |
| Footer | 产品栏加"专栏" |
| 首页编辑精选 | 可选：加专栏卡片 |

## Tasks

- [x] 文章 series 字段 + SeriesNav 组件
- [x] backfill 脚本 + Agentic Engineering Patterns 全量入库（13 篇）
- [x] 系列元数据配置 `src/data/series.ts`
- [x] 扩展 series.ts：chapters + description
- [x] 专栏列表页 `/guides`
- [x] 系列落地页 `/guides/[slug]`
- [x] 导航栏 + Footer 加"专栏"入口
- [ ] 首页编辑精选区加专栏卡片（P1）
