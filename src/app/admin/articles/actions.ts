"use server";

import { revalidatePath } from "next/cache";
import { updateArticleStatus } from "@/lib/data/admin";

export async function changeArticleStatus(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  const newStatus = formData.get("newStatus") as string;

  if (!id || !newStatus) {
    return { ok: false, error: "Missing id or newStatus" };
  }

  try {
    await updateArticleStatus(id, newStatus);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] changeArticleStatus failed: ${msg}`);
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/articles");
  return { ok: true };
}
