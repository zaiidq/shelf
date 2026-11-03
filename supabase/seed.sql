-- =============================================================================
-- Demo profile: /zaid  (matches docs/design/profile-cinema.html)
--
-- Same data as src/lib/profile/demo.ts. Keep the two in sync.
--
-- How to load it into your Supabase project: Dashboard → SQL Editor → paste
-- this file → Run. It is safe to run more than once: it removes the old demo
-- user (and, through cascades, its profile, sections, entries and links)
-- before inserting again.
--
-- The demo user has no password and cannot sign in.
-- =============================================================================

begin;

-- 1. Remove a previous copy of the demo ---------------------------------------
delete from auth.users where id = '00000000-0000-4000-8000-00000000da1d';

-- 2. Demo auth user (profiles.id must match an auth user) ---------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-00000000da1d',
  'authenticated', 'authenticated', 'zaid.demo@example.com', '', now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
  '', '', '', ''
);

-- 3. Profile -------------------------------------------------------------------
insert into public.profiles (id, username, display_name, bio, location, accent)
values (
  '00000000-0000-4000-8000-00000000da1d',
  'zaid',
  'Zaid',
  'CS / cars / movies / music. Films that keep me up at night.',
  'Amman',
  'amber'
);

-- 4. Sections (order = position) -----------------------------------------------
insert into public.sections (id, profile_id, kind, position, visible) values
  ('00000000-0000-4000-8000-0000000005e1', '00000000-0000-4000-8000-00000000da1d', 'films', 0, true),
  ('00000000-0000-4000-8000-0000000005e2', '00000000-0000-4000-8000-00000000da1d', 'shows', 1, true),
  ('00000000-0000-4000-8000-0000000005e3', '00000000-0000-4000-8000-00000000da1d', 'books', 2, true);

-- 5. Shared catalogue items ----------------------------------------------------
-- Real TMDB / Open Library ids. Images are left empty for now (placeholder
-- tints are shown instead); they arrive with search in Milestone 4.
insert into public.media_items (kind, source, external_id, title, subtitle, year, metadata) values
  ('film', 'tmdb', 'movie:157336', 'Interstellar',     'Christopher Nolan', 2014, '{"genres": ["Sci-Fi"],   "tint": "#1E2733"}'),
  ('film', 'tmdb', 'movie:155',    'The Dark Knight',  'Christopher Nolan', 2008, '{"genres": ["Action"],   "tint": "#26262B"}'),
  ('film', 'tmdb', 'movie:244786', 'Whiplash',         'Damien Chazelle',   2014, '{"genres": ["Drama"],    "tint": "#4A2E1F"}'),
  ('film', 'tmdb', 'movie:807',    'Se7en',            'David Fincher',     1995, '{"genres": ["Thriller"], "tint": "#2F2B1F"}'),
  ('film', 'tmdb', 'movie:550',    'Fight Club',       'David Fincher',     1999, '{"genres": ["Drama"],    "tint": "#3B1E24"}'),
  ('show', 'tmdb', 'tv:1396',      'Breaking Bad',     'Vince Gilligan',    2008, '{"genres": ["Drama"],    "tint": "#3D4A22"}'),
  ('show', 'tmdb', 'tv:70523',     'Dark',             'Baran bo Odar',     2017, '{"genres": ["Sci-Fi"],   "tint": "#22303A"}'),
  ('show', 'tmdb', 'tv:60059',     'Better Call Saul', 'Vince Gilligan',    2015, '{"genres": ["Drama"],    "tint": "#4A3A1F"}'),
  ('book', 'openlibrary', 'OL1168083W', '1984',        'George Orwell',     1949, '{"genres": ["Fiction"],  "tint": "#6E2B22"}')
on conflict (source, external_id) do nothing;

-- 6. Entries (looked up by source + external_id) -------------------------------
insert into public.entries
  (profile_id, section_id, media_item_id, rank, status, rating, why_i_love_it, progress)
select
  '00000000-0000-4000-8000-00000000da1d',
  e.section_id::uuid,
  m.id,
  e.rank,
  e.status::public.entry_status,
  e.rating,
  e.why,
  e.progress
from (values
  ('00000000-0000-4000-8000-0000000005e1', 'tmdb', 'movie:157336', 1, 'favorite', 5,
     'The movie that made me obsessed with space.', null),
  ('00000000-0000-4000-8000-0000000005e1', 'tmdb', 'movie:155',    2, 'favorite', null, null, null),
  ('00000000-0000-4000-8000-0000000005e1', 'tmdb', 'movie:244786', 3, 'favorite', null, null, null),
  ('00000000-0000-4000-8000-0000000005e1', 'tmdb', 'movie:807',    4, 'favorite', null, null, null),
  ('00000000-0000-4000-8000-0000000005e1', 'tmdb', 'movie:550',    5, 'favorite', null, null, null),
  ('00000000-0000-4000-8000-0000000005e2', 'tmdb', 'tv:1396',      1, 'watching', null, null,
     'Season 3 · Episode 4'),
  ('00000000-0000-4000-8000-0000000005e2', 'tmdb', 'tv:70523',     2, 'completed', null, null, null),
  ('00000000-0000-4000-8000-0000000005e2', 'tmdb', 'tv:60059',     3, 'completed', null, null, null),
  ('00000000-0000-4000-8000-0000000005e3', 'openlibrary', 'OL1168083W', 1, 'reading', null, null,
     'page 212')
) as e(section_id, source, external_id, rank, status, rating, why, progress)
join public.media_items m
  on m.source = e.source::public.media_source and m.external_id = e.external_id;

-- 7. Social links ----------------------------------------------------------------
insert into public.social_links (profile_id, platform, url, position) values
  ('00000000-0000-4000-8000-00000000da1d', 'instagram',  'https://www.instagram.com/', 0),
  ('00000000-0000-4000-8000-00000000da1d', 'letterboxd', 'https://letterboxd.com/',    1),
  ('00000000-0000-4000-8000-00000000da1d', 'lastfm',     'https://www.last.fm/',       2);

commit;
