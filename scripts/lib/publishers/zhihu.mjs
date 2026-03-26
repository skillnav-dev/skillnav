/**
 * Zhihu (知乎专栏) article formatter.
 * Converts Markdown brief to Zhihu-ready long-form article.
 *
 * Zhihu supports Markdown natively in the editor, so we output
 * clean Markdown with absolute links and a structured layout.
 *
 * Format:
 *   - Full absolute URLs (no relative paths)
 *   - Section headers for scannability
 *   - Source attribution per article
 *   - SkillNav branding footer with CTA
 */

/**
 * Convert a daily brief Markdown to Zhihu-ready format.
 *
 * @param {string} markdown - The brief in Markdown format
 * @param {object} meta - { title, date, articleCount }
 * @returns {string} Zhihu-ready Markdown
 */
export function formatZhihuArticle(markdown, meta = {}) {
  const { title = "AI Daily Brief", date = "", articleCount = 0 } = meta;

  let content = markdown;

  // Convert relative links to absolute
  content = content.replace(
    /\]\(\/([\w/.-]+)\)/g,
    "](https://skillnav.dev/$1)"
  );

  // Build article
  const lines = [];

  // Title block
  lines.push(`# ${title}`);
  if (date) {
    lines.push("");
    lines.push(`> ${date}${articleCount ? ` · ${articleCount} 篇精选` : ""}`);
  }
  lines.push("");

  // Main content
  lines.push(content);

  // Footer
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "**SkillNav** — 中文开发者的 AI 智能体工具站（Skills · MCP · 实战资讯）"
  );
  lines.push("");
  lines.push(
    "每日精选 AI Agent 工具与技术资讯，关注 [skillnav.dev](https://skillnav.dev) 获取更多内容。"
  );
  lines.push("");
  lines.push(
    "💻 在 Claude Code 中使用：`/skillnav brief` · [安装 Skill](https://github.com/skillnav-dev/skillnav-skill)"
  );

  return lines.join("\n");
}
