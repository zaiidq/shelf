import type { EmailOtpType } from "@supabase/supabase-js";
import { connection, NextResponse, type NextRequest } from "next/server";

import { homeFor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The link in the sign-in email lands here, in one of two forms:
 *
 * 1. /auth/confirm?code=…
 *    Supabase's DEFAULT email template. The code only works in the browser
 *    that asked for the email (it needs a cookie set there).
 *
 * 2. /auth/confirm?token_hash=…&type=email
 *    Our custom template (supabase/templates/sign-in.html), usable once a
 *    custom SMTP sender is set up. Works in ANY browser, including when the
 *    email is opened outside Instagram's in-app browser.
 */
export async function GET(request: NextRequest) {
  await connection(); // always run per request, never prerender
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) userId = data.user?.id ?? null;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user?.id ?? null;
    else console.error("[auth/confirm] code exchange failed:", error.message);
  }

  if (userId) {
    return NextResponse.redirect(new URL(await homeFor(userId), request.url));
  }

  // Most common cause with the default template: the link was opened in a
  // different browser than the one that asked for it.
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
