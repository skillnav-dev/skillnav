import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/admin/daily/[id]/approve — mark brief as approved
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  const { error, count } = await supabase
    .from("daily_briefs" as "skills")
    .update({ status: "approved" } as never)
    .eq("id", id)
    .eq("status" as "slug", "draft");

  if (!error && count === 0) {
    return NextResponse.json({ error: "Brief is not in draft status" }, { status: 409 });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
