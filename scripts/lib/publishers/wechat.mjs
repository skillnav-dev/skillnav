/**
 * WeChat GongZhongHao HTML formatter.
 * Converts Markdown brief to rich HTML styled for WeChat article editor.
 *
 * Design spec (from /plan-design-review):
 *   Title: 20px bold, #1a1a2e
 *   Subtitle: 16px, #666
 *   Body: 15px, #333, line-height 1.8
 *   Links: #2563eb, no underline
 *   Blockquote: left 3px blue border + gray bg
 *   Code: gray bg #f5f5f5 + monospace
 *   Separator: 1px #eee
 *   Footer: SkillNav logo + subscribe CTA
 */

/**
 * Escape HTML special characters to prevent XSS from LLM-generated content.
 */
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Convert Markdown content to WeChat-compatible inline-styled HTML.
 * WeChat editor strips <style> tags so all styles must be inline.
 *
 * @param {string} markdown - The brief in Markdown format
 * @param {object} meta - { title, date, articleCount }
 * @returns {string} Inline-styled HTML ready for WeChat
 */
export function markdownToWechatHtml(markdown, meta = {}) {
  const { title = "AI Daily Brief", date = "", articleCount = 0 } = meta;

  let html = markdown;

  // Section headers — distinct visual styles per section
  html = html.replace(/^## 🚀 (.+)$/gm, (_, text) =>
    `<h2 style="font-size:18px;font-weight:bold;color:#1a1a2e;margin:28px 0 16px;padding:10px 16px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:8px;line-height:1.4">🚀 ${text}</h2>`
  );
  html = html.replace(/^## 🛠️ (.+)$/gm, (_, text) =>
    `<h2 style="font-size:16px;font-weight:bold;color:#1a1a2e;margin:28px 0 12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb;line-height:1.4">🛠️ ${text}</h2>`
  );
  html = html.replace(/^## ⚡ (.+)$/gm, (_, text) =>
    `<h2 style="font-size:15px;font-weight:bold;color:#666;margin:24px 0 10px;line-height:1.4">⚡ ${text}</h2>`
  );

  // Fallback for other ## headers
  html = html.replace(/^## (.+)$/gm, (_, text) =>
    `<h2 style="font-size:18px;font-weight:bold;color:#1a1a2e;margin:24px 0 12px;line-height:1.4">${text}</h2>`
  );

  // Article titles in headlines (### with links)
  html = html.replace(/^### (.+)$/gm, (_, text) =>
    `<h3 style="font-size:17px;font-weight:bold;color:#1a1a2e;margin:20px 0 6px;line-height:1.4">${text}</h3>`
  );

  // Source italic lines (*Source*)
  html = html.replace(/^\*([^*]+)\*$/gm, (_, text) =>
    `<p style="font-size:12px;color:#999;margin:0 0 8px;line-height:1.4">${text}</p>`
  );

  // "Why it matters" bold paragraphs — highlight with accent
  html = html.replace(/\*\*为什么重要：\*\* (.+)/g,
    '<p style="font-size:14px;color:#2563eb;margin:8px 0 16px;padding:8px 12px;background:#f0f7ff;border-radius:6px;line-height:1.6"><strong>💡 为什么重要：</strong>$1</p>'
  );

  // Blockquotes (hook line)
  html = html.replace(/^> (.+)$/gm, (_, text) =>
    `<blockquote style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #2563eb;background:#f8f9fa;color:#444;font-size:15px;font-weight:500;line-height:1.7">${text}</blockquote>`
  );

  // Remaining bold text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1a1a2e">$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g,
    '<code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;font-family:Menlo,Consolas,monospace;font-size:13px;color:#d63384">$1</code>'
  );

  // Links — convert markdown links, strip relative paths to skillnav.dev
  html = html.replace(/\[([^\]]+)\]\(\/([^)]+)\)/g,
    '<a style="color:#2563eb;text-decoration:none;font-weight:500" href="https://skillnav.dev/$2">$1</a>'
  );
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a style="color:#2563eb;text-decoration:none;font-weight:500" href="$2">$1</a>'
  );

  // Unordered list items — compact style for tools & quick links
  html = html.replace(/^- (.+)$/gm, (_, text) =>
    `<p style="font-size:14px;color:#333;line-height:1.7;margin:6px 0;padding:6px 0 6px 16px;border-bottom:1px solid #f5f5f5">• ${text}</p>`
  );

  // Horizontal rule
  html = html.replace(/^---$/gm,
    '<hr style="border:none;border-top:1px solid #eee;margin:24px 0">'
  );

  // Plain paragraphs (lines that aren't already HTML)
  html = html.replace(/^(?!<[a-z])(.+)$/gm, (match) => {
    if (match.trim() === "") return "";
    return `<p style="font-size:15px;color:#333;line-height:1.8;margin:8px 0">${match}</p>`;
  });

  // Remove empty lines
  html = html.replace(/\n{2,}/g, "\n");

  // Wrap in container
  const header = `<div style="text-align:center;margin-bottom:20px">
<h1 style="font-size:20px;font-weight:bold;color:#1a1a2e;margin:0">${escapeHtml(title)}</h1>
${date ? `<p style="font-size:13px;color:#999;margin:6px 0">${escapeHtml(date)}${articleCount ? ` · ${articleCount} 篇精选` : ""}</p>` : ""}
</div>`;

  const footer = `<div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee">
<p style="font-size:13px;color:#999;margin:4px 0">由 SkillNav 自动生成 · skillnav.dev</p>
<p style="font-size:13px;color:#2563eb;margin:4px 0">关注公众号，每日获取 AI 工具简报</p>
</div>`;

  return `<div style="max-width:600px;margin:0 auto;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">\n${header}\n${html}\n${footer}\n</div>`;
}
