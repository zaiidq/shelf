import { connection, NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { searchMedia, userMessageFor } from "@/lib/media/search";
import { isSearchCategory } from "@/lib/media/types";

/**
 * GET /api/search?category=films&q=interstellar
 *
 * Signed-in people only, so our API keys can't be used by anyone on the
 * internet. Results are cached per query (see the provider modules).
 */
export async function GET(request: NextRequest) {
  await connection(); // always run per request, never prerender
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to search." }, { status: 401 });
  }

  const category = request.nextUrl.searchParams.get("category");
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (!isSearchCategory(category)) {
    return NextResponse.json({ error: "Unknown search category." }, { status: 400 });
  }
  if (query.length < 1 || query.length > 100) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchMedia(category, query);
    return NextResponse.json({ results }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("[search]", error);
    return NextResponse.json({ error: userMessageFor(error) }, { status: 502 });
  }
}
