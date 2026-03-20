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
 * Generate a Xiaohongshu caption with layered sections.
 * Headlines get more space, quick links are compressed.
 *
 * @param {object} sections - { headlines, tools, quickLinks }
 * @param {object} meta - { title, date, totalCount }
 * @returns {string} Copy-ready caption text
 */
export function formatXhsCaption(sections, meta = {}) {
  const { title = "AI 日报", date = "", totalCount = 0 } = meta;
  const { headlines = [], tools = [], quickLinks = [] } = sections;

  // Backward compat: if sections is an array, use flat format
  if (Array.isArray(sections)) {
    return formatXhsCaptionFlat(sections, meta);
  }

  const lines = [];
  const count = totalCount || headlines.length + tools.length + quickLinks.length;

  // Hook (first 2 lines shown in preview)
  lines.push(title);
  lines.push(`${date ? date + " " : ""}${count} 条 AI 动态速览`);
  lines.push("");

  // Headlines — full treatment with summary
  if (headlines.length) {
    lines.push("📌 今日重点");
    lines.push("");
    for (const h of headlines) {
      lines.push(`🔥 ${h.title}`);
      if (h.whyItMatters) {
        lines.push(`💡 ${h.whyItMatters}`);
      } else if (h.summary) {
        lines.push(`   ${h.summary.slice(0, 60)}`);
      }
      lines.push("");
    }
  }

  // Tools — one line each with emoji
  if (tools.length) {
    lines.push("🛠️ 工具动态");
    lines.push("");
    const toolEmojis = ["⚡", "🚀", "💡", "📦"];
    for (let i = 0; i < tools.length; i++) {
      const emoji = toolEmojis[i % toolEmojis.length];
      lines.push(`${emoji} ${tools[i].title}`);
      if (tools[i].oneLiner) {
        lines.push(`   ${tools[i].oneLiner}`);
      }
      lines.push("");
    }
  }

  // Quick Links — compressed, no sub-lines
  if (quickLinks.length) {
    lines.push("📋 速览");
    for (const q of quickLinks) {
      lines.push(`· ${q.title}${q.oneLiner ? " — " + q.oneLiner : ""}`);
    }
    lines.push("");
  }

  // CTA
  lines.push("👉 搜索「SkillNav」获取更多 AI 工具资讯");
  lines.push("");

  // Hashtags
  lines.push(HASHTAGS.join(" "));

  let caption = lines.join("\n");

  // Trim if over limit (cut quick links first, then tools)
  if (caption.length > MAX_CAPTION_LENGTH && quickLinks.length > 0) {
    const trimmed = { ...sections, quickLinks: quickLinks.slice(0, -1) };
    return formatXhsCaption(trimmed, meta);
  }
  if (caption.length > MAX_CAPTION_LENGTH && tools.length > 0) {
    const trimmed = { ...sections, quickLinks: [], tools: tools.slice(0, -1) };
    return formatXhsCaption(trimmed, meta);
  }

  return caption;
}

/**
 * Flat format fallback for backward compatibility.
 */
function formatXhsCaptionFlat(highlights, meta = {}) {
  const { title = "AI 日报", date = "" } = meta;
  const lines = [];
  lines.push(title);
  lines.push(`${date ? date + " " : ""}${highlights.length} 个值得关注的 AI 动态`);
  lines.push("");
  const emojis = ["🔥", "⚡", "🚀", "💡", "🛠️", "📦", "🧠", "✨", "🎯", "📊"];
  for (let i = 0; i < highlights.length; i++) {
    const h = highlights[i];
    lines.push(`${emojis[i % emojis.length]} ${h.title}`);
    if (h.oneLiner) lines.push(`   ${h.oneLiner}`);
    lines.push("");
  }
  lines.push("👉 搜索「SkillNav」获取更多 AI 工具资讯");
  lines.push("");
  lines.push(HASHTAGS.join(" "));
  let caption = lines.join("\n");
  if (caption.length > MAX_CAPTION_LENGTH) {
    for (let count = highlights.length - 1; count >= 3; count--) {
      caption = formatXhsCaptionFlat(highlights.slice(0, count), meta);
      if (caption.length <= MAX_CAPTION_LENGTH) break;
    }
  }
  return caption;
}
