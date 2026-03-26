import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";

export interface BriefHeadline {
  title: string;
  summary: string;
  why_important: string;
}

export interface BriefHighlight {
  title: string;
  summary: string;
  comment: string;
}

export interface BriefPaper {
  title: string;
  org: string;
  attitude: string;
  what: string;
  implication: string;
  trend: string;
  url: string;
  github_url: string | null;
}

export interface ParsedBrief {
  type: "brief";
  date: string;
  headline: BriefHeadline;
  highlights: BriefHighlight[];
  papers: BriefPaper[];
  url: string;
  is_fallback: boolean;
}

/**
 * Parse content_md from daily_briefs into structured headline + highlights.
 *
 * Actual format (varies by date):
 * > hook text
 * ## 🚀 头条 / ## 🔥 行业热点
 * ### [Title](/articles/slug) or ### Title
 * *source*
 * summary text
 * **为什么重要：** reason / **开发者视角**：reason
 * ### [Next Title]... (additional entries become highlights)
 * ---
 * 📮 footer
 */
function parseEntry(block: string): BriefHighlight | null {
  // Title: ### [Title](url) or ### Title
  const linkedTitle = block.match(/###\s+\[([^\]]+)\]/);
  const plainTitle = block.match(/###\s+([^\n[]+)/);
  const title = linkedTitle?.[1] || plainTitle?.[1]?.trim() || "";
  if (!title) return null;

  const lines = block.split("\n");
  const summaryLines: string[] = [];
  let comment = "";
  let afterSource = false;

  for (const line of lines) {
    if (line.startsWith("###")) continue;
    // Source line: *source* (italic, not bold)
    if (/^\*[^*]/.test(line) && line.trimEnd().endsWith("*")) {
      afterSource = true;
      continue;
    }
    // Comment line: **为什么重要：** or **开发者视角**：
    const commentMatch = line.match(
      /\*\*(?:为什么重要|开发者视角)[：:]\*\*\s*(.*)/,
    );
    if (commentMatch) {
      comment = commentMatch[1]?.trim() || "";
      break;
    }
    if (afterSource && line.trim() && !line.startsWith("---")) {
      summaryLines.push(line.trim());
    }
  }

  return { title, summary: summaryLines.join(" "), comment };
}

/**
 * Parse bullet-list highlights from the "## 📋 值得关注" section.
 * Format: `- [Title](/articles/slug) — comment` or `- Title — comment`
 */
function parseBulletHighlights(contentMd: string): BriefHighlight[] {
  const sectionMatch = contentMd.match(
    /## 📋 值得关注\s*\n([\s\S]*?)(?=\n---|\n## |$)/,
  );
  if (!sectionMatch) return [];

  const highlights: BriefHighlight[] = [];
  const lines = sectionMatch[1].split("\n");

  for (const line of lines) {
    // Linked: - [Title](/url) — comment
    const linked = line.match(/^-\s+\[([^\]]+)\]\([^)]+\)\s*[—–-]\s*(.*)/);
    if (linked) {
      highlights.push({
        title: linked[1],
        summary: "",
        comment: linked[2].trim(),
      });
      continue;
    }
    // Plain: - Title — comment
    const plain = line.match(/^-\s+(.+?)\s*[—–-]\s+(.*)/);
    if (plain) {
      highlights.push({
        title: plain[1],
        summary: "",
        comment: plain[2].trim(),
      });
    }
  }
  return highlights;
}

/**
 * Parse paper picks from the "## 📄 论文速递" section.
 *
 * Actual format (v3, from generate-daily.mjs):
 *   ### 论文中文标题
 *   > org · 态度标签 · 代码已开源
 *
 *   **做了什么**：description
 *
 *   **对你意味着什么** | 态度标签
 *   implication text
 *
 *   **趋势**：trend text
 *
 *   → [arXiv](url) · [GitHub](github_url)
 */
function parsePaperSection(contentMd: string): BriefPaper[] {
  const sectionMatch = contentMd.match(
    /## 📄 论文速递\s*\n([\s\S]*?)(?=\n---|\n## |$)/,
  );
  if (!sectionMatch) return [];

  // Split into ### blocks within the paper section
  const blocks = sectionMatch[1]
    .split(/^(?=### )/m)
    .filter((b) => b.includes("###"));

  const papers: BriefPaper[] = [];

  for (const block of blocks) {
    const titleMatch = block.match(/###\s+([^\n]+)/);
    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const lines = block.split("\n");

    // Extract org + attitude from blockquote: > org · attitude · 代码已开源
    let org = "";
    let attitude = "";
    const quoteLine = lines.find((l) => /^>\s/.test(l));
    if (quoteLine) {
      const parts = quoteLine.replace(/^>\s*/, "").split(/\s*[·]\s*/);
      org = parts[0]?.trim() || "";
      attitude = parts[1]?.trim() || "";
    }

    // Extract structured fields
    let what = "";
    let implication = "";
    let trend = "";
    let url = "";
    let githubUrl: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const whatMatch = line.match(/\*\*做了什么\*\*[：:]\s*(.*)/);
      if (whatMatch) {
        what = whatMatch[1].trim();
        continue;
      }

      // "对你意味着什么" header — content is on the next line
      if (/\*\*对你意味着什么\*\*/.test(line)) {
        if (i + 1 < lines.length && lines[i + 1].trim()) {
          implication = lines[i + 1].trim();
        }
        continue;
      }

      const trendMatch = line.match(/\*\*趋势\*\*[：:]\s*(.*)/);
      if (trendMatch) {
        trend = trendMatch[1].trim();
        continue;
      }

      // Link line: → [arXiv](url) · [GitHub](github_url)
      const arxivMatch = line.match(/→\s*\[arXiv\]\(([^)]+)\)/);
      if (arxivMatch) {
        url = arxivMatch[1].trim();
        const ghMatch = line.match(/\[GitHub\]\(([^)]+)\)/);
        if (ghMatch) githubUrl = ghMatch[1].trim();
        continue;
      }
    }

    if (title) {
      papers.push({
        title,
        org,
        attitude,
        what,
        implication,
        trend,
        url,
        github_url: githubUrl,
      });
    }
  }

  return papers;
}

function parseContentMd(contentMd: string): {
  headline: BriefHeadline;
  highlights: BriefHighlight[];
  papers: BriefPaper[];
} {
  // Strip the paper section before splitting by ### to avoid
  // paper titles being misinterpreted as highlight entries
  const contentWithoutPapers = contentMd.replace(
    /## 📄 论文速递\s*\n[\s\S]*?(?=\n---|\n## |$)/,
    "",
  );

  // Split into ### blocks (entries) for headline parsing
  const entries = contentWithoutPapers
    .split(/^(?=### )/m)
    .filter((b) => b.includes("###"));

  let headline: BriefHeadline = { title: "", summary: "", why_important: "" };

  // Only the first ### block under 今日头条 is the headline
  for (const entry of entries) {
    const parsed = parseEntry(entry);
    if (parsed) {
      headline = {
        title: parsed.title,
        summary: parsed.summary,
        why_important: parsed.comment,
      };
      break;
    }
  }

  // Parse bullet-list highlights from ## 📋 值得关注
  const highlights = parseBulletHighlights(contentMd);

  // Parse paper picks from ## 📄 论文速递
  const papers = parsePaperSection(contentMd);

  return { headline, highlights, papers };
}

export async function getLatestBrief(
  supabase: SupabaseClient<Database>,
  today: string,
): Promise<ParsedBrief | null> {
  type BriefRow = { brief_date: string; content_md: string };

  // Try today first
  const { data: todayBrief } = await supabase
    .from("daily_briefs" as "skills")
    .select("brief_date, content_md" as "slug")
    .eq("status" as "slug", "published")
    .eq("brief_date" as "slug", today)
    .limit(1)
    .single();

  let brief = todayBrief as BriefRow | null;
  let isFallback = false;

  if (!brief) {
    // Fallback to latest published
    const { data: fallback } = await supabase
      .from("daily_briefs" as "skills")
      .select("brief_date, content_md" as "slug")
      .eq("status" as "slug", "published")
      .order("brief_date" as "created_at", { ascending: false })
      .limit(1)
      .single();

    brief = fallback as BriefRow | null;
    if (!brief) return null;
    isFallback = true;
  }

  const { headline, highlights, papers } = parseContentMd(brief.content_md);

  return {
    type: "brief",
    date: brief.brief_date,
    headline,
    highlights,
    papers,
    url: `https://skillnav.dev/daily/${brief.brief_date}`,
    is_fallback: isFallback,
  };
}
