import type { EntryStatus, MediaKind } from "@/lib/profile/types";

/** Statuses that make sense for each kind of item; the first is the default. */
export const STATUSES_FOR_KIND: Record<MediaKind, readonly EntryStatus[]> = {
  film: ["favorite", "watching", "want"],
  show: ["favorite", "watching", "completed", "dropped", "want"],
  book: ["favorite", "reading", "completed", "dropped", "want"],
  album: ["favorite", "listening", "want"],
  track: ["favorite", "listening"],
  artist: ["favorite", "listening"],
};

/** Statuses where "progress" (episode, page…) is useful. */
export const PROGRESS_PLACEHOLDER: Partial<
  Record<EntryStatus, Partial<Record<MediaKind, string>>>
> = {
  watching: { show: "S3 · E4", film: "Halfway through" },
  reading: { book: "page 212" },
};

export function progressPlaceholder(status: EntryStatus, kind: MediaKind): string | null {
  return PROGRESS_PLACEHOLDER[status]?.[kind] ?? null;
}
