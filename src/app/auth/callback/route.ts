import { connection, NextResponse, type NextRequest } from "next/server";

import { homeFor } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Google sends people back here with a one-time ?code=… after sign-in. */
export async function GET(request: NextRequest) {
  await connection(); // always run per request, never prerender
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      return NextResponse.redirect(new URL(await homeFor(data.user.id), request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=google", request.url));
}
