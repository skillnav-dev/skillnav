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
  summary: string;
  org: string;
  hook: string;
  url: string;
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
 * Format:
 *   - **summary** (org)
 *     hook → [arXiv](url)
 */
function parsePaperSection(contentMd: string): BriefPaper[] {
  const sectionMatch = contentMd.match(
    /## 📄 论文速递\s*\n([\s\S]*?)(?=\n---|\n## |$)/,
  );
  if (!sectionMatch) return [];

  const papers: BriefPaper[] = [];
  const lines = sectionMatch[1].split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Title line: - **summary** (org)
    const titleMatch = lines[i].match(
      /^-\s+\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?/,
    );
    if (!titleMatch) continue;

    const summary = titleMatch[1].trim();
    const org = titleMatch[2]?.trim() || "";

    // Next line: hook → [arXiv](url)
    let hook = "";
    let url = "";
    if (i + 1 < lines.length) {
      const hookMatch = lines[i + 1].match(
        /^\s+(.+?)\s*→\s*\[arXiv\]\(([^)]+)\)/,
      );
      if (hookMatch) {
        hook = hookMatch[1].trim();
        url = hookMatch[2].trim();
        i++; // skip the hook line
      }
    }

    papers.push({ summary, org, hook, url });
  }

  return papers;
}

function parseContentMd(contentMd: string): {
  headline: BriefHeadline;
  highlights: BriefHighlight[];
  papers: BriefPaper[];
} {
  // Split into ### blocks (entries) for headline + legacy format
  const entries = contentMd
    .split(/^(?=### )/m)
    .filter((b) => b.includes("###"));

  let headline: BriefHeadline = { title: "", summary: "", why_important: "" };
  const highlights: BriefHighlight[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = parseEntry(entries[i]);
    if (!entry) continue;

    if (i === 0) {
      headline = {
        title: entry.title,
        summary: entry.summary,
        why_important: entry.comment,
      };
    } else {
      highlights.push(entry);
    }
  }

  // Also parse bullet-list highlights from ## 📋 值得关注
  const bulletHighlights = parseBulletHighlights(contentMd);
  highlights.push(...bulletHighlights);

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
