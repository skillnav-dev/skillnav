# arXiv 论文翻译最佳实践调研

- **日期**: 2026-04-01
- **背景**: translate-paper.mjs 翻译质量差（PDF 文本提取丢结构/图片/公式，DeepSeek 翻译生硬）
- **方法**: 4-agent 并行调研（提取工具、LLM 对比、开源项目、翻译策略）

## 文本提取方案对比

| 方案 | 结构 | 公式 | 图片 | 成本 | 推荐 |
|------|------|------|------|------|------|
| **arXiv LaTeX 源码** | 完美 | 完美 | 引用路径 | 免费 | ★★★★★ |
| **ar5iv HTML** | 90% | LaTeX 完整 | img 标签 | 免费 | ★★★★★ |
| **Marker** | 85% | 90% | 提取为文件 | 免费 | ★★★★ |
| **pdfjs-dist** (当前) | 20% | 丢失 | 丢失 | 免费 | ★ |
| Nougat (Meta) | 75% | 80% | 丢弃 | 免费 | 不推荐（重复退化） |
| GROBID | 85% | 差 | 差 | 免费 | 不推荐（公式差） |
| MathPix | 优秀 | 业界最强 | 优秀 | $0.005/页 | 备选 |

**结论**: ar5iv HTML 优先 > LaTeX 源码 > Marker > pdfjs-dist

**LaTeX 占位符策略** (LaTeXTrans): 公式/环境替换为 `[[PLACEHOLDER]]` → 只翻译纯文本 → 回填。50 篇基准测试验证有效。

## 翻译引擎对比

| 模型 | 术语精度 | 学术语感 | 成本/篇(30K tokens) | 推荐场景 |
|------|---------|---------|-------------------|---------|
| DeepSeek V3 | ★★★½ | ★★★ | $0.025 | 批量翻译 |
| **Claude Sonnet** | ★★★★½ | ★★★★½ | $0.69 | 高价值论文（200K 上下文，无需分块） |
| GPT-4o | ★★★★ | ★★★★ | $0.44 | 分块可靠性最高（截断率最低） |
| Gemini 2.5 Pro | ★★★★ | ★★★★ | $0.44 | 超长论文（1M 上下文） |
| Qwen 2.5 | ★★★★ | ★★★★½ | 自部署 | 中文优化，但分块截断率 70%！ |

**关键发现**: 
- Claude Sonnet WMT24 翻译 9/11 语言对第一
- 短论文 < 150K tokens 可用 Claude/Gemini 一次性送入，跳过分块
- DeepSeek 性价比无敌但学术语感有天花板

## 开源项目参考

| 项目 | Stars | 特点 |
|------|-------|------|
| **PDFMathTranslate** | 25K+ | PDF 论文翻译王者，保留图表公式，EMNLP 2025 |
| **GPT-Academic** | 70K+ | 直接输入 arXiv ID 翻译 LaTeX 源码 |
| **LaTeXTrans** | - | 6-agent 协作，En-Zh 比 GPT-4o 高 13 分 |
| MathTranslate | 1.3K | LaTeX 原生翻译，依赖 Google Translate |
| BabelDOC | 8K+ | PDFMathTranslate 2.0 引擎 |

## 术语一致性策略

1. **按 chunk 筛选术语** — 只注入当前 chunk 出现的术语
2. **上下文窗口串联** — 传入前一 chunk 最后 500 字译文
3. **TEaR 循环** — 翻译后全文审查术语一致性（成本 +30%，质量显著提升）
4. **MAPS 方法** — 翻译前先提取论文专属术语映射表

## 实施路线

- **Phase 1（0 成本）**: 优化 prompt + 验证层 → 质量 +15-20%
- **Phase 2（1.5 天）**: ar5iv 图片保留 + LaTeX 源码提取 → 质量 +20-30%
- **Phase 3（按需）**: Claude Sonnet 高价值论文 + TEaR 审查

## 来源

- ACL PSLT 2025 GenAIese (DeepSeek vs GPT-4o 学术翻译对比)
- WMT24 翻译竞赛 (Claude 3.5 排名)
- arXiv:2508.18791 LaTeXTrans
- arXiv:2507.03009 PDFMathTranslate
- arXiv:2502.17882 Science Across Languages
