# LaTeX 渲染失败 + Citation Key 泄露 + References 残留

Date: 2026-04-06

## 症状

1. 论文页面 LaTeX 公式显示为原始源码（`\begin{cases}...`）
2. 正文中大量裸 BibTeX citation key（`roberts2021hypersim`）
3. 参考文献列表出现在正文中

## 根因

### LaTeX 渲染
- remark-math 解析 inline `$$content\\↵content$$` 时，`\\` + 换行被当作 markdown 硬换行，截断 `$$` 块
- 初始误判为 `\r\n` 问题，实际是 `\\` + 换行的 markdown 语义冲突
- JS `String.replace()` 中 `$$` 输出单个 `$`（特殊语法），需 `$$$$` 输出 `$$`
- lint error 阻塞 CI 3 次未被发现，代码从未部署

### Citation Key
- ar5iv 把 `\cite{key}` 渲染为链接文本 = 原始 BibTeX key
- 两种格式：裸文本（`roberts2021hypersim`）和方括号（`[hao2024training, zou2025latent]`）

### References
- 部分论文 References 不在 `.ltx_bibliography` 容器中，未被 cheerio 移除
- LLM 翻译后变成 `**参考文献**`，heading 正则未覆盖加粗格式

## 修复

1. `article-content.tsx`: `normalizeMath()` 把所有 `$$` 转 fenced 格式（`$$` 独占一行）
2. `translate-paper.mjs`: sanitize 加 `\r\n→\n`
3. `translate-paper.mjs`: 两种 citation key 正则清理（bare + bracketed）
4. `translate-paper.mjs`: ar5iv 提取时 skip References heading + 翻译后截断残余

## 预防

- CLAUDE.md Known Pitfalls 已记录三条（fenced math、`$$$$` 替换、push 前跑 lint）
- 推送后必须 `gh run list -L 1` 验证 CI 通过，不能提前说"已修复"
