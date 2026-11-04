/**
 * Hosts that media images come from. Images from these hosts go through
 * Next.js image optimization (resized, modern formats). Used by
 * next.config.ts and by <Artwork>, which shows images from any OTHER host
 * unoptimized instead of crashing the page.
 */
export const MEDIA_IMAGE_HOSTS = [
  { hostname: "image.tmdb.org", pathname: "/t/p/**" }, // films & shows
  { hostname: "covers.openlibrary.org", pathname: "/b/**" }, // books
  { hostname: "lastfm.freetls.fastly.net", pathname: "/i/**" }, // music
  { hostname: "lastfm-img.freetls.fastly.net", pathname: "/i/**" }, // music (newer host)
] as const;

/** Supabase Storage host (uploaded avatars and covers), from the env. */
export function supabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** True if next/image is configured to optimize images from this URL. */
export function isOptimizableImage(src: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.hostname !== "127.0.0.1") return false;
  if (url.hostname === supabaseImageHost()) return true;
  return MEDIA_IMAGE_HOSTS.some((host) => host.hostname === url.hostname);
}
