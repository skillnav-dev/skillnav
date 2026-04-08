# auto-translate-radar 长论文超时失败

Date: 2026-04-08

## 症状

`node scripts/auto-translate-radar.mjs` 批量翻译时，8 篇中 7 篇报 `spawnSync node ETIMEDOUT`。成功的 1 篇是 9 chunk 短论文，失败的都是 10+ chunk。

## 根因

`auto-translate-radar.mjs` 用 `execFileSync` 调用 `translate-paper.mjs`，硬编码 `timeout: 5 * 60 * 1000`（5 分钟）。长论文（20 chunk / 137K chars）翻译 + DB 写入需要 ~10 分钟，远超 5 分钟限制。

## 修复

`scripts/auto-translate-radar.mjs` 第 139 行：`timeout` 从 `5 * 60 * 1000` 改为 `15 * 60 * 1000`。

15 分钟覆盖最长论文（20 chunk ~10 min）并留有余量，同时不至于单篇卡死阻塞整个队列。

## 验证

修复后重跑，7 篇全部成功（含 20 chunk 的 MinerU2.5-Pro），0 失败。

## 预防

- 批量脚本的子进程超时应根据实际任务耗时设置，不要凭感觉写死
- 长论文（>15 chunk）翻译耗时主要在 LLM API 调用，受网络和 rate limit 影响，需留足余量
