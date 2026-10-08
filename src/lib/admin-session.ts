import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SignJWT, jwtVerify } from "jose";

/**
 * Admin session: a short-lived HS256 JWT stored in an httpOnly cookie.
 * The signing key is derived from ADMIN_PASSWORD, so changing the password
 * invalidates every existing session. No server-side session store needed.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const AUDIENCE = "skillnav-admin";
const KEY_CONTEXT = "skillnav-admin-session-v1";

export function getAdminPassword(): string | undefined {
  // Cloudflare Workers secrets may not be visible on process.env,
  // read them from the request context first (same as lib/data/admin.ts).
  try {
    const ctx = getCloudflareContext();
    const value = (ctx.env as Record<string, unknown>).ADMIN_PASSWORD;
    if (typeof value === "string" && value) return value;
  } catch {
    // Not in Cloudflare runtime (local dev), fall through
  }
  return process.env.ADMIN_PASSWORD || undefined;
}

function getSigningKey(): Uint8Array | null {
  const password = getAdminPassword();
  if (!password) return null;
  return new Uint8Array(
    crypto.createHmac("sha256", password).update(KEY_CONTEXT).digest(),
  );
}

/** Issue a signed session token. Returns null when ADMIN_PASSWORD is unset. */
export async function createAdminSessionToken(): Promise<string | null> {
  const key = getSigningKey();
  if (!key) return null;
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE}s`)
    .sign(key);
}

/** True only for an unexpired token signed with the current key. */
export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const key = getSigningKey();
  if (!key) return false;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** Check the current request's admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}
