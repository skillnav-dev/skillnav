import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

export async function GET() {
  const result: Record<string, unknown> = {};

  // Check process.env
  result.processEnv_hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  result.processEnv_hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  result.processEnv_hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Check getCloudflareContext
  try {
    const ctx = getCloudflareContext();
    const env = ctx.env as Record<string, unknown>;
    result.cfContext_ok = true;
    result.cfContext_envKeys = Object.keys(env);
    result.cfContext_hasServiceKey = !!env.SUPABASE_SERVICE_ROLE_KEY;
    result.cfContext_serviceKeyType = typeof env.SUPABASE_SERVICE_ROLE_KEY;
    result.cfContext_hasAdminPw = !!env.ADMIN_PASSWORD;

    // Try direct property access
    result.cfContext_directAccess = typeof (env as any)
      .SUPABASE_SERVICE_ROLE_KEY;
  } catch (err) {
    result.cfContext_ok = false;
    result.cfContext_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(result);
}
