import type { MediaKind, SectionKind } from "@/lib/profile/types";
import type { Enums } from "@/types/database";

export type MediaSource = Enums<"media_source">;

/** Which search the add-item sheet runs. */
export type SearchCategory = "films" | "shows" | "books" | "albums" | "songs" | "artists";

export const SEARCH_CATEGORIES: readonly SearchCategory[] = [
  "films",
  "shows",
  "books",
  "albums",
  "songs",
  "artists",
];

/** Which searches make sense for each section. */
export const CATEGORIES_FOR_SECTION: Record<SectionKind, readonly SearchCategory[]> = {
  films: ["films"],
  shows: ["shows"],
  books: ["books"],
  music: ["albums", "songs", "artists"],
  currently: ["films", "shows", "books", "albums", "songs"],
};

export function isSearchCategory(value: unknown): value is SearchCategory {
  return typeof value === "string" && (SEARCH_CATEGORIES as readonly string[]).includes(value);
}

/** One search result, as shown in the add-item sheet. */
export type SearchResult = {
  source: MediaSource;
  /** Provider id, e.g. "movie:157336", "OL1168083W", "album:arctic monkeys|am". */
  externalId: string;
  kind: MediaKind;
  title: string;
  subtitle: string | null;
  year: number | null;
  imageUrl: string | null;
};

/** Full details, fetched server-side before an item is saved. */
export type MediaDetails = SearchResult & {
  backdropUrl: string | null;
  genres: string[];
};

/** Thrown for problems the person should see ("search is not set up"). */
export class MediaProviderError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
    this.name = "MediaProviderError";
  }
}

/** "2014-11-05" → 2014 */
export function yearFrom(value: unknown): number | null {
  if (typeof value === "number" && value > 1000 && value < 3000) return value;
  if (typeof value !== "string") return null;
  const match = /\b(1\d{3}|2\d{3})\b/.exec(value);
  return match ? Number(match[1]) : null;
}

export function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** fetch() JSON with a timeout and a clear error. */
export async function fetchJson(
  url: string,
  init: RequestInit & { provider: string },
): Promise<unknown> {
  const { provider, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(url, { ...rest, signal: AbortSignal.timeout(8000) });
  } catch (error) {
    throw new MediaProviderError(
      `${provider} request failed: ${String(error)}`,
      `${provider} isn’t responding right now. Try again in a moment.`,
    );
  }
  if (!response.ok) {
    throw new MediaProviderError(
      `${provider} responded ${response.status} for ${url.replace(/api_key=[^&]+/, "api_key=***")}`,
      response.status === 401
        ? `${provider} search isn’t set up correctly (API key rejected).`
        : `${provider} isn’t responding right now. Try again in a moment.`,
    );
  }
  return response.json();
}
