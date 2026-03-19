/**
 * Xiaohongshu (小红书) post formatter.
 * Generates copy-ready caption text for pairing with image cards.
 *
 * Xiaohongshu format rules:
 *   - First 2 lines are preview text (must hook the reader)
 *   - Emoji-heavy, scannable bullet points
 *   - Total caption ≤ 1000 chars
 *   - 5-10 hashtags at the end
 *   - No external links (XHS strips them)
 */

const MAX_CAPTION_LENGTH = 1000;

const HASHTAGS = [
  "#AI工具",
  "#人工智能",
  "#开发者",
  "#程序员",
  "#AIAgent",
  "#科技资讯",
  "#效率工具",
];

/**
 * @typedef {object} BriefHighlight
 * @property {string} title - Article title (Chinese)
 * @property {string} oneLiner - One-line summary
 */

/**
 * Generate a Xiaohongshu caption from brief highlights.
 *
 * @param {BriefHighlight[]} highlights - Curated highlights
 * @param {object} meta - { title, date }
 * @returns {string} Copy-ready caption text
 */
export function formatXhsCaption(highlights, meta = {}) {
  const { title = "AI 日报", date = "" } = meta;

  const lines = [];

  // Hook (first 2 lines shown in preview)
  lines.push(title);
  lines.push(`${date ? date + " " : ""}${highlights.length} 个值得关注的 AI 动态`);
  lines.push("");

  // Highlights as emoji bullet points
  const emojis = ["🔥", "⚡", "🚀", "💡", "🛠️", "📦", "🧠", "✨", "🎯", "📊"];

  for (let i = 0; i < highlights.length; i++) {
    const h = highlights[i];
    const emoji = emojis[i % emojis.length];
    lines.push(`${emoji} ${h.title}`);
    if (h.oneLiner) {
      lines.push(`   ${h.oneLiner}`);
    }
    lines.push("");
  }

  // CTA
  lines.push("👉 搜索「SkillNav」获取更多 AI 工具资讯");
  lines.push("");

  // Hashtags
  lines.push(HASHTAGS.join(" "));

  let caption = lines.join("\n");

  // Trim if over limit (cut highlights from bottom)
  if (caption.length > MAX_CAPTION_LENGTH) {
    // Rebuild with fewer highlights
    for (let count = highlights.length - 1; count >= 3; count--) {
      caption = formatXhsCaption(highlights.slice(0, count), meta);
      if (caption.length <= MAX_CAPTION_LENGTH) break;
    }
  }

  return caption;
}
