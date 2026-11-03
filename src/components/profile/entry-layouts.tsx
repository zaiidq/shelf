import { formatRank, itemMeta, statusLabel } from "@/lib/profile/labels";
import type { ShelfEntry } from "@/lib/profile/types";

import { Artwork, isSquare } from "./artwork";

const GRID_COLUMNS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/** Ranked posters in a row (#2–#5 under the hero). */
export function PosterGrid({ entries, columns }: { entries: ShelfEntry[]; columns: number }) {
  return (
    <ol className={`grid gap-2 sm:gap-3 ${GRID_COLUMNS[columns] ?? "grid-cols-4"}`}>
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1.5">
          <Artwork
            item={entry.item}
            sizes="(min-width: 640px) 140px, 22vw"
            className={`rounded-poster motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-1 ${
              isSquare(entry.item) ? "aspect-square" : "aspect-[2/3]"
            }`}
          />
          <p className="text-[11px] text-muted tabular-nums">
            <span className="sr-only">Number </span>
            {formatRank(entry.rank)}
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Fuller cards for small sections (2–3 items): artwork plus title, meta and
 * the "why I love it" note, so a short list still feels complete.
 */
export function DetailCards({ entries }: { entries: ShelfEntry[] }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {entries.map((entry) => {
        const meta = itemMeta(entry);
        return (
          <li key={entry.id} className="flex gap-3.5 rounded-card bg-surface p-3">
            <Artwork
              item={entry.item}
              sizes="80px"
              titleClassName="text-[12px]"
              className={`w-[72px] shrink-0 rounded-poster ${isSquare(entry.item) ? "aspect-square" : "aspect-[2/3]"}`}
            />
            <div className="flex min-w-0 flex-col justify-center gap-[3px]">
              <p className="text-[11px] text-muted tabular-nums">
                <span className="sr-only">Number </span>
                {formatRank(entry.rank)}
              </p>
              <p dir="auto" className="text-base font-semibold">
                {entry.item.title}
              </p>
              {meta ? <p className="text-[13px] text-muted">{meta}</p> : null}
              {entry.whyILoveIt ? (
                <p dir="auto" className="mt-1 text-[13px] leading-[1.45] text-fg-2">
                  “{entry.whyILoveIt}”
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Something in progress (watching, reading…). `featured` puts it on a card,
 * used when the section also has a list below it.
 */
export function InProgressItem({ entry, featured }: { entry: ShelfEntry; featured: boolean }) {
  const { item, progress } = entry;

  if (featured) {
    return (
      <div className="flex items-center gap-3.5 rounded-card bg-surface p-3">
        <Artwork
          item={item}
          sizes="80px"
          titleClassName="text-[12px]"
          paddingClassName="p-1.5"
          className="size-[72px] shrink-0 rounded-poster"
        />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <p className="text-[11px] tracking-[0.12em] text-muted uppercase">
            {statusLabel(entry.status, item.kind)}
          </p>
          <p dir="auto" className="text-base font-semibold">
            {item.title}
          </p>
          <p className="text-[13px] text-muted">{progress ?? itemMeta(entry)}</p>
        </div>
      </div>
    );
  }

  const meta = [item.subtitle, progress].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center gap-3.5">
      <Artwork
        item={item}
        sizes="64px"
        titleClassName="text-base"
        paddingClassName="p-1.5"
        className={`w-14 shrink-0 ${isSquare(item) ? "aspect-square rounded-poster" : "aspect-[2/3]"}`}
      />
      <div className="flex min-w-0 flex-col gap-[3px]">
        <p dir="auto" className="text-base font-semibold">
          {item.title}
        </p>
        {meta ? <p className="text-[13px] text-muted">{meta}</p> : null}
      </div>
    </div>
  );
}

/** Compact list rows: title on the left, status (or year) on the right. */
export function EntryList({ entries }: { entries: ShelfEntry[] }) {
  return (
    <ul>
      {entries.map((entry) => {
        const right =
          entry.status === "favorite"
            ? entry.item.year
              ? String(entry.item.year)
              : null
            : statusLabel(entry.status, entry.item.kind);
        return (
          <li
            key={entry.id}
            className="flex items-baseline justify-between gap-4 border-t border-line py-3 text-[15px] last:border-b"
          >
            <span dir="auto" className="min-w-0">
              {entry.item.title}
            </span>
            {right ? <span className="shrink-0 text-[13px] text-muted">{right}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
