import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Signed admin session.
 *
 * Cookie value: `v1.<expiresAtSeconds>.<hmacHex>`, where the HMAC covers
 * `v1.<expiresAtSeconds>` and is keyed by ADMIN_SESSION_SECRET (falls back to
 * ADMIN_PASSWORD, so rotating the password also revokes every session).
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

const VERSION = "v1";

function readSecret(name: string): string | undefined {
  // Cloudflare Worker secrets are not enumerable on process.env,
  // read them from the request context first (same as lib/data/admin.ts).
  try {
    const value = (getCloudflareContext().env as Record<string, unknown>)[name];
    if (typeof value === "string" && value) return value;
  } catch {
    // Not in Cloudflare runtime (local dev), fall through
  }
  return process.env[name] || undefined;
}

export function getAdminPassword(): string | undefined {
  return readSecret("ADMIN_PASSWORD");
}

function getSigningKey(): string | undefined {
  return readSecret("ADMIN_SESSION_SECRET") ?? getAdminPassword();
}

function sign(payload: string, key: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("hex");
}

export function createSessionToken(nowMs = Date.now()): string {
  const key = getSigningKey();
  if (!key) throw new Error("Admin session key is not configured");
  const payload = `${VERSION}.${Math.floor(nowMs / 1000) + ADMIN_SESSION_MAX_AGE_S}`;
  return `${payload}.${sign(payload, key)}`;
}

export function verifySessionToken(token: string | undefined, nowMs = Date.now()): boolean {
  if (!token) return false;
  const key = getSigningKey();
  if (!key) return false;

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isInteger(expiresAt) || expiresAt * 1000 <= nowMs) return false;

  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, key), "hex");
  const actual = Buffer.from(parts[2], "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** True when the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

/** Guard for server actions: throws when the caller is not an admin. */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}
