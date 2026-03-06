"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

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

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { error: "管理密码未配置" };
  }

  if (!safeCompare(password, adminPassword)) {
    return { error: "密码错误" };
  }

  // Generate a session token
  const token = crypto.randomBytes(32).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // 7 days
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}
