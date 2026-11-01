/**
 * Shields-style "SkillNav 精选" badge SVG, handed to authors of curated
 * Skills / MCP servers to embed in their READMEs.
 */

const LABEL = "SkillNav";
const MESSAGE = "精选";
const FONT = "Verdana,'PingFang SC','Microsoft YaHei',sans-serif";
const LABEL_COLOR = "#555";
const MESSAGE_COLOR = "#3730a3"; // deep indigo, close to the site primary

/** Rough text width at 11px: CJK glyphs are ~11px, Latin ~7px. */
function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += /[　-鿿＀-￯]/.test(ch) ? 11 : 7;
  return w;
}

export function renderCuratedBadge(): string {
  const pad = 6;
  const lw = textWidth(LABEL) + pad * 2;
  const mw = textWidth(MESSAGE) + pad * 2;
  const w = lw + mw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${LABEL}: ${MESSAGE}"><title>${LABEL}: ${MESSAGE}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="${LABEL_COLOR}"/><rect x="${lw}" width="${mw}" height="20" fill="${MESSAGE_COLOR}"/><rect width="${w}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="${FONT}" font-size="11"><text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${LABEL}</text><text x="${lw / 2}" y="14">${LABEL}</text><text x="${lw + mw / 2}" y="15" fill="#010101" fill-opacity=".3">${MESSAGE}</text><text x="${lw + mw / 2}" y="14">${MESSAGE}</text></g></svg>`;
}

export type BadgeType = "skills" | "mcp";

/** Public badge image URL and the Markdown authors paste into a README. */
export function badgeMarkdown(siteUrl: string, type: BadgeType, slug: string) {
  const img = `${siteUrl}/badge/${type}/${slug}.svg`;
  const href = `${siteUrl}/${type}/${slug}`;
  return `[![SkillNav 精选](${img})](${href})`;
}
