"use server";

import { revalidatePath } from "next/cache";
import { updateArticleStatus } from "@/lib/data/admin";

export async function changeArticleStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const newStatus = formData.get("newStatus") as string;

  if (!id || !newStatus) {
    throw new Error("Missing id or newStatus");
  }

  try {
    await updateArticleStatus(id, newStatus);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] changeArticleStatus failed: ${msg}`);
    throw new Error(`状态切换失败: ${msg}`);
  }

  revalidatePath("/admin/articles");
}
