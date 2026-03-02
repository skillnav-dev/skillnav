import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cookie-less Supabase client for build-time contexts
 * (generateStaticParams, sitemap, etc.) where cookies() is unavailable.
 */
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
