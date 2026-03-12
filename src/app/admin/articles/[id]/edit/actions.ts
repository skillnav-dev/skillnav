"use server";

import { revalidatePath } from "next/cache";
import { updateArticle, deleteArticle } from "@/lib/data/admin";

export async function saveArticle(formData: FormData) {
  const id = formData.get("id") as string;

  const data: {
    title_zh?: string;
    summary_zh?: string;
    content_zh?: string;
    status?: string;
    relevance_score?: number;
  } = {};

  const titleZh = formData.get("title_zh");
  if (titleZh !== null) data.title_zh = titleZh as string;

  const summaryZh = formData.get("summary_zh");
  if (summaryZh !== null) data.summary_zh = summaryZh as string;

  const contentZh = formData.get("content_zh");
  if (contentZh !== null) data.content_zh = contentZh as string;

  const status = formData.get("status");
  if (status !== null) data.status = status as string;

  const relevanceScore = formData.get("relevance_score");
  if (relevanceScore !== null) data.relevance_score = Number(relevanceScore);

  await updateArticle(id, data);

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}/edit`);
  revalidatePath("/articles");

  return { success: true };
}

export async function deleteArticleAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await deleteArticle(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] deleteArticle failed: ${msg}`);
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/articles");
  revalidatePath("/articles");
  return { ok: true };
}
