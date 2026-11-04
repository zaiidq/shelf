"use server";

import { getCurrentUser } from "@/lib/auth";
import type { MediaItem } from "@/lib/profile/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getMediaDetails, userMessageFor } from "./search";
import type { MediaSource } from "./types";

export type AddMediaInput = {
  source: MediaSource;
  externalId: string;
  /** Only used for Last.fm, where the id is built from the names. */
  title: string;
  subtitle: string | null;
};

export type AddMediaResult =
  { ok: true; mediaItemId: string; item: MediaItem } | { ok: false; message: string };

const SOURCES: ReadonlySet<string> = new Set(["tmdb", "openlibrary", "lastfm"]);

/**
 * Saves a picked search result to the shared catalogue (media_items) and
 * returns its id. Details always come from the provider, server-side.
 */
export async function addMediaItem(input: AddMediaInput): Promise<AddMediaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Your session ended. Sign in again." };

  if (
    !SOURCES.has(input.source) ||
    typeof input.externalId !== "string" ||
    input.externalId.length > 200 ||
    typeof input.title !== "string" ||
    input.title.length > 300 ||
    (input.subtitle !== null && (typeof input.subtitle !== "string" || input.subtitle.length > 300))
  ) {
    return { ok: false, message: "That item can’t be added." };
  }

  let details;
  try {
    details = await getMediaDetails(input);
  } catch (error) {
    console.error("[addMediaItem]", error);
    return { ok: false, message: userMessageFor(error) };
  }

  // The shared catalogue is written only by the server (RLS blocks users).
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("media_items")
    .upsert(
      {
        kind: details.kind,
        source: details.source,
        external_id: details.externalId,
        title: details.title.slice(0, 300),
        subtitle: details.subtitle?.slice(0, 300) ?? null,
        year: details.year,
        image_url: details.imageUrl,
        backdrop_url: details.backdropUrl,
        metadata: { genres: details.genres },
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "source,external_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    console.error("[addMediaItem] save failed", error);
    return { ok: false, message: "Couldn’t save that item. Try again." };
  }

  return {
    ok: true,
    mediaItemId: data.id,
    item: {
      kind: details.kind,
      title: details.title,
      subtitle: details.subtitle,
      year: details.year,
      imageUrl: details.imageUrl,
      backdropUrl: details.backdropUrl,
      genres: details.genres,
      tint: null,
    },
  };
}
