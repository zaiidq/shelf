import "server-only";

import { cacheLife } from "next/cache";

import type { MediaKind } from "@/lib/profile/types";

import {
  asArray,
  asRecord,
  asString,
  fetchJson,
  MediaProviderError,
  type MediaDetails,
  type SearchResult,
} from "./types";

/**
 * Last.fm (music search). https://www.last.fm/api
 * Last.fm has no stable ids for most albums/tracks, so the external id is
 * built from the names: "album:arctic monkeys|am".
 */

const API = "https://ws.audioscrobbler.com/2.0/";

type LastfmKind = "album" | "track" | "artist";

/** Last.fm's grey-star placeholder (it no longer serves artist photos). */
const PLACEHOLDER_IMAGE = "2a96cbd8b46e442fc41c2b86b821562f";

async function request(params: Record<string, string>): Promise<Record<string, unknown>> {
  const key = process.env.LASTFM_API_KEY;
  if (!key) {
    throw new MediaProviderError(
      "LASTFM_API_KEY is not set",
      "Music search isn’t set up yet (LASTFM_API_KEY is missing).",
    );
  }
  const url = new URL(API);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("api_key", key);
  url.searchParams.set("format", "json");

  const data = asRecord(await fetchJson(url.toString(), { provider: "Last.fm" }));
  if (typeof data.error === "number") {
    throw new MediaProviderError(
      `Last.fm error ${data.error}: ${String(data.message)}`,
      data.error === 10 || data.error === 26
        ? "Music search isn’t set up correctly (API key rejected)."
        : data.error === 6
          ? "That item wasn’t found on Last.fm."
          : "Last.fm isn’t responding right now. Try again in a moment.",
    );
  }
  return data;
}

/** Largest image from Last.fm's [{ "#text": url, size }] list. */
function bestImage(images: unknown): string | null {
  const list = asArray(images).map(asRecord);
  for (const size of ["extralarge", "large", "mega", "medium"]) {
    const url = asString(list.find((img) => img.size === size)?.["#text"]);
    if (url && !url.includes(PLACEHOLDER_IMAGE) && url.startsWith("https://")) return url;
  }
  return null;
}

function makeId(kind: LastfmKind, artist: string, name?: string): string {
  const parts = kind === "artist" ? [artist] : [artist, name ?? ""];
  return `${kind}:${parts.map((part) => part.toLowerCase().replaceAll("|", " ")).join("|")}`.slice(
    0,
    200,
  );
}

const KIND: Record<LastfmKind, MediaKind> = { album: "album", track: "track", artist: "artist" };

export async function searchLastfm(type: LastfmKind, query: string): Promise<SearchResult[]> {
  "use cache";
  cacheLife("hours");

  const data = await request({ method: `${type}.search`, [type]: query, limit: "12" });
  const results = asRecord(data.results);
  const matches = asArray(asRecord(results[`${type}matches`])[type]).map(asRecord);

  return matches.flatMap((match) => {
    const name = asString(match.name);
    if (!name) return [];
    const artist = type === "artist" ? name : asString(match.artist);
    if (!artist) return [];
    return [
      {
        source: "lastfm" as const,
        externalId: makeId(type, artist, name),
        kind: KIND[type],
        // Keep the names exactly as Last.fm spells them, for getInfo later.
        title: name,
        subtitle: type === "artist" ? null : artist,
        year: null,
        imageUrl: bestImage(match.image),
      },
    ];
  });
}

/**
 * Details for an item picked from search. Last.fm ids are lowercase, so the
 * original spelling (from the search result) is passed in for display and
 * for the lookup.
 */
export async function getLastfmDetails(
  externalId: string,
  spelling: { title: string; artist: string | null },
): Promise<MediaDetails> {
  const match = /^(album|track|artist):(.+)$/.exec(externalId);
  if (!match)
    throw new MediaProviderError(`Bad Last.fm id ${externalId}`, "That item can’t be added.");
  const type = match[1] as LastfmKind;
  const artist = type === "artist" ? spelling.title : (spelling.artist ?? "");

  // The display spelling must describe the same item as the id.
  if (makeId(type, artist, spelling.title) !== externalId) {
    throw new MediaProviderError(
      `Last.fm spelling mismatch for ${externalId}`,
      "That item can’t be added.",
    );
  }

  const data =
    type === "artist"
      ? asRecord((await request({ method: "artist.getInfo", artist, autocorrect: "0" })).artist)
      : type === "album"
        ? asRecord(
            (
              await request({
                method: "album.getInfo",
                artist,
                album: spelling.title,
                autocorrect: "0",
              })
            ).album,
          )
        : asRecord(
            (
              await request({
                method: "track.getInfo",
                artist,
                track: spelling.title,
                autocorrect: "0",
              })
            ).track,
          );

  const tags = asArray(asRecord(type === "track" ? data.toptags : data.tags).tag)
    .map((tag) => asString(asRecord(tag).name))
    .filter((tag): tag is string => tag !== null)
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
    .slice(0, 2);

  // Tracks have no artwork of their own; use their album's.
  const image = type === "track" ? bestImage(asRecord(data.album).image) : bestImage(data.image);

  return {
    source: "lastfm",
    externalId,
    kind: KIND[type],
    title: asString(data.name) ?? spelling.title,
    subtitle: type === "artist" ? null : artist,
    year: null, // Last.fm doesn't provide release years reliably
    imageUrl: image,
    backdropUrl: null,
    genres: tags,
  };
}
