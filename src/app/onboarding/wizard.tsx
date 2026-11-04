"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";

import { AddItemSheet, type DraftEntry } from "@/components/add-item/add-item-sheet";
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
import { siteUrl } from "@/lib/env";
import { CATEGORIES_FOR_SECTION } from "@/lib/media/types";
import { formatRank, statusLabel } from "@/lib/profile/labels";
import type { SectionKind } from "@/lib/profile/types";
import {
  checkUsernameRules,
  normalizeUsername,
  USERNAME_MAX,
  USERNAME_MESSAGES,
} from "@/lib/username";

import { checkUsername, publishShelf, type UsernameCheck } from "./actions";

const MIN_ITEMS = 3;
const MAX_ITEMS = 10;
const STEPS = ["Username", "About you", "Your section", "Favorites"] as const;

type Draft = {
  v: 1;
  step: 0 | 1 | 2 | 3;
  username: string;
  displayName: string;
  bio: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  sectionKind: SectionKind | null;
  entries: DraftEntry[];
};

const EMPTY_DRAFT: Draft = {
  v: 1,
  step: 0,
  username: "",
  displayName: "",
  bio: "",
  avatarPath: null,
  avatarUrl: null,
  sectionKind: null,
  entries: [],
};

// Progress is kept in this browser until publishing, so a refresh or a
// closed tab doesn't lose it. Nothing is saved to the database before then.
const storageKey = (userId: string) => `shelf:onboarding:v1:${userId}`;

function loadDraft(userId: string): Draft {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null") as Draft | null;
    if (saved?.v === 1) return { ...EMPTY_DRAFT, ...saved };
  } catch {
    // ignore unreadable drafts
  }
  return EMPTY_DRAFT;
}

function saveDraft(userId: string, draft: Draft | null) {
  try {
    if (draft) localStorage.setItem(storageKey(userId), JSON.stringify(draft));
    else localStorage.removeItem(storageKey(userId));
  } catch {
    // storage full or disabled: the wizard still works, just without resume
  }
}

export function OnboardingWizard({ userId }: { userId: string }) {
  const [draft, setDraft] = useState<Draft>(() => loadDraft(userId));
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  useEffect(() => saveDraft(userId, draft), [userId, draft]);

  // Move focus to the new step's heading, so screen readers announce it.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [draft.step]);

  const go = (step: Draft["step"]) => update({ step });

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex gap-1.5" aria-label={`Step ${draft.step + 1} of ${STEPS.length}`}>
        {STEPS.map((name, index) => (
          <li
            key={name}
            className={`h-1 flex-1 rounded-full ${index <= draft.step ? "bg-accent" : "bg-line"}`}
          >
            <span className="sr-only">
              {name}
              {index < draft.step ? " (done)" : index === draft.step ? " (current)" : ""}
            </span>
          </li>
        ))}
      </ol>

      {draft.step === 0 ? (
        <UsernameStep
          headingRef={headingRef}
          value={draft.username}
          onChange={(username) => update({ username })}
          onNext={(username) => update({ username, step: 1 })}
        />
      ) : draft.step === 1 ? (
        <AboutStep
          headingRef={headingRef}
          draft={draft}
          update={update}
          onBack={() => go(0)}
          onNext={() => go(2)}
        />
      ) : draft.step === 2 ? (
        <SectionStep
          headingRef={headingRef}
          value={draft.sectionKind}
          onPick={(sectionKind) =>
            // Changing section clears items that belong to the old one.
            update({
              sectionKind,
              entries: sectionKind === draft.sectionKind ? draft.entries : [],
              step: 3,
            })
          }
          onBack={() => go(1)}
        />
      ) : (
        <FavoritesStep
          headingRef={headingRef}
          userId={userId}
          draft={draft}
          update={update}
          onBack={() => go(2)}
          onUsernameProblem={() => go(0)}
        />
      )}
    </div>
  );
}

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

function StepHeading({
  headingRef,
  title,
  intro,
}: {
  headingRef: HeadingRef;
  title: string;
  intro: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[44px] leading-[0.95] uppercase focus:outline-none"
      >
        {title}
      </h1>
      <p className="text-[15px] leading-relaxed text-fg-2">{intro}</p>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Step 1: username
 * ------------------------------------------------------------------------- */

type CheckState = { status: "idle" } | { status: "checking" } | UsernameCheck;

function UsernameStep({
  headingRef,
  value,
  onChange,
  onNext,
}: {
  headingRef: HeadingRef;
  value: string;
  onChange: (value: string) => void;
  onNext: (username: string) => void;
}) {
  // Each answer remembers which name it was for, so no stale messages show.
  const [check, setCheck] = useState<{ name: string; state: CheckState }>({
    name: "",
    state: { status: "idle" },
  });
  const inputId = useId();
  const normalized = normalizeUsername(value);
  const host = siteUrl.replace(/^https?:\/\//, "");

  // Rules are checked instantly in the browser; "is it taken?" needs the
  // server, 400 ms after typing stops.
  const ruleProblem = normalized ? checkUsernameRules(normalized) : null;
  useEffect(() => {
    if (!normalized || ruleProblem) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheck({ name: normalized, state: { status: "checking" } });
      const result = await checkUsername(normalized);
      if (!cancelled) setCheck({ name: normalized, state: result });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalized, ruleProblem]);

  const current: CheckState = !normalized
    ? { status: "idle" }
    : ruleProblem
      ? { ok: false, message: USERNAME_MESSAGES[ruleProblem] }
      : check.name === normalized
        ? check.state
        : { status: "checking" };
  const ok = "ok" in current && current.ok && current.username === normalized;
  const message = "ok" in current && !current.ok ? current.message : null;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (ok) onNext(normalized);
      }}
    >
      <StepHeading
        headingRef={headingRef}
        title="Pick your name"
        intro="This is your link. You can put it in your Instagram or TikTok bio."
      />
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className={label}>
          Username
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
          >
            @
          </span>
          <input
            id={inputId}
            className={`${input} pl-9`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={USERNAME_MAX + 1}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            spellCheck={false}
            autoFocus
            aria-invalid={Boolean(message)}
            aria-describedby={`${inputId}-status`}
          />
        </div>
        <p id={`${inputId}-status`} aria-live="polite" className={message ? errorText : hint}>
          {message ??
            ("status" in current && current.status === "checking"
              ? "Checking…"
              : ok
                ? `✓ ${host}/${normalized} is yours if you want it.`
                : "Lowercase letters, numbers, _ and . — 3 to 30 characters.")}
        </p>
      </div>
      <button type="submit" className={primaryButton} disabled={!ok}>
        Continue
      </button>
    </form>
  );
}

/* ----------------------------------------------------------------------------
 * Step 2: name, bio, photo
 * ------------------------------------------------------------------------- */

function AboutStep({
  headingRef,
  draft,
  update,
  onBack,
  onNext,
}: {
  headingRef: HeadingRef;
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const ids = { name: useId(), bio: useId(), photo: useId() };
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const nameOk = draft.displayName.trim().length >= 1;
  const initial = Array.from(draft.displayName.trim() || draft.username)[0]?.toUpperCase() ?? "?";

  async function upload(file: File) {
    setPhotoError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Use a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("That photo is over 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/avatar", { method: "POST", body });
      const result = (await response.json()) as { path?: string; url?: string; error?: string };
      if (!response.ok || !result.path || !result.url) {
        setPhotoError(result.error ?? "Upload failed. Try again.");
      } else {
        update({ avatarPath: result.path, avatarUrl: result.url });
      }
    } catch {
      setPhotoError("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (nameOk) onNext();
      }}
    >
      <StepHeading
        headingRef={headingRef}
        title="About you"
        intro="Your name and a line about you. A photo is optional."
      />

      <div className="flex items-center gap-4">
        {draft.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- just-uploaded preview
          <img
            src={draft.avatarUrl}
            alt="Your photo"
            width={72}
            height={72}
            className="size-[72px] rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-[72px] items-center justify-center rounded-full bg-accent font-display text-3xl text-background"
          >
            {initial}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={ids.photo}
            className={`${secondaryButton} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent`}
          >
            {uploading ? "Uploading…" : draft.avatarUrl ? "Change photo" : "Add a photo"}
            <input
              id={ids.photo}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
          </label>
          {draft.avatarUrl ? (
            <button
              type="button"
              className={textButton}
              onClick={() => update({ avatarPath: null, avatarUrl: null })}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      {photoError ? (
        <p role="alert" className={errorText}>
          {photoError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor={ids.name} className={label}>
          Name
        </label>
        <input
          id={ids.name}
          dir="auto"
          className={input}
          value={draft.displayName}
          onChange={(event) => update({ displayName: event.target.value })}
          maxLength={50}
          autoComplete="name"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={ids.bio} className={label}>
          Bio <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id={ids.bio}
          dir="auto"
          className={`${input} min-h-24 py-3`}
          value={draft.bio}
          onChange={(event) => update({ bio: event.target.value })}
          maxLength={160}
          rows={3}
          placeholder="CS / cars / movies / music."
        />
        <p className={`${hint} text-right`}>{160 - draft.bio.length} left</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className={secondaryButton}>
          Back
        </button>
        <button type="submit" className={`${primaryButton} flex-1`} disabled={!nameOk || uploading}>
          Continue
        </button>
      </div>
    </form>
  );
}

/* ----------------------------------------------------------------------------
 * Step 3: which section leads the page
 * ------------------------------------------------------------------------- */

const SECTION_CHOICES: { kind: SectionKind; title: string; text: string }[] = [
  { kind: "films", title: "Films", text: "Your all-time favorite movies" },
  { kind: "shows", title: "Shows", text: "Series you love or are watching" },
  { kind: "books", title: "Books", text: "Books that shaped you" },
  { kind: "music", title: "Music", text: "Albums, songs and artists" },
];

function SectionStep({
  headingRef,
  value,
  onPick,
  onBack,
}: {
  headingRef: HeadingRef;
  value: SectionKind | null;
  onPick: (kind: SectionKind) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        headingRef={headingRef}
        title="What do you love most?"
        intro="It goes first on your page, big. You can add the others later."
      />
      <ul className="grid grid-cols-2 gap-3">
        {SECTION_CHOICES.map((choice) => (
          <li key={choice.kind}>
            <button
              type="button"
              aria-pressed={value === choice.kind}
              onClick={() => onPick(choice.kind)}
              className={`flex min-h-32 w-full flex-col justify-end gap-1 rounded-card border p-4 text-left transition-colors ${
                value === choice.kind
                  ? "border-accent bg-surface"
                  : "border-line bg-surface hover:border-muted"
              }`}
            >
              <span className="font-display text-[28px] leading-none uppercase">
                {choice.title}
              </span>
              <span className="text-[13px] leading-snug text-muted">{choice.text}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onBack} className={`${secondaryButton} self-start`}>
        Back
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Step 4: add favorites, rank them, publish
 * ------------------------------------------------------------------------- */

const SECTION_NOUN: Record<SectionKind, string> = {
  films: "films",
  shows: "shows",
  books: "books",
  music: "albums, songs or artists",
  currently: "things",
};

function FavoritesStep({
  headingRef,
  userId,
  draft,
  update,
  onBack,
  onUsernameProblem,
}: {
  headingRef: HeadingRef;
  userId: string;
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  onBack: () => void;
  onUsernameProblem: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, startPublishing] = useTransition();
  const kind = draft.sectionKind ?? "films";
  const entries = draft.entries;
  const remaining = Math.max(0, MIN_ITEMS - entries.length);

  function move(index: number, by: -1 | 1) {
    const next = [...entries];
    const [entry] = next.splice(index, 1);
    if (!entry) return;
    next.splice(index + by, 0, entry);
    update({ entries: next });
    setNotice(`${entry.item.title} moved to number ${index + by + 1}.`);
  }

  function publish() {
    setError(null);
    startPublishing(async () => {
      saveDraft(userId, null); // cleared now; restored below if publishing fails
      const result = await publishShelf({
        username: draft.username,
        displayName: draft.displayName,
        bio: draft.bio,
        avatarPath: draft.avatarPath,
        sectionKind: kind,
        items: entries.map((entry) => ({
          mediaItemId: entry.mediaItemId,
          status: entry.status,
          rating: entry.rating,
          whyILoveIt: entry.whyILoveIt,
          progress: entry.progress,
        })),
      });
      // Only reached when publishing failed (success redirects).
      saveDraft(userId, draft);
      if (result && !result.ok) {
        setError(result.message);
        if (result.field === "username") onUsernameProblem();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading
        headingRef={headingRef}
        title="Your favorites"
        intro={`Add at least ${MIN_ITEMS} ${SECTION_NOUN[kind]}. Put your all-time favorite at the top: number 1 gets the big spot.`}
      />

      {entries.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {entries.map((entry, index) => (
            <li
              key={entry.mediaItemId}
              className="flex items-center gap-3 rounded-card bg-surface p-2.5"
            >
              <span className="w-6 shrink-0 text-center text-xs text-muted tabular-nums">
                {formatRank(index + 1)}
              </span>
              <Artwork
                item={entry.item}
                sizes="48px"
                titleClassName="text-[9px]"
                paddingClassName="p-1"
                className={`w-12 shrink-0 rounded-[6px] ${
                  entry.item.kind === "album" ||
                  entry.item.kind === "track" ||
                  entry.item.kind === "artist"
                    ? "aspect-square"
                    : "aspect-[2/3]"
                }`}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span dir="auto" className="truncate text-[15px] font-semibold">
                  {entry.item.title}
                </span>
                <span className="truncate text-xs text-muted">
                  {[statusLabel(entry.status, entry.item.kind), entry.item.subtitle]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className="flex shrink-0">
                <IconButton
                  label={`Move ${entry.item.title} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </IconButton>
                <IconButton
                  label={`Move ${entry.item.title} down`}
                  disabled={index === entries.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </IconButton>
                <IconButton
                  label={`Remove ${entry.item.title}`}
                  onClick={() => {
                    update({ entries: entries.filter((_, i) => i !== index) });
                    setNotice(`${entry.item.title} removed.`);
                  }}
                >
                  ✕
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {notice}
      </p>

      {entries.length < MAX_ITEMS ? (
        <button type="button" onClick={() => setSheetOpen(true)} className={secondaryButton}>
          + Add {entries.length === 0 ? "your first" : "another"}
        </button>
      ) : (
        <p className={hint}>That’s {MAX_ITEMS}. You can add more after publishing.</p>
      )}

      <p className={hint} aria-live="polite">
        {remaining > 0
          ? `${remaining} more to go before you can publish.`
          : "Ready when you are. You can change everything later."}
      </p>

      {error ? (
        <p role="alert" className={errorText}>
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className={secondaryButton} disabled={publishing}>
          Back
        </button>
        <button
          type="button"
          onClick={publish}
          className={`${primaryButton} flex-1`}
          disabled={remaining > 0 || publishing}
        >
          {publishing ? "Publishing…" : "Publish my shelf"}
        </button>
      </div>

      <AddItemSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={CATEGORIES_FOR_SECTION[kind]}
        onAdd={(entry) => {
          if (entries.some((existing) => existing.mediaItemId === entry.mediaItemId)) {
            setNotice(`${entry.item.title} is already on your list.`);
            return;
          }
          update({ entries: [...entries, entry] });
          setNotice(`${entry.item.title} added as number ${entries.length + 1}.`);
        }}
      />
    </div>
  );
}

function IconButton({
  label: text,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={text}
      title={text}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full text-fg-2 hover:bg-surface-2 disabled:opacity-30"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
