import "server-only";

import { getLastfmDetails, searchLastfm } from "./lastfm";
import { getOpenLibraryDetails, searchOpenLibrary } from "./openlibrary";
import { getTmdbDetails, searchTmdb } from "./tmdb";
import {
  MediaProviderError,
  type MediaDetails,
  type MediaSource,
  type SearchCategory,
  type SearchResult,
} from "./types";

/** Fails fast (outside any cache) when a provider's key is missing. */
function assertConfigured(category: SearchCategory) {
  if ((category === "films" || category === "shows") && !process.env.TMDB_API_KEY) {
    throw new MediaProviderError(
      "TMDB_API_KEY is not set",
      "Film and TV search isn’t set up yet (TMDB_API_KEY is missing).",
    );
  }
  if (
    (category === "albums" || category === "songs" || category === "artists") &&
    !process.env.LASTFM_API_KEY
  ) {
    throw new MediaProviderError(
      "LASTFM_API_KEY is not set",
      "Music search isn’t set up yet (LASTFM_API_KEY is missing).",
    );
  }
}

export async function searchMedia(
  category: SearchCategory,
  query: string,
): Promise<SearchResult[]> {
  assertConfigured(category);
  // Normalized so "Dune " and "dune" share one cache entry.
  const q = query.trim().replace(/\s+/g, " ").toLowerCase();
  switch (category) {
    case "films":
      return searchTmdb("movie", q);
    case "shows":
      return searchTmdb("tv", q);
    case "books":
      return searchOpenLibrary(q);
    case "albums":
      return searchLastfm("album", q);
    case "songs":
      return searchLastfm("track", q);
    case "artists":
      return searchLastfm("artist", q);
  }
}

/**
 * Fetches an item's details from its provider. Never trusts titles or images
 * sent by the browser: those come from the provider. (For Last.fm the
 * spelling is checked against the id.)
 */
export async function getMediaDetails(ref: {
  source: MediaSource;
  externalId: string;
  title: string;
  subtitle: string | null;
}): Promise<MediaDetails> {
  switch (ref.source) {
    case "tmdb":
      assertConfigured("films");
      return getTmdbDetails(ref.externalId);
    case "openlibrary":
      return getOpenLibraryDetails(ref.externalId);
    case "lastfm":
      assertConfigured("albums");
      return getLastfmDetails(ref.externalId, { title: ref.title, artist: ref.subtitle });
  }
}

/** A message that is safe and useful to show the person. */
export function userMessageFor(error: unknown): string {
  if (error instanceof MediaProviderError) return error.userMessage;
  // Errors thrown inside cached functions may lose their class on the way out.
  if (error && typeof error === "object" && "userMessage" in error) {
    const message = (error as { userMessage: unknown }).userMessage;
    if (typeof message === "string") return message;
  }
  return "Search isn’t working right now. Try again in a moment.";
}
