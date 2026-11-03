import { createBrowserClient } from "@supabase/ssr";

import { requireSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/** Supabase client for Client Components (runs in the browser). */
export function createSupabaseBrowserClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
