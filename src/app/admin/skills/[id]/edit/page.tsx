import { notFound } from "next/navigation";
import { getAdminSkillById } from "@/lib/data/admin";
import { SkillEditor } from "@/components/admin/skill-editor";
import { requireAdmin } from "@/lib/admin-auth";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const skill = await getAdminSkillById(id);

  if (!skill) notFound();

  return <SkillEditor skill={skill} />;
}
