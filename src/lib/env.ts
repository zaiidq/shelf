/**
 * Public environment variables, read in one place.
 *
 * Only NEXT_PUBLIC_* values belong here: they are sent to the browser.
 * Secret keys are read in server-only modules (see src/lib/supabase/admin.ts).
 */

const DEFAULT_SITE_URL = "http://localhost:3000";

/** The site's base URL. The domain is never hard-coded; set NEXT_PUBLIC_SITE_URL. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * True when Supabase env vars are set. Until they are, the app runs on the
 * bundled demo data (see src/lib/profile/demo.ts).
 */
export function isSupabaseConfigured(): boolean {
  return supabaseUrl !== "" && supabasePublishableKey !== "";
}

/** Throws a clear message when a Supabase client is created without config. */
export function requireSupabaseEnv(): { url: string; key: string } {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url: supabaseUrl, key: supabasePublishableKey };
}
