import "server-only";

import { cacheLife } from "next/cache";

import {
  asArray,
  asRecord,
  asString,
  fetchJson,
  MediaProviderError,
  yearFrom,
  type MediaDetails,
  type SearchResult,
} from "./types";

/**
 * TMDB (films and TV). https://developer.themoviedb.org/docs
 * Accepts either a v3 "API Key" or a v4 "API Read Access Token" in
 * TMDB_API_KEY. Attribution is required (Milestone 8).
 */

const API = "https://api.themoviedb.org/3";
const IMAGES = "https://image.tmdb.org/t/p";

type TmdbType = "movie" | "tv";

function request(path: string, params: Record<string, string>): Promise<unknown> {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new MediaProviderError(
      "TMDB_API_KEY is not set",
      "Film and TV search isn’t set up yet (TMDB_API_KEY is missing).",
    );
  }
  const url = new URL(`${API}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  // v4 read tokens are JWTs ("eyJ…") and go in a header; v3 keys go in the URL.
  const isReadToken = key.startsWith("eyJ");
  if (!isReadToken) url.searchParams.set("api_key", key);

  return fetchJson(url.toString(), {
    provider: "TMDB",
    headers: isReadToken
      ? { Authorization: `Bearer ${key}`, Accept: "application/json" }
      : { Accept: "application/json" },
  });
}

function image(path: unknown, size: "w342" | "w780" | "w1280"): string | null {
  const value = asString(path);
  return value && value.startsWith("/") ? `${IMAGES}/${size}${value}` : null;
}

export async function searchTmdb(type: TmdbType, query: string): Promise<SearchResult[]> {
  "use cache";
  cacheLife("hours");

  const data = asRecord(
    await request(`/search/${type}`, {
      query,
      include_adult: "false",
      language: "en-US",
      page: "1",
    }),
  );

  return asArray(data.results)
    .map(asRecord)
    .filter((r) => typeof r.id === "number")
    .slice(0, 12)
    .map((r) => ({
      source: "tmdb" as const,
      externalId: `${type}:${r.id as number}`,
      kind: type === "movie" ? ("film" as const) : ("show" as const),
      title: asString(type === "movie" ? r.title : r.name) ?? "Untitled",
      subtitle: null, // director/creator needs a details call; fetched on add
      year: yearFrom(type === "movie" ? r.release_date : r.first_air_date),
      imageUrl: image(r.poster_path, "w342"),
    }));
}

/** externalId: "movie:157336" or "tv:1396" */
export async function getTmdbDetails(externalId: string): Promise<MediaDetails> {
  const match = /^(movie|tv):(\d{1,10})$/.exec(externalId);
  if (!match)
    throw new MediaProviderError(`Bad TMDB id ${externalId}`, "That item can’t be added.");
  const type = match[1] as TmdbType;
  const id = match[2]!;

  const data = asRecord(
    await request(`/${type}/${id}`, {
      language: "en-US",
      ...(type === "movie" ? { append_to_response: "credits" } : {}),
    }),
  );

  let subtitle: string | null;
  if (type === "movie") {
    const crew = asArray(asRecord(data.credits).crew).map(asRecord);
    subtitle = asString(crew.find((person) => person.job === "Director")?.name);
  } else {
    const creators = asArray(data.created_by)
      .map((person) => asString(asRecord(person).name))
      .filter((name): name is string => name !== null);
    subtitle = creators.length > 0 ? creators.slice(0, 2).join(" & ") : null;
  }

  return {
    source: "tmdb",
    externalId,
    kind: type === "movie" ? "film" : "show",
    title: asString(type === "movie" ? data.title : data.name) ?? "Untitled",
    subtitle,
    year: yearFrom(type === "movie" ? data.release_date : data.first_air_date),
    imageUrl: image(data.poster_path, "w342"),
    backdropUrl: image(data.backdrop_path, "w1280"),
    genres: asArray(data.genres)
      .map((genre) => asString(asRecord(genre).name))
      .filter((name): name is string => name !== null)
      .slice(0, 3),
  };
}
