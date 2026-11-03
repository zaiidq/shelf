import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * A cookie-free Supabase client for reading PUBLIC data on the server.
 *
 * It never looks at who is visiting, so its results are the same for everyone
 * and can be cached and served as static pages (fast in Instagram's browser).
 * Row Level Security still applies: it sees exactly what an anonymous visitor
 * is allowed to see.
 */
export function createPublicClient() {
  const { url, key } = requireSupabaseEnv();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
