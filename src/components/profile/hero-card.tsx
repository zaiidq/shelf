import Image from "next/image";

import { formatRank, itemMeta } from "@/lib/profile/labels";
import type { ShelfEntry } from "@/lib/profile/types";

function titleSizeClass(title: string): string {
  if (title.length > 18) return "text-[34px] sm:text-[44px]";
  if (title.length > 11) return "text-[42px] sm:text-[56px]";
  return "text-[52px] sm:text-[64px]";
}

/**
 * The big featured card for a section's #1 (or only) item: backdrop, faint
 * rank watermark, label, title, meta and the "why I love it" quote.
 */
export function HeroCard({ entry, label }: { entry: ShelfEntry; label: string }) {
  const { item, whyILoveIt } = entry;
  const background = item.backdropUrl ?? item.imageUrl;
  const meta = itemMeta(entry, { withGenre: true });

  return (
    <article
      className="relative isolate flex min-h-[430px] flex-col justify-end gap-2.5 overflow-hidden rounded-card bg-[#1e2733] p-[22px] sm:min-h-[480px]"
      style={item.tint ? { backgroundColor: item.tint } : undefined}
    >
      {background ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={background}
            alt=""
            fill
            sizes="(min-width: 640px) 592px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(14_14_16/0.1)_0%,rgb(14_14_16/0.35)_40%,rgb(14_14_16/0.92)_100%)]" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_40%,rgb(14_14_16/0.35)_100%)]"
        />
      )}

      <div
        aria-hidden="true"
        className="absolute top-5 left-[22px] font-display text-[96px] leading-none opacity-[0.12]"
      >
        {formatRank(entry.rank)}
      </div>

      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{label}</p>
      <h3
        dir="auto"
        className={`font-display leading-[0.95] break-words uppercase ${titleSizeClass(item.title)}`}
      >
        {item.title}
      </h3>
      {meta ? <p className="text-[13px] text-fg-2">{meta}</p> : null}
      {whyILoveIt ? (
        <blockquote
          dir="auto"
          className="mt-1.5 border-t border-white/15 pt-3 text-[15px] leading-[1.45]"
        >
          “{whyILoveIt}”
        </blockquote>
      ) : null}
    </article>
  );
}
