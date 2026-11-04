import type { EmailOtpType } from "@supabase/supabase-js";
import { connection, NextResponse, type NextRequest } from "next/server";

import { homeFor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The link in the sign-in email lands here:
 *   /auth/confirm?token_hash=…&type=email
 *
 * Unlike a PKCE code, a token hash works in ANY browser, so the link still
 * works when the email is opened outside Instagram's in-app browser.
 */
export async function GET(request: NextRequest) {
  await connection(); // always run per request, never prerender
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.user) {
      return NextResponse.redirect(new URL(await homeFor(data.user.id), request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
