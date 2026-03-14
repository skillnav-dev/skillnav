"use server";

import { revalidatePath } from "next/cache";
import { updateMcpServer, deleteMcpServer } from "@/lib/data/admin";

export async function saveMcpServer(formData: FormData) {
  const id = formData.get("id") as string;

  const data: {
    name_zh?: string;
    description_zh?: string;
    editor_comment_zh?: string;
    status?: string;
    category?: string;
    quality_tier?: string;
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

  const qualityTier = formData.get("quality_tier");
  if (qualityTier !== null) data.quality_tier = qualityTier as string;

  await updateMcpServer(id, data);

  revalidatePath("/admin/mcp");
  revalidatePath(`/admin/mcp/${id}/edit`);
  revalidatePath("/mcp");

  return { success: true };
}

export async function deleteMcpAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteMcpServer(id);
    revalidatePath("/admin/mcp");
    revalidatePath("/mcp");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] deleteMcpAction failed: ${msg}`);
    return { ok: false, error: msg };
  }
}
