import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase admin client using service_role key.
 * Bypasses RLS — ONLY use in scripts, NEVER in the web app.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Copy .env.example to .env.local and fill in your Supabase credentials."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
