import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/static";

export const revalidate = 3600; // 1h ISR, aligned with page

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("articles")
    .select("content_zh, content")
    .eq("slug", slug)
    .eq("status", "published" as string)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "not_found", message: "Article not found" },
      { status: 404 },
    );
  }

  const row = data as { content_zh: string | null; content: string | null };
  const content = row.content_zh ?? row.content ?? "";
  const hasMath = /\$[\s\S]+?\$/.test(content);

  return NextResponse.json(
    { content, hasMath },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
