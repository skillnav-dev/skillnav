"use server";

import { revalidatePath } from "next/cache";
import { updateArticle } from "@/lib/data/admin";

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
