import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client with the SECRET key. It bypasses Row Level Security.
 *
 * Server only, and only for trusted jobs that RLS deliberately blocks:
 * writing to the shared media_items catalogue, reading integrations for
 * Now Playing, admin takedowns. Never pass its results to the browser
 * without filtering them.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set (see .env.example).");
  }
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
