import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

// PATCH /api/admin/daily/[id] — update brief content
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.content_md || typeof body.content_md !== "string") {
    return NextResponse.json({ error: "content_md must be a non-empty string" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("daily_briefs" as "skills")
    .update({ content_md: body.content_md } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
