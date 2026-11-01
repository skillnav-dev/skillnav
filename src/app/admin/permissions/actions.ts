"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { approvePermissions } from "@/lib/data/permissions";
import { normalizePermissions } from "@/lib/permissions";

export async function approvePermissionsAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const type = formData.get("type");
  const slug = formData.get("slug");
  if ((type !== "skill" && type !== "mcp") || typeof slug !== "string") {
    return { ok: false, error: "参数无效" };
  }

  const final = normalizePermissions({
    files: formData.get("files"),
    files_note: formData.get("files_note"),
    exec: formData.get("exec") === "on",
    exec_note: formData.get("exec_note"),
    network: formData.get("network") === "on",
    network_note: formData.get("network_note"),
    secrets: String(formData.get("secrets") ?? "").split(/[,，\s]+/),
    risk_zh: formData.get("risk_zh"),
  });
  if (!final) return { ok: false, error: "内容无效" };

  try {
    await approvePermissions(type, slug, final);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "保存失败",
    };
  }

  revalidatePath("/admin/permissions");
  revalidatePath(`/${type === "skill" ? "skills" : "mcp"}/${slug}`);
  return { ok: true };
}
