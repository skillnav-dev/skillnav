# ar5iv 图表重论文抽取残缺

- **日期**: 2026-04-13
- **涉及**: `scripts/translate-paper.mjs`, arXiv ar5iv 转换质量

## 症状

`2604.07823 LPM 1.0`（17B 参数视频角色表演模型）经 `auto-translate-radar` 翻译后：

- ar5iv 报告: `11 sections` → 实际抽取 `5 sections, 6,730 chars`
- 翻译成品: `1,060 字`（其他同批论文 20k+ 字）
- Vault 文件只有 Summary + Acknowledgments 两节，主体 Introduction/Method/Experiments 全部缺失

## 根因

ar5iv（LaTeXML 实验性服务）对**图表/视频/多模态插图密集**的论文转换失败率高，会静默丢弃无法渲染的 section。80KB 的原始 HTML 里只有少量可提取文本。`translate-paper.mjs` 信任 ar5iv 的 section 计数，未对字数做下限校验。

## 修复（本次）

走 PDF fallback 手工重翻：

```bash
curl -sL "https://arxiv.org/pdf/2604.07823" -o /tmp/papers/2604.07823.pdf
node scripts/translate-paper.mjs --local /tmp/papers/2604.07823.pdf --arxiv-id 2604.07823 --force
```

结果: `local-pdf` 源 26 chunks / **43,404 字**（40 倍差距），完整覆盖全文。注意 `--force` 会把 status 重置为 draft，需要手动 republish。

## 已知先例

M3 阶段 RT-2 论文也遇到过 ar5iv 404 → PDF fallback，说明这不是孤立问题。

## 建议（未实施）

在 `translate-paper.mjs` 加入**字数下限校验**：若 ar5iv 抽取 chars < 5,000（或 < 估算摘要 * 3），自动降级到 PDF fallback，避免需要人工发现残缺。触发时 log warn 并在 DB 标记 `source='pdf-fallback-auto'` 便于审计。

## 判断清单（手动审查论文 draft 时）

- [ ] content_zh 长度 < 5,000 字？→ 大概率抽取残缺
- [ ] Vault 文件只有 Summary/Conclusion/Acknowledgments？→ 确定 ar5iv 翻车
- [ ] 原论文图表密集（video gen / diffusion / 3D）？→ 高风险群体，重点抽查
