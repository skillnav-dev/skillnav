import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { notFound } from "next/navigation";
import type { DailyBriefRow, BriefPublicationRow } from "@/lib/supabase/types";
import { BriefDetail } from "./brief-detail";

export const dynamic = "force-dynamic";

export default async function DailyBriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: briefRaw } = await supabase
    .from("daily_briefs" as "skills")
    .select("*")
    .eq("id", id)
    .single();
  const brief = briefRaw as unknown as DailyBriefRow | null;

  if (!brief) notFound();

  const { data: pubsRaw } = await supabase
    .from("brief_publications" as "skills")
    .select("*")
    .eq("brief_id" as "id", id);
  const publications = (pubsRaw as unknown as BriefPublicationRow[]) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <BriefDetail brief={brief} publications={publications} />
    </div>
  );
}
