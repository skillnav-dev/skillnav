# SkillNav 内容管线技术评估报告

**评估日期**: 2026-03-08
**评估范围**: 核心管线脚本、数据库架构、CI/CD 流程、质量控制

---

## 一、可靠性评估

### 优势

1. **完善的重试机制**：`withRetry()` 指数退避 (1s → 2s → 4s)，3 次重试
2. **多层错误处理**：Readability → HTML fallback、RSS feed 格式修复、JSON 解析容错 `sanitizeJsonString()`
3. **日志和监控**：彩色进度条、GitHub Actions Job Summary、Slack 失败通知

### 问题

| 优先级 | 问题 | 影响 | 建议 |
|--------|------|------|------|
| HIGH | 内容提取依赖单一 Readability 库 | 库更新或 DOM 变化导致大量降级 | 添加 Cheerio 备用 + content length baseline 检测 |
| HIGH | 缺少关键路径监控 | 无单 stage 失败率追踪，无 SLA | health-check 添加失败率统计，按来源和阶段分类 |
| MEDIUM | 并发控制设计不当 | `createRateLimiter(10)` 不考虑实际耗时 | 改为基于响应时间的自适应限流 |
| MEDIUM | dry-run 生成假数据 | 无法真实验证翻译质量 | 支持 `--sample-translate` 模式 |

---

## 二、翻译质量评估

### 优势

1. **自适应翻译策略**（优秀）
   - ≤15K: 单次调用
   - 15K-50K: 分块翻译（三级切分 + 代码块保护）
   - >50K: 摘要策略（头 12K + 尾 5K）
   - 18 篇截断文章 100% 回填成功

2. **JSON 响应容错**：sanitize + fence 去除 + 字段验证，成功率 >99%

3. **多模型支持**：5 个 LLM provider 即插即用

### 问题

| 优先级 | 问题 | 影响 | 建议 |
|--------|------|------|------|
| HIGH | Prompt 无术语表/风格定义 | 不同 LLM 翻译风格不一致 | 添加术语表 + 风格示例 + chunked 连贯性检查 |
| MEDIUM | readingTime 中英文未区分 | 阅读时长偏低 ~15-20% | 中英文分别估算 |
| MEDIUM | relevanceScore 与 govern 评分独立 | 两套评分可能不一致 | 统一为翻译时生成，govern 阶段复用 |
| MEDIUM | 长文摘要丢弃中间内容 | 教程类长文核心被丢弃 | 按 article_type 分策略 |

---

## 三、可扩展性评估

### 优势

1. **RSS 源轻松扩展**：`SOURCES` 数组 + 关键词共享/自定义
2. **LLM provider 即插即用**：`PROVIDERS` 对象统一配置
3. **增量重处理**：`--retranslate-truncated` / `--limit` / `--offset` / `--skip-existing`

### 问题

| 优先级 | 问题 | 影响 | 建议 |
|--------|------|------|------|
| HIGH | 大批量处理无流式读取 | 万级文章可能 OOM | 改为流式 + 游标分页 |
| MEDIUM | 新增 article_type 迁移成本高 | 需改 DB + 3 个脚本 + 迁移 | 已通过 content_tier 设计规避 |
| MEDIUM | 新源发现完全手工 | 无自动化工具检测新 RSS feed | 轻量脚本定期扫描 |

---

## 四、成本效率评估

### 优势

1. 10 req/min 限流精准控制 API 成本
2. 增量同步避免重复翻译
3. 分块/摘要减少超长文章 token 消耗

### 成本估算

| 项目 | 估算 |
|------|------|
| LLM API | ~$1.3/day，~$39/月 |
| Supabase | 免费层，需升级 ~$25/月 |
| GitHub Actions | 免费额度内 |
| Cloudflare Workers | 免费额度内 |

### 问题

| 优先级 | 问题 | 建议 |
|--------|------|------|
| HIGH | LLM token 计算无预测和上界 | 统计平均 token 使用，超大文件自动选策略 |
| MEDIUM | 翻译质量的成本-收益未衡量 | 月度抽样用强模型验证，找成本最优点 |

---

## 五、数据质量评估

### 优势

1. **多层去重**：DB UNIQUE + 内存 Set + 幂等 upsert
2. **相关性过滤**：45 关键词 + 按源差异化过滤
3. **分类流程**：reclassify → govern 三阶段工作流

### 问题

| 优先级 | 问题 | 影响 | 建议 |
|--------|------|------|------|
| HIGH | 相关性评分基于前 500 字 | 长文核心在中间可能误判低分 | 低分文章加人工审核队列 |
| MEDIUM | 源质量差异未标识 | 同类型文章深度差 50 倍 | 添加 `source_quality_tier` |
| MEDIUM | 元数据不足 | 缺 keywords_zh, author, updated_at | sync 时提取 |

---

## 六、运维可维护性评估

### 优势

1. 所有脚本支持 `--dry-run` / `--audit` / `--apply` 三阶段
2. GitHub Actions 3 个 workflow 时间错开，Slack 通知完善
3. 支持 `workflow_dispatch` 手工触发

### 问题

| 优先级 | 问题 | 建议 |
|--------|------|------|
| MEDIUM | 日志无中央存储 | 集成 Slack 日志或 GitHub gist |
| MEDIUM | RSS 源/关键词硬编码 | 移到 Supabase table + admin API |
| MEDIUM | sync 中断无恢复点 | 添加 sync_job_id + `--resume` |
| LOW | 脚本间重复代码 | 统一 `scripts/lib/config.mjs` |

---

## 七、总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 可靠性 | 7/10 | 重试完善，内容提取和并发设计有风险 |
| 翻译质量 | 7/10 | 自适应策略优秀，prompt 和长文策略需优化 |
| 可扩展性 | 6/10 | 轻松添加源，大规模处理受限 |
| 成本效率 | 6/10 | 限流合理，token 成本无预测 |
| 数据质量 | 7/10 | 去重和分类完善，相关性评分有盲点 |
| 可维护性 | 7/10 | CLI 和 CI 优秀，配置管理欠缺 |

**综合：6.7/10** — 从 MVP 向生产级别演进，关键是解决 P0 问题。

---

## 八、优先级排序

### P0 — 立即执行（当内容策略确定后）

1. 内容提取备用方案（2h）
2. 长文摘要策略按类型分化（1h）
3. 并发限流改为自适应（1.5h）

### P1 — 本周

4. 扩展 health-check 失败率统计（2h）
5. LLM token 成本预测（1.5h）
6. Prompt 术语表 + 风格示例（2h）

### P2 — 下一迭代

7. 人工审核队列（3h）
8. 元数据补充（2h）
9. 日志中央存储（1h）
10. 配置管理（2h）

### P3 — 优化

- 流式大数据处理
- 质量评分成本曲线分析
- 新源自动发现
- 脚本代码重构
