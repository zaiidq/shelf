import type { AccentKey } from "@/lib/accents";
import type { Enums } from "@/types/database";

export type SectionKind = Enums<"section_kind">;
export type MediaKind = Enums<"media_kind">;
export type EntryStatus = Enums<"entry_status">;

/** A film, show, book, album… as shown on a profile. */
export type MediaItem = {
  kind: MediaKind;
  title: string;
  /** Director, author or artist. */
  subtitle: string | null;
  year: number | null;
  /** Poster / cover / album art. */
  imageUrl: string | null;
  /** Wide image (films and shows), used for the hero card and cover fallback. */
  backdropUrl: string | null;
  genres: string[];
  /** Placeholder color shown while there is no image (hex). */
  tint: string | null;
};

export type ShelfEntry = {
  id: string;
  rank: number;
  status: EntryStatus;
  rating: number | null;
  whyILoveIt: string | null;
  progress: string | null;
  item: MediaItem;
};

/** A visible, non-empty section, entries sorted by rank. */
export type ShelfSection = {
  id: string;
  kind: SectionKind;
  entries: ShelfEntry[];
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type NowPlaying = {
  track: string;
  artist: string;
  album: string | null;
  imageUrl: string | null;
  /** Playback position, when known. Last.fm does not report it (see Milestone 6). */
  elapsedSeconds: number | null;
  durationSeconds: number | null;
};

/** Everything the public profile page needs, already filtered for visitors. */
export type PublicProfile = {
  username: string;
  displayName: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  /** Uploaded cover, else the #1 film's backdrop, else null (neutral fallback). */
  coverUrl: string | null;
  accent: AccentKey;
  /** In the owner's order. The first one gets the hero treatment. */
  sections: ShelfSection[];
  links: SocialLink[];
  nowPlaying: NowPlaying | null;
};
