# 感知管线构建手册

> 提取自现役管线，随管线演进更新
> 引用约定：脚本引用省略 `scripts/` 前缀（其他目录写全路径）；行号仅辅助定位，代码演进后以函数名/关键字 grep 为准（如 `mergePapers @ paper-radar.mjs`）

## 1. 定位与适用范围

本手册用于快速搭建新的感知管线（抓取外部信号 → 过滤/融合 → LLM 增强 → 落地 DB/文件 → 调度与监控）。全部模式提取自 6 条已验证的现役管线（论文雷达、X/HN/Reddit/Newsletter 四条信号线、文章同步线），只收录已在生产中验证的设计。目标：写 DB 信号型新管线 1 小时内照做完成骨架（其他骨架耗时见 §4 步骤 1 标注）。

## 2. 六层解剖结构

每条感知管线由六层组成：源适配 → 融合/过滤 → 增强 → 输出 → 调度 → 可靠性。

### 2.1 源适配层

**职责**：每个数据源一个独立 fetcher，各自把原始响应归一化为同构对象（如 id/title/summary/source），下游不感知源差异。

**已验证设计**：
- 每源一个函数或一个文件、导出单个 fetch 函数（`scripts/lib/sources/` 模式：`fetchSmitheryServers()` 等）
- 外置配置名单：X 线 47 KOL 名单放 `config/x-kol-list.json`（scripts/scrape-x-signals.mjs:28-30）
- 免鉴权优先：HN 用 Firebase API（scrape-hn-signals.mjs:24-26）；Reddit 用公开 `.json` 端点免 key + 自定义 UA（scrape-reddit-signals.mjs:112, :43）
- 网页直抓需伪装浏览器 headers（scrape-signals.mjs:21-32）；反爬变体（Beehiiv）改抓页面嵌入 JSON（scrape-signals.mjs:124-157）
- LLM 也可以当源适配器：Newsletter 文本 LLM 提论文标题 → arXiv API 反查 ID（paper-radar.mjs:189, :218）

**参考实现**：`fetchHFPapers` paper-radar.mjs:77、`fetchSemanticScholarTrending` :121、`fetchUserTweets` scripts/lib/x-client.mjs:26

### 2.2 融合/过滤层

**职责**：多源去重合并、相关性过滤、评分排序。

**已验证设计**：
- 多源融合：按稳定 ID（arXiv ID）建 Map 去重，字段"非空优先"合并，评分 = 多源共振 1000 + upvotes×2 + citations，截取 Top 10（`mergePapers` paper-radar.mjs:262, :272-276, :293-294, :300）
- 三级关键词漏斗：正向 → 负向排除 → 开发者语境（scrape-hn-signals.mjs:103-116），HN/Reddit 共享同一套（scrape-reddit-signals.mjs:101-107）
- 短关键词（≤3 字符）必须用 `\b` 词边界正则 + regex 缓存，禁用 `includes()`（scrape-hn-signals.mjs:88-97）
- 白名单即过滤：KOL 名单本身就是过滤器，X 线不再做关键词过滤；但 URL 必须 `https://` 防 XSS（scrape-x-signals.mjs:135）
- 跨分区去重：Reddit 跨 subreddit 按 post ID 去重（scrape-reddit-signals.mjs:206-211）
- 文章线三层质量门（L0 关键词白名单 sync-articles.mjs:38-50, :60-71, :775-782；L1 规则门 :896-904；L2 LLM 双维评分 :907-924 + scripts/lib/quality.mjs:43-71）
- **非文章内容的 LLM 筛选**（如工具/产品条目判"是否 AI 开发者相关"）：没有现成函数可套——`scoreArticle`（输入 `{title_zh, content_zh, source}`，要求已翻译中文字段）和 `scoreArticleRelevance` 都是 articles 表专用 prompt，输出绑定文章状态机，不可直接复用。做法：套 §2.3 的批量模式（`callLLM` JSON mode + 10 条/批 + index 回填 + `Array.isArray` 校验），输出统一为 `{index, relevant: boolean, reason}`

### 2.3 增强层

**职责**：LLM 中文化/摘要/评分。原则：增强失败非致命，原文兜底。

**已验证设计**：
- 批量 LLM 摘要：10 条/次，JSON 带 index，按索引回填 Map（scrape-x-signals.mjs:51-75, :123-130；hn :147-165；reddit :150-168）
- 批量翻译标题+一句话简介，按索引回填（`translatePaperTitles` paper-radar.mjs:305, :336-341）
- 增强失败仅 warn，原文兜底展示（paper-radar.mjs:343-346）
- LLM 输出防御：剥 ```json 围栏 + `Array.isArray` 校验（paper-radar.mjs:206-211, :327-333）
- 增强可以延后：Newsletter 线不做 LLM，原文落盘，增强推迟到下游 generate-daily 编辑漏斗

### 2.4 输出层

**职责**：写 DB 或写文件，必须幂等。

**已验证设计（写 DB）**：
- 统一行结构（platform/external_id/score/likes/comments/signal_date/is_hidden），50 条/批 upsert，`onConflict: "platform,external_id"`（scrape-x-signals.mjs:170-181，hn :252-263，reddit :279-290 同模式）
- **复用表前先看 CHECK 约束**：community_signals 有 `CHECK (platform IN ('x','hn','reddit'))`（supabase/migrations/20260407_community_signals.sql:5），新 platform 值（如 'producthunt'）必须先迁移扩展 CHECK，否则整批 upsert 被数据库拒绝。复用 vs 建新表的判断与迁移模板见 §4 步骤 6
- 保护人工编辑：`upsert(..., { onConflict: "source_url", ignoreDuplicates: true })` 冲突不覆盖（sync-articles.mjs:930-934）；MCP 线 upsert 前剥离 EDITORIAL_FIELDS 10 字段（sync-mcp-servers.mjs:306-333）
- 写入前应用层预去重：批量查 `source_url IN (urls)` 用 Set 过滤（sync-articles.mjs:758-773）
- 数据库层兜底：`normalize_url()` 生成列 + 部分唯一索引拦截 URL 变体（supabase/migrations/20260325_source_url_normalized.sql:1-23）

**已验证设计（写文件）**：
- 按日期命名 JSON：`data/daily-newsletters/YYYY-MM-DD.json`（scrape-signals.mjs:238-242），30 天自动清理（:244-254）
- 人审 Markdown：`- [ ] **标题** \`arXivID\`` 复选框写入 Vault（paper-radar.mjs:361, :401, :566-569），3 天后自动归档（:579-592）
- 幂等保护人审：已存在且含勾选行的当日文件直接跳过，`--force` 才重生成（paper-radar.mjs:500-508）

### 2.5 调度层

**职责**：定时触发 + 参数化回补。

**已验证设计**：
- 统一 CST 日期锚点：`getCSTDate()` UTC+8 手算（scrape-x-signals.mjs:38-43），禁止裸 `new Date()` 当日期用
- 标准参数三件套：`--dry-run`（预览不写）、`--date`（指定日期回补，scrape-signals.mjs:170-181）、`--force`（覆盖重生成，paper-radar.mjs:482-486）
- 源发刊时区错位 fallback：TLDR 当天未发则抓昨天 URL（scrape-signals.mjs:85-96）
- 事件链式调度：generate-daily.yml 用 `workflow_run` 挂在上游采集完成后，条件 `conclusion != 'cancelled'`（部分失败仍产出）
- launchd/GH Actions 选择见 §6

### 2.6 可靠性层

**职责**：源隔离、限速、熔断、状态上报，保证单点故障不杀全管线、失败不静默。

**已验证设计**：
- 源隔离：每个 fetcher 内部 catch 后返回 `[]`（paper-radar.mjs:109-114 等）；源循环双层 try/catch，失败 `continue`（sync-articles.mjs:710, :747-750, :953-957）
- 限速策略按源定制：X 串行 6s（scrape-x-signals.mjs:33, :114）、Reddit 串行 2.5s（:40, :194）、HN 并发 10 路 `Promise.allSettled`（scrape-hn-signals.mjs:120-143）、LLM 10 req/min 节流（sync-articles.mjs:234-246）
- 所有 fetch 带 `AbortSignal.timeout`（paper-radar.mjs:58, :88 等）
- 配额熔断：3 次连续 402 early-exit（scrape-x-signals.mjs:102-111）
- 分级 status 上报：canonical 枚举 = pipeline_runs 表 CHECK 的**四值 `success` / `partial` / `failure` / `skipped`**（supabase/migrations/20260325_pipeline_runs.sql:6），失败态统一写 `"failure"`；partial 携带 errorMsg（scrape-signals.mjs:258-270）。⚠ 写非法 status 会被 CHECK 拒绝，而 reportRun never-throws 会静默吞掉写入失败——该 run 永远停在 duration_s=null（占用并发锁窗口且监控看不到失败）。（历史教训：三条社区信号脚本曾统一写非法值 `"failed"`、/api/health 也只匹配 `"failed"`，2026-07-02 已全部修正为 `"failure"`）
- quorum 门槛：Newsletter 线 <2 源成功即 failure 退出码 1（scrape-signals.mjs:210-217）
- 空结果即失败：合并后 0 条 → `exitCode=1`，拒绝静默成功（paper-radar.mjs:574-577）
- 退出码分级：仅"零插入且失败 ≥10"才 exit 1，瞬时失败留给下轮（sync-articles.mjs:1000-1004）
- 本地唤醒防御：`waitForNetwork` HEAD 探测双主机、6 次线性退避，不可达则不写文件 exit 1（paper-radar.mjs:49-73, :512-519）

## 3. 共享库接线指南（scripts/lib/）

### 必接（管线骨架四件套）

| 模块 | 调用签名 | 说明 |
|---|---|---|
| run-pipeline.mjs | `runPipeline(mainFn, { logger, defaultPipeline, dryRunFlag = "--dry-run" })`（run-pipeline.mjs:45） | 统一入口：markStart → 并发锁检查（duration_s=null 且 30 分钟内 → 跳过，:4-34）→ claimRun → mainFn → reportRun。`mainFn` 返回 `{ pipeline?, status, summary, errorMsg?, exitCode }`（status 只允许 §2.6 的四值枚举）；抛异常自动报 failure；`--dry-run` 跳过锁和上报 |
| logger.mjs | `createLogger(prefix)`（logger.mjs:6）→ `{ info, success, warn, error, done, progress, progressEnd, summary, setOutput }` | 统一日志 + GitHub Actions 输出 |
| supabase-admin.mjs | `createAdminClient()`（supabase-admin.mjs:7） | service_role 绕 RLS，需 `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`。锁与上报依赖 DB，故为必接 |
| report-run.mjs | `markStart()` :7、`claimRun(pipeline)` :16、`reportRun(pipeline, status, summary, errorMsg)` :61 | 走 runPipeline 时无需直接调用；reportRun 5s 超时、never throws |

**pipeline_runs 上报契约**（不遵守则监控失明）：
- 表关键列：`pipeline` / `status` / `duration_s` / `summary`(JSON) / `error_msg`。status 只允许四值枚举（CHECK 约束，见 §2.6）
- **summary 的插入计数键名是监控契约**：/api/health dry 检测只识别 `upserted` / `relevant` / `inserted` 三个键（route.ts:91-100）；failover-check 按管线读指定键（sync-articles 读 `inserted`，社区线读 `upserted`）。约定：写 DB 信号线用 `upserted`，文章线用 `inserted`——换成 rows/count 等自定义键名会让 dry 检测失效。现役实例返回值：`{ fetched, upserted, errors, kols }`（scrape-x-signals.mjs:192）

### 可选

| 模块 | 调用签名 | 何时接 |
|---|---|---|
| llm.mjs | `callLLM(system, user, maxTokens=16384)`（JSON mode，仅 OpenAI 兼容 provider 生效）、`callLLMText(...)`、`translateArticle({title, summary, content})`、`scoreArticleRelevance(...)` | 需要 LLM 增强时。provider 层在 `llm-provider.mjs`（Vercel AI SDK）：408/429/5xx/超时自动重试 3 次（遵守 retry-after）；配置 `LLM_FALLBACK_PROVIDER` 时，主 provider 出现可重试错误即切到备用，10 分钟后再试主 provider；单次请求超时 `LLM_TIMEOUT_MS`（默认 120s）。业务层：glossary 注入、长文分块、JSON sanitize |
| retry.mjs | `withRetry(fn, { maxRetries=3, baseDelay=1000, label })`（retry.mjs:32） | 非 LLM 的 HTTP 抓取；400/401/403/404 不重试（:6-21）。llm.mjs 自带重试，不要再包 |
| quality.mjs | `scoreArticle({title_zh, content_zh, source})`（quality.mjs:43）→ `{audience_fit, credibility, action, reason}`；`applyQualityDecision(current, action)` :77 只降不升 | 内容需质量门时；评分失败兜底 draft（:67-70） |
| validate-env.mjs | `validateEnv(["KEY1","KEY2"])`（validate-env.mjs:6），缺失 exit(2) | main 入口前校验环境变量 |
| x-client.mjs | `fetchUserTweets`（x-client.mjs:26） | 仅 X 线 |
| sources/ | `normalizeGithubUrl(url)` @ sources/awesome-skills.mjs:24 | 新增结构化数据源。目录约定：每源一文件、导出单个 fetch 函数 |
| publishers/ | `markdownToWechatHtml` @ wechat.mjs、`formatZhihuArticle` @ zhihu.mjs、`formatXhsCaption` @ xiaohongshu.mjs、`formatXThread` @ twitter.mjs（RSS 由 `src/app/api/rss/daily/route.ts` 直接生成） | 输出层需多渠道格式转换时 |

### 环境变量清单

| 变量 | 谁需要 | 登记处 | 缺失时表现 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | supabase-admin.mjs（含 runPipeline 锁与上报） | .env.local + CI secrets | createAdminClient 抛错，锁与上报全失效 |
| `DEEPSEEK_API_KEY` / `GEMINI_API_KEY` / `GPT_API_KEY` | llm.mjs（按 provider 取用） | .env.local + CI secrets | 该 provider 调用失败 → 切到 `LLM_FALLBACK_PROVIDER` |
| `LLM_PROVIDER` / `LLM_FALLBACK_PROVIDER` | llm.mjs 路由（现役 deepseek/gpt） | .env.local + workflow job `env:` 直写 | 走错 provider（如 OpenAI 403） |
| `X_API_KEY` | x-client.mjs（仅 X 线） | .env.local + CI secrets | X 抓取全 401/402 |
| `SLACK_WEBHOOK_URL` | workflow 失败通知 step | 仅 CI secrets | 失败静默无通知 |

**新增环境变量需三处同步**：`.env.local`（本地）、`gh secret set NAME`（repo secrets）、workflow job 级 `env:` 映射——缺任一处则 CI/本地行为分裂（典型症状：本地能跑、CI 首跑挂在 validateEnv exit(2)）。

### 标准接线模板（实例：scrape-hn-signals.mjs:17-20, :274）

```js
import { createLogger } from "./lib/logger.mjs";
import { runPipeline } from "./lib/run-pipeline.mjs";
import { createAdminClient } from "./lib/supabase-admin.mjs";
import { callLLMText } from "./lib/llm.mjs";   // 可选

const log = createLogger("my-pipeline");
async function main() {
  // 抓取 → 过滤 → upsert
  // status: success/partial/failure/skipped 四值（§2.6）；插入计数键名 upserted/inserted 是监控契约（见上方上报契约）
  return { status: "success", summary: { scanned, upserted }, exitCode: 0 };
}
runPipeline(main, { logger: log, defaultPipeline: "my-pipeline" });
```

## 4. 新建管线操作步骤

目标：写 DB 信号型 1 小时内完成可跑骨架（其他类型见步骤 1 耗时标注）。

1. **选骨架模板**（三选一，复制最接近的现役脚本改造，并在步骤 11 复制对应的现役调度文件）：
   - 写 DB 的社区型信号 → 复制 `scripts/scrape-hn-signals.mjs`（三条社区线逐行同形，HN 最简、免鉴权，~280 行）— 预期 ~1h
   - 写文件 + 人审 Markdown → 复制 `scripts/paper-radar.mjs` — 预期 ~1.5h
   - 多 RSS 源 + 质量门写 articles 表 → 复制 `scripts/sync-articles.mjs`（1000+ 行、含三层质量门）— 预期 ~半天，1 小时承诺不适用
2. **头部固定件**：保留 dotenv 双加载（`.env.local` 优先 + `.env`，参照 scrape-x-signals.mjs:13-15）、`createLogger("my-pipeline")`、`getCSTDate()`；需要环境变量的在入口调 `validateEnv([...])`。新增鉴权源的 secret 登记走 §3「环境变量清单」的三处同步
3. **写源适配层**：每源一个 fetch 函数，内部 try/catch 返回 `[]`，带 `AbortSignal.timeout`，归一化为同构对象；有外置名单的放 `config/` JSON
4. **写融合/过滤层**：多源用 Map 按稳定 ID 去重（参照 mergePapers paper-radar.mjs:262）；关键词过滤用三级漏斗 + ≤3 字符词边界正则（参照 scrape-hn-signals.mjs:88-116）；LLM 相关性筛选套 §2.2 末条的批量判定模式
5. **写增强层（可选）**：`callLLMText` 批量 10 条/次，JSON index 回填 Map；失败仅 warn，原文兜底
6. **输出目标准备（写 DB 时）**：先判断复用现有表还是建新表——
   - **复用**（首选，字段能映射就复用）：注意 community_signals 的 `CHECK (platform IN ('x','hn','reddit'))`，新 platform 值必须先加迁移扩展 CHECK，否则 upsert 被数据库拒绝（见 §2.4）
   - **建新表**：以 `supabase/migrations/20260407_community_signals.sql` 为模板，三要件缺一不可：a) UNIQUE 约束 = 代码里的 `onConflict` 键（该表靠 `UNIQUE(platform, external_id)` 支撑幂等，无约束则 upsert 直接报错）；b) RLS 双策略（`service_role_full_access` 全权 + `anon_select` 只读可见行）；c) 按查询模式建索引。迁移文件命名 `YYYYMMDD_<name>.sql` 放 `supabase/migrations/`，应用方式：`npx supabase db push` 或 Supabase Dashboard SQL Editor 手动执行
7. **写输出层**：
   - DB：统一行结构 → dry-run 分支返回 `{status:"skipped"}` → 50 条/批 upsert + 明确 `onConflict` 键；已有人工编辑字段的表要么 `ignoreDuplicates:true` 要么剥离编辑字段
   - 文件：按日期命名，加幂等跳过（已存在则 skip，`--force` 覆盖）
8. **接可靠性**：main 返回四值 status（success/partial/failure/skipped，见 §2.6）+ exitCode；空结果 exit 1；限速按源脾气定（串行 sleep 或 `Promise.allSettled` 并发）
9. **收尾接 runPipeline**：`runPipeline(main, { logger: log, defaultPipeline: "my-pipeline" })`，自动获得并发锁 + pipeline_runs 上报（summary 键名契约见 §3）
10. **本地验证**：先 `node scripts/my-pipeline.mjs --dry-run` 输出人工核对；再小样本真跑 ≤5 条——现役脚本无 `--limit` 参数，做法是临时在源数组上加 `.slice(0, 5)` 截断放行，全流程验证通过后还原再全量
11. **配调度**（按 §6 决策树二选一，均为复制现役文件改造）：
    - GitHub Actions：复制 `.github/workflows/scrape-community-signals.yml`（最简采集型 workflow）改造，保留要件 checklist：`actions/checkout` + `setup-node`(node 20, cache npm) + `npm ci`；workflow 级 `concurrency` group + `cancel-in-progress: false`；`timeout-minutes`；`workflow_dispatch`（含 dry_run input）；cron 注释写清 CST 换算；job 级 `env:` 注入 secrets（清单见 §3）；失败通知接 `SLACK_WEBHOOK_URL`
    - launchd：复制 `~/Library/LaunchAgents/com.skillnav.paper-radar.plist` 改名为 `com.skillnav.<name>.plist`；要点：显式 `PATH`、`WorkingDirectory` 指向仓库根、stdout/stderr 合并写 /tmp 日志、`StartCalendarInterval` 或 `StartInterval`；加载生效：`launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.skillnav.<name>.plist`
12. **接健康监控**（机制详见 §6 末尾「健康监控双层」）：走 runPipeline 即自动写 pipeline_runs，**stale 检测自动覆盖，dry 检测需注册**——把 pipeline 名加进 `src/app/api/health/route.ts` 的 `SCRAPE_PIPELINES` 白名单（如属已知常态 0 插入再加 `KNOWN_DRY_EXEMPT`）；需要本地热备的另在 `failover-check.mjs` 注册（其 dry 检测只查 sync-articles + 三条社区线）。注意 stale 检测是全局共享的——其他管线在跑就永不 stale，未注册 dry 检测的新管线连续静默 0 插入不会有任何告警

## 5. 踩坑防御 checklist

新管线上线前逐项勾选。单一出处原则：每条只写「坑现象 → 防御 → 反链」，设计细节与行号以反链章节为准。

**时区**
- [ ] CI 里 `new Date()` 返回 UTC，窗口偏移 8h → `getCSTDate()` 统一锚点（日报窗口另用 `setUTCHours(15,59,59)`，generate-daily.mjs）→ 见 §2.5
- [ ] 源按外国时区发刊，北京早晨跑时当天内容未发 → fallback 昨天 URL → 见 §2.5

**解析/匹配**
- [ ] 短关键词子串假阳性（`"ai"` 匹配到 `"maintain"`）→ `\b` 词边界正则 → 见 §2.2
- [ ] API 响应嵌套层级与文档不符，解析到 0 条 → 多形态归一化（`fetchUserTweets` @ x-client.mjs）
- [ ] RSS boilerplate（订阅表单）混入正文被翻译 → 抓取时 `stripBoilerplate()` 清洗（sync-articles.mjs）

**环境/配额**
- [ ] 脚本漏 `dotenv.config()`，本地读不到 .env（CI secrets 掩盖问题）→ dotenv 双加载 → 见 §4 步骤 2
- [ ] 付费 API 额度耗尽后逐条空耗 → 连续 402 early-exit 熔断 → 见 §2.6
- [ ] LLM 重试过激 / 主 provider 持续失败 → llm.mjs 自带重试 + 主备切换，不要自己再包 → 见 §3 可选表
- [ ] 新增 secret 只登记了一处 → 三处同步 → 见 §3 环境变量清单

**IP 封锁（GitHub Actions 专属）**
- [ ] Cloudflare/a16z/Beehiiv 封 CI IP（本地正常）→ 单源 try/catch 隔离 → 见 §2.6
- [ ] 社区源 dry 多为 IP/auth 层问题，本地重跑也无用 → failover 只告警不自动触发 → 见 §6

**静默失败**
- [ ] CI 正常跑但插入 0 连续多天，存在性检查发现不了 → dry 检测需注册 + summary 键名契约 → 见 §4 步骤 12、§3
- [ ] status 写了非法值（如 "failed"）被 CHECK 拒绝且 reportRun 静默吞掉 → 四值枚举 → 见 §2.6
- [ ] 合并后 0 条仍报成功 → 空结果 exitCode=1 → 见 §2.6
- [ ] Mac 唤醒后 Wi-Fi 未连写出空文件 → `waitForNetwork` 探测 → 见 §2.6

**幂等/覆盖**
- [ ] 重跑覆盖用户打勾/人工编辑 → 文件线勾选跳过 / DB 线 `ignoreDuplicates` 或剥离编辑字段 → 见 §2.4
- [ ] URL 变体绕过应用层去重 → `normalize_url()` 生成列 + 部分唯一索引 → 见 §2.4
- [ ] 新 platform 值撞现有表 CHECK 约束 → 先迁移扩展 → 见 §4 步骤 6
- [ ] 与 CI 双跑冲突 → runPipeline 并发锁 → 见 §3 必接表

## 6. 调度决策树

```
任务是否满足任一：
├─ 依赖本地文件系统 / Vault（人审打勾环节）？
├─ 是 CI 的热备兜底？
│
├─ 是 → launchd 本地
│   plist 模板与加载命令见 §4 步骤 11；现役实例见 §7 附录表调度列
│
└─ 否（纯 DB 读写 + LLM 调用、无本地依赖）→ GitHub Actions
    workflow 要件 checklist 见 §4 步骤 11；现役实例见 §7 附录表调度列
    事件链式：generate-daily.yml 用 workflow_run 挂上游完成后，
        条件 conclusion != 'cancelled'（部分失败仍产出可用文章）
    前科：CF 防火墙封 CI IP（Cloudflare RSS/Beehiiv 403），
        受影响源要么本地兜底、要么换嵌入 JSON 端点
```

健康监控双层（本节为唯一出处；新管线注册动作见 §4 步骤 12）：
1. `/api/health`：查 pipeline_runs 新鲜度，>36h 无 run 返回 503 stale（全局共享，任一管线在跑就不 stale）；dry/degraded 检测只覆盖 `SCRAPE_PIPELINES` 硬编码白名单内的管线（src/app/api/health/route.ts:18-29, :89-108），已知常态 0 插入的进 `KNOWN_DRY_EXEMPT`；Better Stack 5min 外部 ping
2. `failover-check.mjs` launchd 每小时：stale(>36h) 或 dry-sync(24h/≥3runs/0 inserted) → 本地补跑 sync-articles（复用 run-pipeline.mjs 并发锁防与 CI 双跑，10min 超时）；社区三线 dry 仅告警不自动触发；覆盖名单同为硬编码（failover-check.mjs:24, :79），新管线要热备需在此注册

## 7. 附录：6 条现役管线索引

| 脚本 | 源 | 输出 | 调度 |
|---|---|---|---|
| scripts/paper-radar.mjs | HF Papers + Semantic Scholar + Newsletter（LLM 提取） | Vault 雷达 Markdown（`- [ ]` 人审复选框，3 天归档） | launchd 每天 14/17/20 点（com.skillnav.paper-radar.plist） |
| scripts/scrape-x-signals.mjs | TwitterAPI.io，47 KOL（config/x-kol-list.json） | community_signals 表（50/批 upsert） | GitHub Actions（scrape-community-signals.yml 0,6,12 UTC） |
| scripts/scrape-hn-signals.mjs | HN Firebase API top 500 | community_signals 表 | GitHub Actions（同上） |
| scripts/scrape-reddit-signals.mjs | Reddit 公开 .json 端点，10 subreddits | community_signals 表 | GitHub Actions（同上） |
| scripts/scrape-signals.mjs | 5 个 newsletter 网页直抓 | data/daily-newsletters/YYYY-MM-DD.json（30 天清理） | 日报链路上游（喂 generate-daily 编辑漏斗，支持 --date 回补） |
| scripts/sync-articles.mjs | 15 RSS 源 | articles 表（L0/L1/L2 质量门 + source_url 幂等） | GitHub Actions（sync-articles.yml UTC 22:15/10:15 = CST 06:15/18:15）+ failover-check 本地热备 |

配套闭环脚本（非独立感知线，但属雷达闭环）：scripts/auto-translate-radar.mjs — 扫描雷达打勾 `- [x]`（正则 auto-translate-radar.mjs:32）→ 双重幂等（arXiv ID + Supabase source_url，:55-76, :95）→ 串行调 translate-paper.mjs（篇间 sleep 15s，:133-138）→ 退出码 2 归类"需手动 MinerU 回退"（:154-162）→ launchd 每晚 22:00（com.skillnav.auto-translate-radar.plist）。failover-check.mjs 为 launchd 每小时（com.skillnav.failover-check.plist StartInterval=3600）。
