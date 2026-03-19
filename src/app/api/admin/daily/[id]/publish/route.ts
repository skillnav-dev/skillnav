import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/daily/[id]/publish — mark a channel as published
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { channel } = await request.json();

  if (!channel || !["rss", "wechat", "x", "zhihu", "xhs"].includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("brief_publications" as "skills")
    .upsert(
      {
        brief_id: id,
        channel,
        status: "published",
        published_at: new Date().toISOString(),
      } as never,
      { onConflict: "brief_id,channel" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
