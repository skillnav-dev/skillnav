"use server";

import { revalidatePath } from "next/cache";
import { updateSkill } from "@/lib/data/admin";

export async function saveSkill(formData: FormData) {
  const id = formData.get("id") as string;

  const data: {
    name_zh?: string;
    description_zh?: string;
    editor_comment_zh?: string;
    status?: string;
    category?: string;
  } = {};

  const nameZh = formData.get("name_zh");
  if (nameZh !== null) data.name_zh = nameZh as string;

  const descriptionZh = formData.get("description_zh");
  if (descriptionZh !== null) data.description_zh = descriptionZh as string;

  const editorCommentZh = formData.get("editor_comment_zh");
  if (editorCommentZh !== null)
    data.editor_comment_zh = editorCommentZh as string;

  const status = formData.get("status");
  if (status !== null) data.status = status as string;

  const category = formData.get("category");
  if (category !== null) data.category = category as string;

  await updateSkill(id, data);

  revalidatePath("/admin/skills");
  revalidatePath(`/admin/skills/${id}/edit`);
  revalidatePath("/skills");

  return { success: true };
}
