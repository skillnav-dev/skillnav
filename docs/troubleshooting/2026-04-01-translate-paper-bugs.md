# translate-paper.mjs 多项 Bug 修复

- **日期**: 2026-04-01
- **涉及文件**: `scripts/translate-paper.mjs`

## Bug 1: arXiv API http→https 重定向

- **症状**: `fetchArxivMetadata` 超时，arXiv API 返回 301
- **根因**: URL 用 `http://export.arxiv.org`，arXiv 强制 HTTPS 重定向，Node.js fetch 不自动跟随
- **修复**: 改为 `https://export.arxiv.org`

## Bug 2: pdf-parse v2 API 不兼容

- **症状**: `PDFParse is not a function` / `Class constructor cannot be invoked without 'new'`
- **根因**: pdf-parse 升级到 v2.4.5，导出从 `default` 函数变为 `PDFParse` class
- **修复**: 远程和本地 PDF 解析统一改用 `pdfjs-dist/legacy/build/pdf.mjs` 直接调用

## Bug 3: ar5iv/PDF fetch 无 try-catch

- **症状**: 网络波动时 `fetch failed` 直接崩溃，不走 fallback
- **根因**: `fetchAr5ivHtml` 和 `fetchPdfText` 的 fetch 调用没有 try-catch
- **修复**: 加 try-catch，网络错误时 `log.warn` + `return null` 走 fallback

## Bug 4: PostgreSQL Unicode 转义

- **症状**: `unsupported Unicode escape sequence` 写入失败
- **根因**: PDF 提取的文本含 `\u0000` 等 PostgreSQL 不支持的字符
- **修复**: 写入前 `sanitize()` 函数清理 null bytes

## Bug 5: ar5iv HTML 图片丢失

- **症状**: ar5iv 解析只提取纯文本，`<figure>` 和 `<img>` 全部丢失
- **根因**: `$(el).text()` 只取文本节点，不保留 HTML 结构
- **修复**: 新增 `toMarkdown()` 函数，遍历子节点分类处理：figure→`![](url)`、equation→`$$latex$$`、paragraph→text

## 预防

- 远程服务调用（arXiv API、ar5iv HTML、PDF download）全部需要 try-catch + fallback
- 第三方库升级后检查 API 变更（pdf-parse v1→v2 breaking change）
