/**
 * RSS feed generator for daily briefs.
 * Produces valid RSS 2.0 XML.
 */

/**
 * Escape XML special characters.
 * @param {string} str
 * @returns {string}
 */
function escapeXml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * @typedef {object} RssBrief
 * @property {string} id - UUID
 * @property {string} title - Brief title
 * @property {string} summary - Brief summary
 * @property {string} content_md - Markdown content
 * @property {string} brief_date - ISO date string
 */

/**
 * Generate RSS 2.0 XML from an array of daily briefs.
 *
 * @param {RssBrief[]} briefs - Published briefs (newest first)
 * @param {object} meta - { siteUrl, title, description }
 * @returns {string} Valid RSS 2.0 XML
 */
export function generateRssXml(briefs, meta = {}) {
  const {
    siteUrl = "https://skillnav.dev",
    title = "SkillNav AI Daily Brief",
    description = "每日精选 AI 工具与技术资讯，面向中文开发者",
  } = meta;

  const items = briefs
    .map((brief) => {
      const pubDate = new Date(brief.brief_date).toUTCString();
      const link = `${siteUrl}/daily/${brief.brief_date}`;
      return `    <item>
      <title>${escapeXml(brief.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(brief.summary || "")}</description>
      <content:encoded><![CDATA[${brief.content_md || ""}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss/daily" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
