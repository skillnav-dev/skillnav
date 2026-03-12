"use server";

import { revalidatePath } from "next/cache";
import { updateSkillStatus, batchUpdateSkillStatus } from "@/lib/data/admin";

export async function changeSkillStatus(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  const newStatus = formData.get("newStatus") as string;

  if (!id || !newStatus) {
    return { ok: false, error: "Missing id or newStatus" };
  }

  try {
    await updateSkillStatus(id, newStatus);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] changeSkillStatus failed: ${msg}`);
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/skills");
  return { ok: true };
}

export async function batchChangeSkillStatus(
  formData: FormData,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const idsRaw = formData.get("ids") as string;
  const status = formData.get("status") as string;

  if (!idsRaw || !status) {
    return { ok: false, error: "Missing ids or status" };
  }

  let ids: string[];
  try {
    ids = JSON.parse(idsRaw);
  } catch {
    return { ok: false, error: "Invalid ids format" };
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: "No ids provided" };
  }

  try {
    const count = await batchUpdateSkillStatus(ids, status);
    revalidatePath("/admin/skills");
    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] batchChangeSkillStatus failed: ${msg}`);
    return { ok: false, error: msg };
  }
}
