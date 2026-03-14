"use server";

import { revalidatePath } from "next/cache";
import {
  updateArticleStatus,
  batchUpdateArticleStatus,
  batchDeleteArticles as dalBatchDeleteArticles,
} from "@/lib/data/admin";

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

export async function batchChangeArticleStatus(
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
    const count = await batchUpdateArticleStatus(ids, status);
    revalidatePath("/admin/articles");
    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] batchChangeArticleStatus failed: ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function batchDeleteArticles(
  formData: FormData,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const idsRaw = formData.get("ids") as string;

  if (!idsRaw) {
    return { ok: false, error: "Missing ids" };
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
    const count = await dalBatchDeleteArticles(ids);
    revalidatePath("/admin/articles");
    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] batchDeleteArticles failed: ${msg}`);
    return { ok: false, error: msg };
  }
}
