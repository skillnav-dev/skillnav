"use server";

import { revalidatePath } from "next/cache";
import {
  updateMcpStatus,
  batchUpdateMcpStatus,
  batchDeleteMcpServers,
  batchUpdateMcpTier,
} from "@/lib/data/admin";

export async function changeMcpStatus(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  const newStatus = formData.get("newStatus") as string;

  if (!id || !newStatus) {
    return { ok: false, error: "Missing id or newStatus" };
  }

  try {
    await updateMcpStatus(id, newStatus);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] changeMcpStatus failed: ${msg}`);
    return { ok: false, error: msg };
  }

  revalidatePath("/admin/mcp");
  revalidatePath("/mcp");
  return { ok: true };
}

export async function batchChangeMcpStatus(
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
    const count = await batchUpdateMcpStatus(ids, status);
    revalidatePath("/admin/mcp");
    revalidatePath("/mcp");
    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] batchChangeMcpStatus failed: ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function batchDeleteMcpAction(
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
    const count = await batchDeleteMcpServers(ids);
    revalidatePath("/admin/mcp");
    revalidatePath("/mcp");
    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] batchDeleteMcpServers failed: ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function batchChangeMcpTier(
  formData: FormData,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const idsRaw = formData.get("ids") as string;
  const tier = formData.get("tier") as string;

  if (!idsRaw || !tier) {
    return { ok: false, error: "Missing ids or tier" };
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
    const count = await batchUpdateMcpTier(ids, tier);
    revalidatePath("/admin/mcp");
    revalidatePath("/mcp");
    return { ok: true, count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[admin] batchChangeMcpTier failed: ${msg}`);
    return { ok: false, error: msg };
  }
}
