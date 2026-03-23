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

export interface ParsedBrief {
  type: "brief";
  date: string;
  headline: BriefHeadline;
  highlights: BriefHighlight[];
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

function parseContentMd(contentMd: string): {
  headline: BriefHeadline;
  highlights: BriefHighlight[];
} {
  // Split into ### blocks (entries)
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

  return { headline, highlights };
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

  const { headline, highlights } = parseContentMd(brief.content_md);

  return {
    type: "brief",
    date: brief.brief_date,
    headline,
    highlights,
    url: `https://skillnav.dev/daily/${brief.brief_date}`,
    is_fallback: isFallback,
  };
}
