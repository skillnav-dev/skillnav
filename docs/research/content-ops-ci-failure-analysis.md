# CI 故障模式分析

> 调研日期: 2026-03-10 | 范围: sync-articles workflow 最近 15 次运行

## 运行记录

| 日期 | 时间 (UTC) | 结论 | 耗时 | 入库数 |
|------|-----------|------|------|--------|
| 3/9 | 02:41 | ✅ success | 16min | 24 |
| 3/8 | 02:39 | ❌ failure | 26min | 16 |
| 3/7 | 02:26 | ❌ cancelled | 30min | 16 |
| 3/6 | 02:33 | ❌ cancelled | 30min | 16 |
| 3/5 | 02:35 | ❌ cancelled | 30min | — |
| 3/4 | 05:42 | ✅ success | 1min | — |
| 3/4 | 05:37 | ✅ success | 1min | — |

## 根因分析

### 3/5-3/7: Timeout (30min 旧设置)

**根因**: timeout-minutes 为 30min（session 8 才改为 45min），且 HuggingFace 源回填量巨大。

- **3/6**: 当时仍有旧源 (google-ai 16篇, vercel 8篇)，HuggingFace 54 篇新文章，总处理量远超 30min
- **3/7**: HuggingFace 22 篇新文章，处理到第 13 篇时 30min 超时。额外 DeepMath 文章 JSON 解析失败（`Bad escaped character`）反复重试浪费时间

### 3/8: GPT Proxy 503 宕机

**根因**: GPT 代理 `gmn.chuangzuoli.com` 返回 503 `Service temporarily unavailable`。

- 整个 thenewstack 源的全部文章翻译失败（10 篇 × 3 次重试 = 30 次 API 调用全部 503）
- 脚本本身正常完成（26min），但 exit code 1（22 articles failed）
- RSS 采集和内容提取正常，仅 LLM 翻译环节失败
- **入库了 16 篇不需要翻译或之前已翻译的文章**

### 3/9: 恢复正常

- GPT 代理恢复，16min 处理 24 篇
- 去重机制生效，3/6-3/8 已入库的 RSS 条目被跳过

## 问题模式总结

| 问题类型 | 频率 | 影响 | 现有缓解 | 缺失 |
|----------|------|------|---------|------|
| Timeout | 3/7 天 (旧设置) | 中断整个同步 | timeout 已改为 45min | 无 source 级超时控制 |
| LLM 503 | 1/7 天 | 翻译失败，文章以原文入库 | 3 次重试 + 指数退避 | 无 fallback provider |
| JSON 解析 | 偶发 | 单篇失败 | 3 次重试 | sanitizeJsonString 已有，但特殊字符仍可能逃逸 |
| HuggingFace 量大 | 首次同步 | 54 篇处理慢 | feed 截断 100 条 | 无 per-source limit |

## 关键发现

1. **单点故障**: GPT 代理是唯一 LLM provider，宕机 = 翻译全部失败
2. **无 source 级超时**: 一个源卡住会拖垮整个 pipeline
3. **无优雅降级**: 翻译失败的文章仍然入库（status=draft），但缺少标记便于后续重翻
4. **Slack 通知只有 failure**: 没有 success summary，运维者无法快速确认每日状态
5. **45min timeout 足够**: 3/9 恢复后仅需 16min，正常情况下 45min 绰绰有余
