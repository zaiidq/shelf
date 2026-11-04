import Image from "next/image";

import { isOptimizableImage } from "@/lib/image-hosts";

import { formatDuration } from "@/lib/profile/labels";
import type { NowPlaying } from "@/lib/profile/types";

/** Two-letter monogram for the album-art placeholder: "Arctic Monkeys" → "AM". */
function monogram(artist: string): string {
  const letters = artist
    .split(/\s+/)
    .map((word) => Array.from(word)[0] ?? "")
    .join("");
  return letters.slice(0, 2).toUpperCase();
}

export function NowPlayingCard({ nowPlaying }: { nowPlaying: NowPlaying }) {
  const { track, artist, album, imageUrl, elapsedSeconds, durationSeconds } = nowPlaying;
  const hasProgress = elapsedSeconds !== null && durationSeconds !== null && durationSeconds > 0;
  const percent = hasProgress ? Math.min(100, (elapsedSeconds / durationSeconds) * 100) : 0;

  return (
    <section aria-label="Now playing" className="flex flex-col gap-3 rounded-card bg-surface p-3.5">
      <div className="flex items-center gap-3.5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            unoptimized={!isOptimizableImage(imageUrl)}
            alt={album ? `${album} cover` : `${track} cover`}
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-poster object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-poster bg-[#3a3a40] font-display text-[22px]"
          >
            {monogram(artist)}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
            />
            Now playing
          </p>
          <p dir="auto" className="truncate text-base font-semibold">
            {track}
          </p>
          <p dir="auto" className="line-clamp-2 text-[13px] leading-[1.35] text-muted">
            {artist}
            {album ? ` · ${album}` : null}
          </p>
        </div>
      </div>

      {hasProgress ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-[3px] rounded-[2px] bg-[#2c2c31]">
            <div className="h-[3px] rounded-[2px] bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <p className="flex justify-between text-[11px] text-muted tabular-nums">
            <span>
              <span className="sr-only">Played </span>
              {formatDuration(elapsedSeconds)}
            </span>
            <span>
              <span className="sr-only">of </span>
              {formatDuration(durationSeconds)}
            </span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
