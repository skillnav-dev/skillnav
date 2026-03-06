"use server";

import { revalidatePath } from "next/cache";
import { updateArticleStatus } from "@/lib/data/admin";

export async function changeArticleStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const newStatus = formData.get("newStatus") as string;

  if (!id || !newStatus) {
    throw new Error("Missing id or newStatus");
  }

  await updateArticleStatus(id, newStatus);
  revalidatePath("/admin/articles");
}
