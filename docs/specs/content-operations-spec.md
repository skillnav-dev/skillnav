# 内容运营管线规范 (Content Operations Spec)

> Version: 1.0 | Date: 2026-03-10 | Status: **待审批**
>
> 上游依赖: content-pipeline-spec.md (内容管道), content-distribution-spec.md (分发)
>
> 本文档定义内容运营的**端到端时序编排**：采集调度 → 故障处理 → 编辑审核 → 发布节奏 → 监控告警。

---

## 1. 设计目标

| 目标 | 指标 |
|------|------|
| 时效性 | 新文章 ≤12h 内完成采集+翻译，赶上下一个读者高峰 |
| 可靠性 | 月成功率 ≥ 95%（≤1.5 天/月失败） |
| 可持续 | 人工投入 ≤ 30min/天（审核+发布），≤ 6h/周（含分发） |
| 覆盖率 | 10 个源的每日新内容 100% 入库（翻译失败也入库原文） |

## 2. 核心矛盾与解法

**矛盾**: 8/10 源集中在 UTC 16:00-22:00（CST 00:00-06:00）发布，正好是中国凌晨。

**解法**: 双时段同步，分别赶在中国早高峰 (08:00) 和晚高峰 (20:00) 之前完成。

```
美国源发布高峰                     中国读者高峰
UTC 16:00-22:00 ──────────── CST 08:00-10:00 (早) / 20:00-23:00 (晚)
    ↓                              ↑                    ↑
[UTC 22:15 晨间同步] ──翻译──→ 06:30 就绪        [UTC 10:15 午后同步] ──翻译──→ 18:30 就绪
```

## 3. 调度编排

### 3.1 Cron 总表

| 任务 | Cron (UTC) | 北京时间 | 耗时 | 文件 |
|------|-----------|---------|------|------|
| **晨间采集** | `15 22 * * *` | 06:15 | ~15min | sync-articles.yml |
| **午后采集** | `15 10 * * *` | 18:15 | ~10min | sync-articles.yml (同文件双 cron) |
| **健康检查** | `45 23 * * *` | 07:45 | ~2min | health-check.yml |
| **周刊生成** | `0 0 * * 1` | 周一 08:00 | ~3min | generate-weekly.yml |
| **Skills 同步** | `0 2 * * 1` | 周一 10:00 | ~50min | sync-skills.yml |
| **精选 Skills** | `0 3 * * 3` | 周三 11:00 | ~10min | sync-curated-skills.yml |

### 3.2 调度设计理由

**双同步 (核心变更)**:
- **晨间 UTC 22:15**: 捕获美国全天发布 (UTC 16:00-22:00 = 8/10 源高峰)。翻译完成 ~CST 06:30，赶在 08:00 早高峰前就绪。
- **午后 UTC 10:15**: 捕获欧洲日间 (HuggingFace, ai-coding-daily) + Simon Willison 夜间补发 + 前一轮遗漏。翻译完成 ~CST 18:30，赶在 20:00 晚高峰前就绪。
- 第二次同步因去重机制，实际 LLM 调用量很少（大部分文章已入库），预计 ~10min。

**偏移 15 分钟**:
- GitHub Actions 整点调度有 5-15 分钟排队延迟，用 `:15` / `:45` 错峰。

**健康检查移至 UTC 23:45**:
- 在晨间采集完成后运行（22:15 + 15min = ~22:30 完成），验证入库结果。

**周刊生成移至周一 UTC 00:00**:
- 在晨间采集后运行，确保上周末最后一批文章已入库。

### 3.3 GitHub Actions 分钟预算

| 项目 | 频次 | 单次 | 月合计 |
|------|------|------|--------|
| 晨间采集 | 30 次/月 | ~15min | 450 min |
| 午后采集 | 30 次/月 | ~10min | 300 min |
| 健康检查 | 30 次/月 | ~2min | 60 min |
| 周刊生成 | 4 次/月 | ~3min | 12 min |
| Skills 同步 | 4 次/月 | ~50min | 200 min |
| 精选 Skills | 4 次/月 | ~10min | 40 min |
| 部署 | ~15 次/月 | ~8min | 120 min |
| **合计** | | | **~1,182 min** |

GitHub 免费额度: 2,000 min/月。余量 ~800 min，安全。

## 4. 故障处理

### 4.1 已知故障模式

基于 3/5-3/9 连续故障分析:

| 故障 | 根因 | 频率 | 影响 |
|------|------|------|------|
| GPT Proxy 503 | `gmn.chuangzuoli.com` 不稳定 | ~1 次/周 | 翻译全部失败 |
| Timeout | HuggingFace 等大量新文章 | 首次同步/回填 | 中断整个管线 |
| JSON 解析 | LLM 输出含非法转义字符 | 偶发 | 单篇失败 |

### 4.2 LLM Fallback 链

```
GPT (gmn.chuangzuoli.com)
  ↓ 连续 3 篇 503/timeout
DeepSeek (直连 API)
  ↓ 连续 3 篇失败
跳过翻译，原文入库 (status=draft, content_zh=NULL)
```

**实现方式**: 新增环境变量 `LLM_FALLBACK_PROVIDER=deepseek`，脚本内增加 provider 切换逻辑。

### 4.3 Per-Source 超时

```javascript
const SOURCE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min per source
```

单源处理超过 10 分钟时，跳过剩余文章，继续下一源。已处理的文章正常入库。

### 4.4 Workflow 级重试

```yaml
# sync-articles.yml 增加自动重试
- uses: nick-fields/retry@v3
  with:
    timeout_minutes: 40
    max_attempts: 2
    retry_wait_seconds: 120
    command: node scripts/sync-articles.mjs $ARGS
```

失败后等 2 分钟重试 1 次（可能是 API 暂时性故障）。总超时 = 40min × 2 = 80min，在 GitHub Actions 6h 限制内。

### 4.5 通知升级

| 事件 | 通知内容 | 渠道 |
|------|---------|------|
| 同步成功 | `✅ Sync: +{N} 篇 / 跳过 {M} / 失败 {F}` | Slack |
| 同步失败 | `❌ Sync failed: {error}` + 链接 | Slack |
| 健康检查异常 | `⚠️ Health: {details}` | Slack |
| Provider 降级 | `🔄 LLM fallback: GPT → DeepSeek` | Slack (同步摘要内) |

## 5. 每日编辑 SOP

### 5.1 每日时间线 (CST)

```
06:15  [自动] 晨间采集启动 (UTC 22:15)
06:30  [自动] 晨间采集完成，新文章入库 (status=draft)
07:45  [自动] 健康检查 → Slack 报告

09:00  [人工] 编辑审核窗口 (15-30 min)
       ├─ 打开 Admin /admin/articles，筛选 status=draft
       ├─ 扫描标题 + 摘要，评估发布价值
       ├─ 选择 2-3 篇 → published
       ├─ 低质量 → hidden
       └─ 可选: 添加编辑点评

18:15  [自动] 午后采集启动 (UTC 10:15)
18:30  [自动] 午后采集完成

20:00  [人工] 可选: 二次审核 (10 min)
       ├─ 检查午后新入库的 draft
       └─ 补发 1-2 篇到 published

21:00  [人工] 分发推送 (按 content-distribution-spec.md)
       ├─ X/Twitter: 今日精选推文
       ├─ 公众号: 推送精选文章 (群发 or 发布)
       └─ 即刻: 微内容分享
```

### 5.2 发布决策标准

| 条件 | 动作 |
|------|------|
| relevance_score ≥ 5 + 内容完整 + 翻译质量好 | → published |
| relevance_score ≥ 5 + 翻译有瑕疵但核心信息准确 | → published (可加编辑注) |
| relevance_score ≥ 5 + 翻译失败 (content_zh=NULL) | → 保持 draft，等下次同步重翻 |
| 内容与定位无关 / 过时 / 营销性质 | → hidden |
| 特别优质 + 与 Skills/MCP 强相关 | → published + is_featured=true |

### 5.3 发布节奏目标

| 内容层 | 频率 | 来源 |
|--------|------|------|
| 日常资讯 | 2-3 篇/天 (工作日) | RSS 自动采集 + 人工审核 |
| 周刊 | 1 篇/周 (周一) | 自动生成 + 人工审核发布 |
| 深度内容 | 1-2 篇/月 | 原创 (使用体验/评测/趋势) |

**底线承诺**: 周刊按时发布。日更尽力而为，不因追求数量牺牲质量。

## 6. 周度编排

### 6.1 每周一 (周刊日)

```
06:30  [自动] 晨间采集完成（含周末最后一批文章）
08:00  [自动] 周刊生成 (generate-weekly.mjs) → draft 入库
09:00  [人工] 审核周刊 + 日常 draft (30-45 min)
       ├─ 周刊: 检查编者按 + 文章精选 + 格式 → published
       ├─ 日常: 选 2-3 篇 → published
       └─ 周刊分发: X Thread + 公众号 + 知乎
```

### 6.2 每周五 (回顾日, 可选)

```
[人工] 本周回顾 (30 min)
├─ 检查本周发布数量 & 质量
├─ 检查管线健康: 同步成功率、翻译失败率
├─ 源 RSS 可用性: 是否有源连续多天无新内容
└─ 下周选题: 是否有值得深度写的话题
```

## 7. 监控体系

### 7.1 日报 (Slack, 自动)

每次同步完成后推送:
```
✅ SkillNav 晨间采集 (06:30 CST)
新增: 5 篇 | 跳过: 152 | 失败: 0
待审核: 8 篇 draft
LLM: GPT (正常)
```

### 7.2 周报 (健康检查增强, 自动)

每周一健康检查额外输出:
- 上周同步成功率: X/7 天
- 上周新增文章: N 篇 (published: X, draft: Y, hidden: Z)
- 各源供稿量排名
- LLM 降级事件数

### 7.3 告警阈值

| 指标 | 阈值 | 动作 |
|------|------|------|
| 连续同步失败 | ≥ 2 天 | Slack 告警 + 人工排查 |
| 单源连续无新内容 | ≥ 14 天 | 检查 RSS URL 是否变更 |
| Draft 堆积 | ≥ 30 篇未审核 | Slack 提醒编辑清理 |
| LLM 降级 | 触发即通知 | 检查 GPT Proxy 状态 |

## 8. 实施计划

### Phase 1: 调度优化 (本次)

| 变更 | 文件 | 说明 |
|------|------|------|
| 双 cron | sync-articles.yml | `15 22 * * *` + `15 10 * * *` |
| 健康检查时间 | health-check.yml | `0 6 * * *` → `45 23 * * *` |
| 周刊时间 | generate-weekly.yml | `0 4 * * 1` → `0 0 * * 1` |
| 成功通知 | sync-articles.yml | 新增 `if: success()` Slack 步骤 |
| cron 偏移 | 所有 workflow | 整点 → 偏移 15/45 分钟 |

### Phase 2: 可靠性增强 (下次会话)

| 变更 | 文件 | 说明 |
|------|------|------|
| LLM Fallback | scripts/lib/llm.mjs | 增加 provider 自动降级 |
| Per-source timeout | scripts/sync-articles.mjs | 单源 10min 超时 |
| Workflow 重试 | sync-articles.yml | nick-fields/retry@v3 |

### Phase 3: 审核增强 (后续)

| 变更 | 文件 | 说明 |
|------|------|------|
| 审核队列视图 | Admin 后台 | 筛选 draft + 批量操作 |
| 周报输出 | health-check.mjs | 增加周维度统计 |
| Draft 堆积告警 | health-check.mjs | 30 篇阈值 |

## 9. 与现有规范的关系

| 规范 | 关系 |
|------|------|
| content-pipeline-spec.md | 本文是其**运营层实现**，pipeline spec 定义"做什么"，本文定义"什么时候做、怎么做" |
| content-distribution-spec.md | 本文的 §5.1 分发步骤引用其 SOP |
| design-system.md | 无直接关系 |
| ui-ux-redesign-v1.md | 无直接关系 |

---

## 附录 A: 调研文档索引

| 文档 | 路径 |
|------|------|
| CI 故障模式分析 | docs/research/content-ops-ci-failure-analysis.md |
| RSS 发布时间与同步窗口 | docs/research/content-ops-rss-timing.md |
| 内容运营最佳实践 | docs/research/content-ops-best-practices.md |
| 管线配置审计 | (Agent 报告, 未独立存档) |

## 附录 B: 当前 vs 新调度对比

```
当前:
UTC  00:00 ─── sync-articles ───────────────── 06:00 ── health-check
     (CST 08:00)                                (CST 14:00)

新方案:
UTC  10:15 ── sync(午后) ── ... ── 22:15 ── sync(晨间) ── 23:45 ── health ── 00:00 ── weekly(周一)
     (CST 18:15)              (CST 06:15)         (CST 07:45)    (CST 08:00)

读者高峰:           ↑ 20:00 晚高峰就绪              ↑ 08:00 早高峰就绪
```
