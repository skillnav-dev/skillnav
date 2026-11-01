import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";
import { renderCuratedBadge, type BadgeType } from "@/lib/badge-svg";

// Badge for curated listings: /badge/skills/<slug>.svg, /badge/mcp/<slug>.svg
// Only published rows get a badge; drafts, hidden or unknown slugs 404.

const TABLES: Record<BadgeType, "skills" | "mcp_servers"> = {
  skills: "skills",
  mcp: "mcp_servers",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  const { type, slug: raw } = await params;
  const table = TABLES[type as BadgeType];
  const slug = raw.replace(/\.svg$/, "");
  if (!table || !slug || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data } = await createStaticClient()
    .from(table)
    .select("slug")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  return new NextResponse(renderCuratedBadge(), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Badges are hot-linked from GitHub (camo caches too); refresh daily.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
