import Image from "next/image";

import { isOptimizableImage } from "@/lib/image-hosts";

import type { MediaItem } from "@/lib/profile/types";

const SQUARE_KINDS = new Set<MediaItem["kind"]>(["album", "track", "artist"]);

/** Posters and book covers are 2:3; album art is square. */
export function isSquare(item: MediaItem): boolean {
  return SQUARE_KINDS.has(item.kind);
}

type ArtworkProps = {
  item: MediaItem;
  /** Size hint for responsive images, e.g. "(min-width: 640px) 140px, 22vw". */
  sizes: string;
  /** Font size class for the placeholder title. */
  titleClassName?: string;
  /** Padding around the placeholder title. */
  paddingClassName?: string;
  className?: string;
  priority?: boolean;
};

/**
 * Poster / cover / album art. Fills its parent (which sets size and shape).
 * Without an image it shows a tinted placeholder with the title, like the
 * mockup, so there is never an empty box.
 */
export function Artwork({
  item,
  sizes,
  titleClassName = "text-[13px]",
  paddingClassName = "p-2",
  className = "",
  priority = false,
}: ArtworkProps) {
  if (item.imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
        <Image
          src={item.imageUrl}
          unoptimized={!isOptimizableImage(item.imageUrl)}
          alt={item.title}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-end overflow-hidden bg-surface-2 ${paddingClassName} ${className}`}
      style={item.tint ? { backgroundColor: item.tint } : undefined}
      role="img"
      aria-label={item.title}
    >
      <span
        aria-hidden="true"
        dir="auto"
        className={`font-display leading-[1.05] break-words uppercase ${titleClassName}`}
      >
        {item.title}
      </span>
    </div>
  );
}
