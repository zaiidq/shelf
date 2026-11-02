# Shelf — project brief for Claude Code

Read this file fully before every task. It holds decisions already made with the owner (Yaseen). Do not re-open them; if something here blocks you, stop and ask.

## What we are building

Shelf is a free web platform where anyone gets a personal page at `shelf-domain/username` that shows who they are through what they love: their ranked favorite films, shows, books and music, plus what they're into right now. It goes in an Instagram/TikTok bio.

- It is NOT a Linktree clone. Taste first, social links last and small.
- A visitor should understand "what kind of person this is" within 10–20 seconds.
- Mobile-first. Most visits come from Instagram's in-app browser on a phone: the public page must be fast and light.
- Product name "Shelf" is a working name; the domain is not chosen yet. Never hard-code the domain; use an env var (`NEXT_PUBLIC_SITE_URL`).

## Decisions already made

- **Language:** English-only UI. No RTL layout. But user-written text (bio, notes, "why I love it") can be in any language, so render it with `dir="auto"`.
- **Audience:** global.
- **Business model:** completely free for now. No payments, no premium code paths.
- **One theme only: "Cinema"** (dark, cinematic). There are no other presets or themes. Do not build a theme system beyond what's below.
- **What a user can customize, and nothing more:**
  1. Cover image at the top of the profile (upload). If none, use the backdrop of their #1 film from TMDB; if no film, a neutral dark fallback.
  2. Profile photo (upload). If none, a circle in the accent color with their initial.
  3. One accent color picked from a fixed palette (see tokens). Accent drives: the Now Playing dot and label, progress bar, "All-time No. 1" label, avatar fallback, focus rings, primary buttons.
  4. The order of sections, and which sections are visible.
- **Section order is personal.** The FIRST section on a profile gets "hero" treatment (larger, featured #1 item) and drives the link preview image. Someone who puts Music first gets a music-led page and preview.
- **Editing happens in place** on the profile page itself (an "Edit" toggle for the owner), not in a separate dashboard. Larger settings (accent, cover, section order/visibility, connected accounts) open in a side sheet over the page. A separate `/settings` page exists only for account things: email, password, delete account.
- **Ranking matters more than rating.** Every list is ordered by drag and drop; #1 means "my favorite". A 1–5 rating is optional per item.

## Stack (decided)

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS.
- Supabase: Postgres, Auth (email magic link + Google), Storage (avatars, covers). Row Level Security on every table.
- SQL migrations in `supabase/migrations/`, checked in. Generate TS types from the schema.
- Upstash Redis for caching (Now Playing, search results).
- dnd-kit for drag and drop.
- `next/og` for generated link-preview images.
- Deploy target: Vercel.
- Data sources:
  - **TMDB** for films and TV (free, non-commercial, attribution required: TMDB logo + "This product uses the TMDB API but is not endorsed or certified by TMDB." in an About/Credits area). Do not store TMDB data longer than 6 months; keep a `fetched_at` and refresh.
  - **Open Library** for books.
  - **Last.fm** for music search metadata AND live listening. Users connect by entering their Last.fm username (Last.fm itself scrobbles from Spotify, Apple Music, YouTube Music etc.). `user.getRecentTracks` returns the now-playing track when present. Do NOT integrate the Spotify, Apple Music or SoundCloud APIs: Spotify's dev mode is restricted and non-commercial, Apple's recently-played endpoint is weak, SoundCloud needs a paid tier.
- All third-party API keys live server-side only (`.env.local`, never `NEXT_PUBLIC_`). Provide `.env.example`.

## Data model (shape; refine names if needed, keep the idea)

One generic model, not a table per media type, so new types (games, anime, podcasts) can be added later without restructuring.

- `profiles`: id (= auth user id), username (unique, lowercase), display_name, bio, location, avatar_path, cover_path, accent (one of the palette keys), created_at, is_hidden (admin takedown).
- `sections`: id, profile_id, kind (`films` | `shows` | `books` | `music` | `currently`), position, visible.
- `media_items`: id, kind (`film` | `show` | `book` | `album` | `track` | `artist`), source (`tmdb` | `openlibrary` | `lastfm`), external_id, title, subtitle (director/author/artist), year, image_url, backdrop_url, metadata jsonb, fetched_at. Unique on (source, external_id). Shared across users.
- `entries`: id, profile_id, section_id, media_item_id, rank, status (`favorite` | `watching` | `reading` | `listening` | `playing` | `completed` | `dropped` | `want`), rating (nullable 1–5), why_i_love_it (short text), progress text (e.g. "S3 · E4", "page 212"), is_private, created_at.
- `social_links`: id, profile_id, platform, url, position.
- `integrations`: profile_id, provider (`lastfm`), external_username, settings jsonb (`show_now_playing`, `show_recent`).
- `reports`: id, profile_id, reason, created_at.

Integrations are written as small provider modules behind one interface (`getNowPlaying`, `getRecent`) so another provider can be added later.

## Design tokens — Cinema (use these exactly)

Fonts (Google Fonts via `next/font`): **Anton** for display (names, section titles, poster titles, uppercase), **Geist** for everything else.

Colors:
- background `#0E0E10`
- surface (cards) `#17171A`
- surface-2 (placeholders) `#26262B`
- border / dividers `#222226`
- text `#EDEAE4`
- text-secondary `#C9C5BD`
- text-muted `#9A968E`
- footer muted `#6E6A63`

Accent palette (user picks one; default `amber`). Every option must keep 4.5:1 contrast for small text on `#0E0E10` — verify and adjust if any fails:
- amber `#E8B04B` · sky `#6CB6FF` · mint `#5FD3A5` · coral `#F07A5A` · plus up to 4 more you propose, same rule.

Shape and spacing: page side padding 24px; cards radius 14px; posters radius 8px; section gap ~44px. Section titles: Anton, 30px, uppercase. Profile name: Anton, ~72px, uppercase.

A static reference mockup of the public profile is in `docs/design/profile-cinema.html` and a link-preview mockup in `docs/design/link-preview.html`. Match their structure and feel: cover header with gradient into the background, avatar + @handle, big name, bio; Now Playing card with album art, track, artist, progress bar; first section as hero (huge #1 card with backdrop, rank "01" watermark, "All-time No. 1", title, meta, "why I love it" quote) followed by a 4-up poster grid for #2–#5; later sections more compact (lists, small cards); footer with social links and a small "shelf" wordmark.

Motion: subtle only (fade-in, poster hover lift). Respect `prefers-reduced-motion`. No heavy animation libraries.

## Empty states (important)

No empty boxes, ever, on the public page.
- An empty section is hidden on the public page.
- A section with 1 item shows it as a hero ("The one film"), so it looks intentional.
- 2–3 items get a different, fuller layout than 5+.
- Onboarding requires at least 3 items in one section before publishing.
- In edit mode the owner sees friendly prompts to add items where sections are empty.

## Link previews

Each profile has a generated OG image (1200×630): avatar, "Name's Shelf", a one-line summary from their top items, the now-playing line if live, and the top 3 posters/covers from their first section. Section URLs (`/username/films`) get their own preview ("Zaid's Top 5 Films"). Regenerate when the profile changes; cache otherwise.

## Now Playing

The public page never calls Last.fm directly. A server route fetches `user.getRecentTracks` (limit small), caches the result in Redis for ~20–30s per user, and the page polls that route. If nothing is playing, show "Recently played" (if the user enabled it) or hide the card. Respect Last.fm rate limits.

## Minimum safety (build now, keep small)

- Reserved usernames: every app route and common words (`login`, `signup`, `api`, `settings`, `explore`, `about`, `admin`, `edit`, `help`, `terms`, `privacy`, `shelf`, etc.). Usernames: 3–30 chars, `a-z 0-9 _ .`, plus a basic offensive-word filter.
- A small "Report" link on every public profile → `reports` table.
- `is_hidden` flag lets an admin take a profile down.
- Image uploads: jpg/png/webp only, size limit (e.g. 5 MB), resized server-side.
- Terms page stating minimum age 13.

## Out of scope for now (do not build)

Other themes/presets, custom fonts or backgrounds beyond cover image, games/anime/podcasts sections, guestbook, follows, explore, taste similarity, AI taste descriptions, QR codes, embeddable widgets, payments, Arabic UI.

## Milestones (do them in order; stop after each one for review)

1. **Scaffold:** Next.js + TS + Tailwind, fonts, design tokens as Tailwind theme / CSS variables, lint + format, `.env.example`, Supabase project wiring, initial migration with the schema above and RLS.
2. **Public profile, read-only:** `/[username]` rendered from seed data, matching the reference mockup on phone widths (360–430px) and looking good on desktop. Static/ISR rendering for speed.
3. **Auth + onboarding:** sign up, pick username, avatar, short bio, add at least 3 items, publish.
4. **Search & add:** server routes for TMDB, Open Library, Last.fm search; add-item sheet with results as posters; status, rating, "why I love it".
5. **In-place edit mode:** reorder items and sections with dnd-kit, show/hide sections, edit text inline, side sheet for accent / cover / avatar / links.
6. **Now Playing:** connect Last.fm by username, cached server route, polling card, privacy toggles.
7. **Link previews:** OG images for profiles and sections.
8. **Safety minimum + legal pages + TMDB attribution.**
9. **Polish & deploy:** performance pass (Lighthouse on mobile), accessibility pass (contrast, keyboard, focus, alt text), Vercel deploy.

## How to work

- The owner is learning as we go: explain briefly what you did and why at the end of each milestone, in plain language, and list anything he must do himself (create accounts, API keys, env vars).
- Plan before coding each milestone; keep changes focused on that milestone.
- Commit in small, clear commits. Never commit secrets.
- Before adding a dependency not listed above, say why.
- Accessibility is part of "done": real buttons and links, labels on inputs, alt text on images, visible focus, 44px touch targets.
