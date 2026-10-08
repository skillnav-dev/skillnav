"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_S,
  createSessionToken,
  getAdminPassword,
} from "@/lib/admin-session";

// Simple constant-time comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Hash both to ensure constant time even with different lengths
    const hashA = crypto.createHash("sha256").update(a).digest();
    const hashB = crypto.createHash("sha256").update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function loginAction(
  _prevState: { error: string },
  formData: FormData,
) {
  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    return { error: "请输入密码" };
  }

  const adminPassword = getAdminPassword();
  if (!adminPassword) {
    return { error: "管理密码未配置" };
  }

  if (!safeCompare(password, adminPassword)) {
    return { error: "密码错误" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });

  redirect("/admin");
}
