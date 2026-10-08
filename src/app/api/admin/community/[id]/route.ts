import { createServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/admin/community/[id] — toggle is_hidden for moderation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (typeof body.is_hidden !== "boolean") {
    return NextResponse.json(
      { error: "is_hidden must be a boolean" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { error } = await supabase
    .from("community_signals" as "skills")
    .update({ is_hidden: body.is_hidden } as never)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, is_hidden: body.is_hidden });
}
