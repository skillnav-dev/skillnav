import { createServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/constants";
import type { DailyBriefRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = await createServerClient();

  const { data: briefsRaw, error } = await supabase
    .from("daily_briefs" as "skills")
    .select("id, brief_date, title, summary, content_md")
    .in("status", ["approved", "published"])
    .order("brief_date" as "created_at", { ascending: false })
    .limit(30);
  const briefs = briefsRaw as unknown as Pick<DailyBriefRow, "id" | "brief_date" | "title" | "summary" | "content_md">[] | null;

  if (error) {
    return new Response("Internal Server Error", { status: 500 });
  }

  const items = (briefs || [])
    .map((brief) => {
      const pubDate = new Date(brief.brief_date).toUTCString();
      const link = `${siteConfig.url}/daily/${brief.brief_date}`;
      return `    <item>
      <title>${escapeXml(brief.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(brief.summary || "")}</description>
      <content:encoded><![CDATA[${(brief.content_md || "").replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SkillNav AI Daily Brief</title>
    <link>${siteConfig.url}</link>
    <description>每日精选 AI 工具与技术资讯，面向中文开发者</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/api/rss/daily" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
