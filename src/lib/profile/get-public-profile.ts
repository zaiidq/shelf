import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { DEFAULT_ACCENT, isAccentKey } from "@/lib/accents";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { Json } from "@/types/database";

import { DEMO_NOW_PLAYING, DEMO_PROFILE, DEMO_USERNAME } from "./demo";
import type { MediaItem, PublicProfile, ShelfSection } from "./types";

const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

/** Cache tag for a profile page. Call revalidateTag() with it after edits. */
export function profileCacheTag(username: string): string {
  return `profile:${username}`;
}

/**
 * Loads everything the public profile page shows, as an anonymous visitor
 * would see it. Returns null when the profile does not exist or is hidden.
 *
 * Cached, so the page can be served as static HTML. Edits (Milestone 5) will
 * refresh it with revalidateTag(profileCacheTag(username)).
 */
export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 60 * 60 * 24 });
  cacheTag(profileCacheTag(username));

  if (!isValidUsername(username)) return null;

  if (!isSupabaseConfigured()) {
    return username === DEMO_USERNAME ? DEMO_PROFILE : null;
  }

  const profile = await fetchFromSupabase(username);

  // TODO(Milestone 6): replace with live Now Playing from Last.fm.
  if (profile && username === DEMO_USERNAME && !profile.nowPlaying) {
    profile.nowPlaying = DEMO_NOW_PLAYING;
  }
  return profile;
}

async function fetchFromSupabase(username: string): Promise<PublicProfile | null> {
  const supabase = createPublicClient();

  // One round trip. Row Level Security already hides hidden profiles, hidden
  // sections and private entries from anonymous visitors; the filters below
  // repeat that so this code stays correct even if it runs with more access.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      username, display_name, bio, location, avatar_path, cover_path, accent,
      sections!sections_profile_id_fkey (
        id, kind, position, visible,
        entries (
          id, rank, status, rating, why_i_love_it, progress, is_private,
          media_items ( kind, title, subtitle, year, image_url, backdrop_url, metadata )
        )
      ),
      social_links ( platform, url, position )
      `,
    )
    .eq("username", username)
    .eq("is_hidden", false)
    .maybeSingle();

  if (error) {
    // Throwing (instead of returning null) keeps a temporary database error
    // from being cached as "profile not found".
    throw new Error(`Failed to load profile "${username}": ${error.message}`);
  }
  if (!data) return null;

  const sections: ShelfSection[] = data.sections
    .filter((section) => section.visible)
    .toSorted((a, b) => a.position - b.position)
    .map((section) => ({
      id: section.id,
      kind: section.kind,
      entries: section.entries
        .filter((entry) => !entry.is_private && entry.media_items)
        .toSorted((a, b) => a.rank - b.rank)
        .map((entry) => ({
          id: entry.id,
          rank: entry.rank,
          status: entry.status,
          rating: entry.rating,
          whyILoveIt: entry.why_i_love_it,
          progress: entry.progress,
          // media_items is guaranteed by the filter above
          item: toMediaItem(entry.media_items!),
        })),
    }))
    // Empty sections are never shown on the public page.
    .filter((section) => section.entries.length > 0);

  return {
    username: data.username,
    displayName: data.display_name,
    bio: data.bio,
    location: data.location,
    avatarUrl: storageUrl("avatars", data.avatar_path),
    coverUrl: storageUrl("covers", data.cover_path) ?? topFilmBackdrop(sections),
    accent: isAccentKey(data.accent) ? data.accent : DEFAULT_ACCENT,
    sections,
    links: data.social_links
      .toSorted((a, b) => a.position - b.position)
      .map(({ platform, url }) => ({ platform, url })),
    nowPlaying: null,
  };
}

type MediaRow = {
  kind: MediaItem["kind"];
  title: string;
  subtitle: string | null;
  year: number | null;
  image_url: string | null;
  backdrop_url: string | null;
  metadata: Json;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function toMediaItem(row: MediaRow): MediaItem {
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? row.metadata
      : {};
  const genres = Array.isArray(metadata.genres)
    ? metadata.genres.filter((g): g is string => typeof g === "string")
    : [];
  const tint =
    typeof metadata.tint === "string" && HEX_COLOR.test(metadata.tint) ? metadata.tint : null;

  return {
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    year: row.year,
    imageUrl: row.image_url,
    backdropUrl: row.backdrop_url,
    genres,
    tint,
  };
}

function storageUrl(bucket: "avatars" | "covers", path: string | null): string | null {
  if (!path) return null;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/** Cover fallback: the backdrop of the person's #1 film, if any. */
function topFilmBackdrop(sections: ShelfSection[]): string | null {
  const films = sections.find((section) => section.kind === "films");
  return films?.entries[0]?.item.backdropUrl ?? null;
}
