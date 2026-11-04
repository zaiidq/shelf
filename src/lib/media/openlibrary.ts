import "server-only";

import { cacheLife } from "next/cache";

import { siteUrl } from "@/lib/env";

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
 * Open Library (books). No API key. They ask apps to send a User-Agent that
 * identifies the app: https://openlibrary.org/developers/api
 */

const API = "https://openlibrary.org";
const headers = { "User-Agent": `Shelf/0.1 (+${siteUrl})`, Accept: "application/json" };

function cover(coverId: unknown, size: "M" | "L"): string | null {
  return typeof coverId === "number" && coverId > 0
    ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`
    : null;
}

/** "/works/OL1168083W" → "OL1168083W" */
function workId(key: unknown): string | null {
  const match = /^\/works\/(OL\d+W)$/.exec(asString(key) ?? "");
  return match ? match[1]! : null;
}

export async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  "use cache";
  cacheLife("hours");

  const url = new URL(`${API}/search.json`);
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i");
  url.searchParams.set("limit", "12");

  const data = asRecord(await fetchJson(url.toString(), { provider: "Open Library", headers }));

  return asArray(data.docs)
    .map(asRecord)
    .flatMap((doc) => {
      const id = workId(doc.key);
      if (!id) return [];
      return [
        {
          source: "openlibrary" as const,
          externalId: id,
          kind: "book" as const,
          title: asString(doc.title) ?? "Untitled",
          subtitle: asString(asArray(doc.author_name)[0]),
          year: yearFrom(doc.first_publish_year),
          imageUrl: cover(doc.cover_i, "M"),
        },
      ];
    });
}

/** externalId: "OL1168083W" */
export async function getOpenLibraryDetails(externalId: string): Promise<MediaDetails> {
  if (!/^OL\d{1,12}W$/.test(externalId)) {
    throw new MediaProviderError(`Bad Open Library id ${externalId}`, "That item can’t be added.");
  }

  const work = asRecord(
    await fetchJson(`${API}/works/${externalId}.json`, { provider: "Open Library", headers }),
  );

  // The work only links to its author; one more request gets the name.
  const authorKey = asString(asRecord(asRecord(asArray(work.authors)[0]).author).key);
  let author: string | null = null;
  if (authorKey && /^\/authors\/OL\d+A$/.test(authorKey)) {
    try {
      const data = asRecord(
        await fetchJson(`${API}${authorKey}.json`, { provider: "Open Library", headers }),
      );
      author = asString(data.name);
    } catch {
      author = null; // the book is still worth adding without the author
    }
  }

  const coverId = asArray(work.covers).find((id) => typeof id === "number" && id > 0);
  const large = cover(coverId, "L");

  return {
    source: "openlibrary",
    externalId,
    kind: "book",
    title: asString(work.title) ?? "Untitled",
    subtitle: author,
    year: yearFrom(work.first_publish_date),
    imageUrl: large,
    backdropUrl: null,
    genres: asArray(work.subjects)
      .map(asString)
      .filter((subject): subject is string => subject !== null && subject.length <= 30)
      .slice(0, 2),
  };
}
