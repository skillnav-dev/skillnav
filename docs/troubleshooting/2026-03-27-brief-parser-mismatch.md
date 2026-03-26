# parse-brief.ts 解析格式不匹配

Date: 2026-03-27
Status: resolved
Commit: cc24bac

## Symptoms

- `/api/skill/query?type=brief` 返回 10 条 highlights，其中 8 条 summary/comment 为空字符串
- papers 数组始终为空 `[]`
- 产品走查发现 Skill 用户看到大量无内容的 bullet 列表

## Root Cause

两个独立问题：

### 1. highlights 污染

`parseContentMd()` 按 `###` 分块处理整个 content_md，把论文速递 section 内的 `### 论文标题` 也当成 highlights。这些论文块的格式（`**做了什么**`/`**趋势**`）与 highlight 解析器期望的格式（`**为什么重要：**`）不匹配，导致 summary/comment 为空。

同时 `parseBulletHighlights()` 正确解析了 5 条 bullet highlights，两者合并后：5 条空的论文 + 5 条有内容的 bullet = 10 条，8 条看起来空。

### 2. papers 格式不匹配

`parsePaperSection()` 期望的格式（Paper Channel v2 时代）：
```
- **summary** (org)
  hook → [arXiv](url)
```

实际格式（Paper Channel v3，generate-daily.mjs 输出）：
```
### 论文中文标题
> org · 态度标签 · 代码已开源
**做了什么**：description
**对你意味着什么** | 态度标签
implication text
**趋势**：trend text
→ [arXiv](url) · [GitHub](github_url)
```

## Fix

1. `parseContentMd`: 先用 regex 剥离论文 section 再按 `###` 分块；headline 只取第一个匹配块
2. `parsePaperSection`: 完全重写，匹配 v3 的 `###` 多行格式
3. `BriefPaper` 接口扩展：新增 title, attitude, what, implication, trend, github_url

## Prevention

- content_md 格式变更时（如 generate-daily.mjs prompt 修改），同步更新 parse-brief.ts
- 可考虑让 generate-daily 直接输出结构化 JSON 字段到 DB，而非仅存 markdown 再反向解析
