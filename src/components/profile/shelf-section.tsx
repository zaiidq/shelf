import { isInProgress, sectionTitle, theOneLabel } from "@/lib/profile/labels";
import type { ShelfSection as Section } from "@/lib/profile/types";

import { DetailCards, EntryList, InProgressItem, PosterGrid } from "./entry-layouts";
import { HeroCard } from "./hero-card";

const TOP_N = 5;

function SectionHeading({ id, title, aside }: { id: string; title: string; aside?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="font-display text-[30px] leading-none tracking-[0.02em] uppercase">
        {title}
      </h2>
      {aside ? <span className="text-xs text-muted">{aside}</span> : null}
    </div>
  );
}

/**
 * One section of the shelf. The first section on the page gets the hero
 * treatment; later ones are more compact. Layout also adapts to how many
 * items there are, so a short section still looks intentional.
 */
export function ShelfSection({ section, isFirst }: { section: Section; isFirst: boolean }) {
  const headingId = `section-${section.kind}`;
  const title = sectionTitle(section);
  const { entries } = section;
  const [top] = entries;
  if (!top) return null; // empty sections are never shown

  // A single favorite: show it big, as "The one film".
  if (entries.length === 1 && top.status === "favorite") {
    return (
      <section aria-labelledby={headingId} className="flex flex-col gap-[18px]">
        <SectionHeading id={headingId} title={title} />
        <HeroCard entry={top} label={theOneLabel(top.item.kind)} />
      </section>
    );
  }

  if (isFirst) {
    return <HeroSection section={section} title={title} headingId={headingId} />;
  }

  const inProgress = entries.filter(isInProgress);
  const others = entries.filter((entry) => !isInProgress(entry));
  const allFavorites = others.length > 0 && others.every((e) => e.status === "favorite");

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3.5">
      <SectionHeading id={headingId} title={title} />
      {inProgress.map((entry) => (
        <InProgressItem key={entry.id} entry={entry} featured={others.length > 0} />
      ))}
      {others.length >= 4 && allFavorites ? (
        <PosterGrid entries={others.slice(0, 8)} columns={4} />
      ) : others.length > 0 ? (
        <EntryList entries={others} />
      ) : null}
    </section>
  );
}

/** First section: huge #1 card, then the rest sized to how many there are. */
function HeroSection({
  section,
  title,
  headingId,
}: {
  section: Section;
  title: string;
  headingId: string;
}) {
  const [top, ...rest] = section.entries;
  if (!top) return null;

  const total = section.entries.length;
  const heroLabel = top.status === "favorite" ? "All-time No. 1" : "Right now";
  const runnersUp = rest.slice(0, TOP_N - 1); // #2–#5
  const beyondTop = rest.slice(TOP_N - 1); // #6+

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-[18px]">
      <SectionHeading
        id={headingId}
        title={title}
        aside={total > 1 ? `Top ${Math.min(total, TOP_N)}` : undefined}
      />
      <HeroCard entry={top} label={heroLabel} />
      {runnersUp.length >= 3 ? (
        <PosterGrid entries={runnersUp} columns={runnersUp.length} />
      ) : runnersUp.length > 0 ? (
        // 2–3 items in total: fuller cards instead of a sparse grid
        <DetailCards entries={runnersUp} />
      ) : null}
      {beyondTop.length > 0 ? <EntryList entries={beyondTop} /> : null}
    </section>
  );
}
