import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before app pages (never before public profiles, which stay static).
 *
 * 1. Keeps the Supabase session fresh: if the access token expired, it is
 *    refreshed here and the new cookies are written to the response.
 * 2. Sends signed-out people away from private pages, and signed-in people
 *    away from the login page.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Never let a CDN cache a response that sets someone's session.
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  // Do not run other code between createServerClient and getClaims():
  // getClaims() is what refreshes an expired session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPrivatePage = pathname.startsWith("/onboarding") || pathname.startsWith("/settings");

  if (signedIn && isAuthPage) {
    return redirectKeepingCookies(request, response, "/onboarding");
  }
  if (!signedIn && isPrivatePage) {
    return redirectKeepingCookies(request, response, "/login");
  }

  return response;
}

function redirectKeepingCookies(request: NextRequest, from: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  // Only app pages and APIs. Public profiles (/username) are NOT listed,
  // so they never touch cookies and stay fully static.
  matcher: [
    "/login",
    "/signup",
    "/onboarding/:path*",
    "/settings/:path*",
    "/auth/:path*",
    "/api/:path*",
  ],
};
