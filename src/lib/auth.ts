import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
};

/**
 * The signed-in user, or null. Reads the session cookie, so call it only
 * from Server Actions, Route Handlers, or components inside <Suspense>.
 *
 * Uses getClaims(), which verifies the token's signature instead of trusting
 * the cookie blindly.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
}

/** The signed-in user's username, or null if they have not published yet. */
export async function getOwnUsername(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load your profile: ${error.message}`);
  return data?.username ?? null;
}

/** Where to send someone right after they sign in. */
export async function homeFor(userId: string): Promise<string> {
  const username = await getOwnUsername(userId);
  return username ? `/${username}` : "/onboarding";
}
