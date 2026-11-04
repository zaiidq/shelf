"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { Artwork } from "@/components/profile/artwork";
import {
  errorText,
  hint,
  input,
  label,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/ui/styles";
import { addMediaItem } from "@/lib/media/actions";
import type { SearchCategory, SearchResult } from "@/lib/media/types";
import { statusLabel } from "@/lib/profile/labels";
import type { EntryStatus, MediaItem } from "@/lib/profile/types";

import { progressPlaceholder, STATUSES_FOR_KIND } from "./statuses";

/** What the sheet hands back when someone adds an item. */
export type DraftEntry = {
  mediaItemId: string;
  item: MediaItem;
  status: EntryStatus;
  rating: number | null;
  whyILoveIt: string;
  progress: string;
};

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  films: "Films",
  shows: "Shows",
  books: "Books",
  albums: "Albums",
  songs: "Songs",
  artists: "Artists",
};

const PLACEHOLDERS: Record<SearchCategory, string> = {
  films: "Search films, e.g. Interstellar",
  shows: "Search shows, e.g. Breaking Bad",
  books: "Search books or authors",
  albums: "Search albums, e.g. AM",
  songs: "Search songs, e.g. 505",
  artists: "Search artists",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (entry: DraftEntry) => void;
  categories: readonly SearchCategory[];
};

/**
 * Search → pick → details → add. A native <dialog>, so focus, Escape and
 * screen readers work without extra code. Bottom sheet on phones, centered
 * panel on larger screens.
 */
export function AddItemSheet({ open, onClose, onAdd, categories }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicking the dimmed backdrop closes the sheet.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-0 mt-auto h-[92dvh] max-h-none w-full max-w-none rounded-t-[20px] bg-background p-0 text-fg backdrop:bg-black/70 sm:m-auto sm:h-[min(720px,90dvh)] sm:max-w-[560px] sm:rounded-[20px] sm:border sm:border-line"
    >
      {open ? (
        <SheetBody
          titleId={titleId}
          categories={categories}
          onClose={onClose}
          onAdd={(entry) => {
            onAdd(entry);
            onClose();
          }}
        />
      ) : null}
    </dialog>
  );
}

function SheetBody({
  titleId,
  categories,
  onClose,
  onAdd,
}: {
  titleId: string;
  categories: readonly SearchCategory[];
  onClose: () => void;
  onAdd: (entry: DraftEntry) => void;
}) {
  const [category, setCategory] = useState<SearchCategory>(categories[0] ?? "films");
  const [picked, setPicked] = useState<SearchResult | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-line px-page py-3">
        <h2 id={titleId} className="font-display text-2xl uppercase">
          {picked ? "Add details" : "Add to your shelf"}
        </h2>
        <button type="button" onClick={onClose} className={textButton}>
          Close
        </button>
      </div>

      {picked ? (
        <DetailsStep result={picked} onBack={() => setPicked(null)} onAdd={onAdd} />
      ) : (
        <SearchStep
          categories={categories}
          category={category}
          onCategory={setCategory}
          onPick={setPicked}
        />
      )}
    </div>
  );
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: SearchResult[] }
  | { status: "error"; message: string };

function SearchStep({
  categories,
  category,
  onCategory,
  onPick,
}: {
  categories: readonly SearchCategory[];
  category: SearchCategory;
  onCategory: (category: SearchCategory) => void;
  onPick: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const searchId = useId();

  // Search 350 ms after typing stops; cancel requests that are out of date.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ status: "loading" });
      try {
        const response = await fetch(
          `/api/search?category=${category}&q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as { results?: SearchResult[]; error?: string };
        if (!response.ok || body.error) {
          setState({ status: "error", message: body.error ?? "Search failed. Try again." });
        } else {
          setState({ status: "done", results: body.results ?? [] });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setState({ status: "error", message: "Search failed. Check your connection." });
        }
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category]);

  const visible = query.trim().length >= 2 ? state : ({ status: "idle" } as const);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 px-page pt-4 pb-3">
        {categories.length > 1 ? (
          <div role="group" aria-label="What to search" className="flex gap-2">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === category}
                onClick={() => onCategory(option)}
                className={`min-h-11 rounded-full border px-4 text-sm ${
                  option === category
                    ? "border-accent bg-accent text-background"
                    : "border-line text-fg-2 hover:border-muted"
                }`}
              >
                {CATEGORY_LABELS[option]}
              </button>
            ))}
          </div>
        ) : null}
        <label htmlFor={searchId} className="sr-only">
          {PLACEHOLDERS[category]}
        </label>
        <input
          id={searchId}
          type="search"
          className={input}
          placeholder={PLACEHOLDERS[category]}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          autoFocus
          enterKeyHint="search"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-page pb-6" aria-live="polite">
        {visible.status === "idle" ? (
          <p className={hint}>Type at least 2 letters to search.</p>
        ) : visible.status === "loading" ? (
          <p className={hint}>Searching…</p>
        ) : visible.status === "error" ? (
          <p role="alert" className={errorText}>
            {visible.message}
          </p>
        ) : visible.results.length === 0 ? (
          <p className={hint}>No results. Try a different spelling.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4">
            {visible.results.map((result) => (
              <li key={`${result.source}:${result.externalId}`}>
                <button
                  type="button"
                  onClick={() => onPick(result)}
                  className="flex w-full flex-col gap-1.5 rounded-poster text-left"
                >
                  <Artwork
                    item={{ ...result, backdropUrl: null, genres: [], tint: null }}
                    sizes="(min-width: 640px) 120px, 30vw"
                    className={`w-full rounded-poster ${
                      result.kind === "film" || result.kind === "show" || result.kind === "book"
                        ? "aspect-[2/3]"
                        : "aspect-square"
                    }`}
                  />
                  <span dir="auto" className="line-clamp-2 text-[13px] leading-tight font-medium">
                    {result.title}
                  </span>
                  <span className="line-clamp-1 text-[11px] text-muted">
                    {[result.subtitle, result.year].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DetailsStep({
  result,
  onBack,
  onAdd,
}: {
  result: SearchResult;
  onBack: () => void;
  onAdd: (entry: DraftEntry) => void;
}) {
  const statuses = STATUSES_FOR_KIND[result.kind];
  const [status, setStatus] = useState<EntryStatus>(statuses[0] ?? "favorite");
  const [rating, setRating] = useState<number | null>(null);
  const [why, setWhy] = useState("");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ids = { status: useId(), why: useId(), progress: useId() };
  const placeholder = progressPlaceholder(status, result.kind);

  function submit() {
    setError(null);
    startTransition(async () => {
      const saved = await addMediaItem({
        source: result.source,
        externalId: result.externalId,
        title: result.title,
        subtitle: result.subtitle,
      });
      if (!saved.ok) {
        setError(saved.message);
        return;
      }
      onAdd({
        mediaItemId: saved.mediaItemId,
        item: saved.item,
        status,
        rating,
        whyILoveIt: why.trim(),
        progress: placeholder ? progress.trim() : "",
      });
    });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-page py-4">
        <div className="flex items-center gap-4">
          <Artwork
            item={{ ...result, backdropUrl: null, genres: [], tint: null }}
            sizes="80px"
            className={`w-[72px] shrink-0 rounded-poster ${
              result.kind === "album" || result.kind === "track" || result.kind === "artist"
                ? "aspect-square"
                : "aspect-[2/3]"
            }`}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p dir="auto" className="text-lg leading-tight font-semibold">
              {result.title}
            </p>
            <p className="text-[13px] text-muted">
              {[result.subtitle, result.year].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={ids.status} className={label}>
            Status
          </label>
          <select
            id={ids.status}
            className={input}
            value={status}
            onChange={(event) => setStatus(event.target.value as EntryStatus)}
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {statusLabel(option, result.kind)}
              </option>
            ))}
          </select>
        </div>

        {placeholder ? (
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.progress} className={label}>
              Progress <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id={ids.progress}
              className={input}
              placeholder={placeholder}
              maxLength={40}
              value={progress}
              onChange={(event) => setProgress(event.target.value)}
            />
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <legend className={`${label} mb-2`}>
            Rating <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={rating !== null && value <= rating}
                aria-label={`${value} out of 5`}
                onClick={() => setRating(rating === value ? null : value)}
                className={`flex size-11 items-center justify-center rounded-full border text-lg ${
                  rating !== null && value <= rating
                    ? "border-accent text-accent"
                    : "border-line text-muted"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor={ids.why} className={label}>
            Why you love it <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id={ids.why}
            dir="auto"
            className={`${input} min-h-24 py-3`}
            maxLength={280}
            rows={3}
            placeholder="One line about what it means to you"
            value={why}
            onChange={(event) => setWhy(event.target.value)}
          />
          <p className={`${hint} text-right`}>{280 - why.length} left</p>
        </div>

        {error ? (
          <p role="alert" className={errorText}>
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex gap-3 border-t border-line px-page py-3">
        <button type="button" onClick={onBack} className={secondaryButton}>
          Back
        </button>
        <button type="submit" className={`${primaryButton} flex-1`} disabled={pending}>
          {pending ? "Adding…" : "Add to shelf"}
        </button>
      </div>
    </form>
  );
}
