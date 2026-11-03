import type { EntryStatus, MediaKind, SectionKind, ShelfEntry, ShelfSection } from "./types";

const SECTION_TITLES: Record<SectionKind, string> = {
  films: "Films",
  shows: "Shows",
  books: "Books",
  music: "Music",
  currently: "Currently",
};

/** Statuses that mean "in progress right now". */
const IN_PROGRESS: ReadonlySet<EntryStatus> = new Set([
  "watching",
  "reading",
  "listening",
  "playing",
]);

export function isInProgress(entry: ShelfEntry): boolean {
  return IN_PROGRESS.has(entry.status);
}

/**
 * Section heading. A section where everything is in progress is named after
 * what the person is doing ("Reading", "Watching"); otherwise after the kind.
 */
export function sectionTitle(section: ShelfSection): string {
  const first = section.entries[0];
  if (section.kind !== "currently" && first && section.entries.every(isInProgress)) {
    const allSame = section.entries.every((e) => e.status === first.status);
    if (allSame) return statusLabel(first.status, first.item.kind);
  }
  return SECTION_TITLES[section.kind];
}

const NOUNS: Record<MediaKind, string> = {
  film: "film",
  show: "show",
  book: "book",
  album: "album",
  track: "song",
  artist: "artist",
};

/** "The one film", used when a section has a single favorite. */
export function theOneLabel(kind: MediaKind): string {
  return `The one ${NOUNS[kind]}`;
}

const WANT_VERBS: Record<MediaKind, string> = {
  film: "Want to watch",
  show: "Want to watch",
  book: "Want to read",
  album: "Want to listen",
  track: "Want to listen",
  artist: "Want to listen",
};

export function statusLabel(status: EntryStatus, kind: MediaKind): string {
  switch (status) {
    case "favorite":
      return "Favorite";
    case "watching":
      return "Watching";
    case "reading":
      return "Reading";
    case "listening":
      return "Listening";
    case "playing":
      return "Playing";
    case "completed":
      return "Completed";
    case "dropped":
      return "Dropped";
    case "want":
      return WANT_VERBS[kind];
  }
}

/** "01", "02"… */
export function formatRank(rank: number): string {
  return String(rank).padStart(2, "0");
}

/** "Christopher Nolan · 2014 · Sci-Fi" */
export function itemMeta(entry: ShelfEntry, { withGenre = false } = {}): string {
  const { subtitle, year, genres } = entry.item;
  const parts: string[] = [];
  if (subtitle) parts.push(subtitle);
  if (year) parts.push(String(year));
  if (withGenre && genres[0]) parts.push(genres[0]);
  return parts.join(" · ");
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  twitter: "X",
  youtube: "YouTube",
  letterboxd: "Letterboxd",
  lastfm: "Last.fm",
  goodreads: "Goodreads",
  spotify: "Spotify",
  website: "Website",
};

export function platformLabel(platform: string): string {
  const known = PLATFORM_LABELS[platform.toLowerCase()];
  if (known) return known;
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

/** 154 → "2:34" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
