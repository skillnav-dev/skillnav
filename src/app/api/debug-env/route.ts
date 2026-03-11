import { NextResponse } from "next/server";

export async function GET() {
  const result: Record<string, unknown> = {};

  // Check process.env
  result.processEnv_hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  result.processEnv_hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  result.processEnv_hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  result.processEnv_keys = Object.keys(process.env).filter(
    (k) => k.includes("SUPABASE") || k.includes("ADMIN"),
  );

  // Check getCloudflareContext (dynamic import to avoid build issues)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const env = ctx.env as Record<string, unknown>;
    result.cfContext_ok = true;
    result.cfContext_envKeys = Object.keys(env);
    result.cfContext_hasServiceKey = !!env.SUPABASE_SERVICE_ROLE_KEY;
    result.cfContext_serviceKeyType = typeof env.SUPABASE_SERVICE_ROLE_KEY;
    result.cfContext_hasAdminPw = !!env.ADMIN_PASSWORD;
  } catch (err) {
    result.cfContext_ok = false;
    result.cfContext_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(result);
}
