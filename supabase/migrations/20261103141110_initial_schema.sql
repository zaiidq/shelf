-- =============================================================================
-- Shelf — initial schema
--
-- One generic model for every media type (films, shows, books, music…), so new
-- types can be added later by extending the enums, not by adding tables.
--
-- Security model (Row Level Security is ON for every table):
--   * Anyone (signed in or not) can read public profile data, unless the
--     profile is hidden by an admin, the section is hidden, or the entry is
--     private.
--   * Owners can read and change their own rows (but never `is_hidden`).
--   * `media_items` is a shared catalogue: readable by all, written only by the
--     server (service role).
--   * `reports` can be created by anyone and read by nobody through the API.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------------------
create type public.section_kind as enum ('films', 'shows', 'books', 'music', 'currently');
create type public.media_kind as enum ('film', 'show', 'book', 'album', 'track', 'artist');
create type public.media_source as enum ('tmdb', 'openlibrary', 'lastfm');
create type public.entry_status as enum (
  'favorite', 'watching', 'reading', 'listening', 'playing', 'completed', 'dropped', 'want'
);

-- Private schema for helpers. It is not exposed through the Data API.
create schema if not exists private;

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one per user, id = auth user id
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique
                 constraint profiles_username_format check (username ~ '^[a-z0-9_.]{3,30}$'),
  display_name text not null
                 constraint profiles_display_name_length check (char_length(display_name) between 1 and 50),
  bio          text constraint profiles_bio_length check (char_length(bio) <= 160),
  location     text constraint profiles_location_length check (char_length(location) <= 60),
  avatar_path  text,
  cover_path   text,
  -- Keep in sync with src/lib/accents.ts
  accent       text not null default 'amber'
                 constraint profiles_accent_valid
                 check (accent in ('amber', 'sky', 'mint', 'coral', 'lilac', 'rose', 'lime')),
  is_hidden    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- sections: which sections a profile has, their order and visibility
-- -----------------------------------------------------------------------------
create table public.sections (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind       public.section_kind not null,
  position   smallint not null constraint sections_position_positive check (position >= 0),
  visible    boolean not null default true,
  created_at timestamptz not null default now(),
  -- one section of each kind per profile (also serves as the profile_id index)
  constraint sections_profile_kind_unique unique (profile_id, kind),
  -- deferred so a drag-and-drop reorder can swap positions inside one transaction
  constraint sections_profile_position_unique unique (profile_id, position)
    deferrable initially deferred,
  -- lets entries reference (section, profile) together, see below
  constraint sections_id_profile_unique unique (id, profile_id)
);

-- -----------------------------------------------------------------------------
-- media_items: shared catalogue of things people love (from TMDB, Open Library,
-- Last.fm). TMDB data must be refreshed within 6 months: see fetched_at.
-- -----------------------------------------------------------------------------
create table public.media_items (
  id           uuid primary key default gen_random_uuid(),
  kind         public.media_kind not null,
  source       public.media_source not null,
  external_id  text not null constraint media_items_external_id_length check (char_length(external_id) between 1 and 200),
  title        text not null constraint media_items_title_length check (char_length(title) between 1 and 300),
  subtitle     text constraint media_items_subtitle_length check (char_length(subtitle) <= 300),
  year         smallint constraint media_items_year_range check (year between 1000 and 3000),
  image_url    text,
  backdrop_url text,
  metadata     jsonb not null default '{}'::jsonb,
  fetched_at   timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  constraint media_items_source_external_id_unique unique (source, external_id)
);

-- for the "refresh items older than N months" job
create index media_items_fetched_at_idx on public.media_items (fetched_at);

-- -----------------------------------------------------------------------------
-- entries: an item on someone's shelf, ranked within a section
-- -----------------------------------------------------------------------------
create table public.entries (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  section_id    uuid not null,
  media_item_id uuid not null references public.media_items (id) on delete restrict,
  rank          smallint not null constraint entries_rank_positive check (rank >= 1),
  status        public.entry_status not null default 'favorite',
  rating        smallint constraint entries_rating_range check (rating between 1 and 5),
  why_i_love_it text constraint entries_why_length check (char_length(why_i_love_it) <= 280),
  progress      text constraint entries_progress_length check (char_length(progress) <= 40),
  is_private    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- the entry's section must belong to the same profile
  constraint entries_section_same_profile_fk
    foreign key (section_id, profile_id)
    references public.sections (id, profile_id) on delete cascade,
  -- deferred so drag-and-drop reorders can swap ranks inside one transaction
  constraint entries_section_rank_unique unique (section_id, rank)
    deferrable initially deferred,
  constraint entries_section_item_unique unique (section_id, media_item_id)
);

create index entries_profile_id_idx on public.entries (profile_id);
create index entries_media_item_id_idx on public.entries (media_item_id);

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- social_links: shown last and small on the profile
-- -----------------------------------------------------------------------------
create table public.social_links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform   text not null constraint social_links_platform_length check (char_length(platform) between 1 and 30),
  url        text not null
               constraint social_links_url_https check (url ~ '^https://' and char_length(url) <= 500),
  position   smallint not null constraint social_links_position_positive check (position >= 0),
  created_at timestamptz not null default now(),
  constraint social_links_profile_position_unique unique (profile_id, position)
    deferrable initially deferred
);

-- -----------------------------------------------------------------------------
-- integrations: connected accounts (Last.fm for now). Owner-only.
-- -----------------------------------------------------------------------------
create table public.integrations (
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  provider          text not null constraint integrations_provider_valid check (provider in ('lastfm')),
  external_username text not null
                      constraint integrations_external_username_length
                      check (char_length(external_username) between 1 and 64),
  settings          jsonb not null default '{"show_now_playing": true, "show_recent": true}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (profile_id, provider)
);

create trigger integrations_set_updated_at
  before update on public.integrations
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- reports: "Report this profile". Anyone can create, nobody reads via the API.
-- -----------------------------------------------------------------------------
create table public.reports (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reason     text not null constraint reports_reason_length check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now()
);

create index reports_profile_id_idx on public.reports (profile_id);

-- =============================================================================
-- Table privileges
-- Explicit grants, so access does not depend on the project's default Data API
-- settings. RLS policies below then decide which ROWS each role can see.
-- =============================================================================
revoke all on
  public.profiles, public.sections, public.media_items, public.entries,
  public.social_links, public.integrations, public.reports
from anon, authenticated;

grant select on
  public.profiles, public.sections, public.media_items, public.entries, public.social_links
to anon, authenticated;

-- Owners may set only these profile columns. is_hidden and timestamps are
-- deliberately left out, so users cannot un-hide themselves.
grant insert (id, username, display_name, bio, location, avatar_path, cover_path, accent)
  on public.profiles to authenticated;
grant update (username, display_name, bio, location, avatar_path, cover_path, accent)
  on public.profiles to authenticated;

grant insert, update, delete on
  public.sections, public.entries, public.social_links
to authenticated;

grant select, insert, update, delete on public.integrations to authenticated;

grant insert on public.reports to anon, authenticated;

grant all on
  public.profiles, public.sections, public.media_items, public.entries,
  public.social_links, public.integrations, public.reports
to service_role;

-- =============================================================================
-- Row Level Security
-- (select auth.uid()) is wrapped in a sub-select so Postgres evaluates it once
-- per query instead of once per row.
-- =============================================================================
alter table public.profiles     enable row level security;
alter table public.sections     enable row level security;
alter table public.media_items  enable row level security;
alter table public.entries      enable row level security;
alter table public.social_links enable row level security;
alter table public.integrations enable row level security;
alter table public.reports      enable row level security;

-- profiles ---------------------------------------------------------------------
create policy "Visible profiles are public; owners see their own"
  on public.profiles for select
  to anon, authenticated
  using (not is_hidden or (select auth.uid()) = id);

create policy "Users create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- sections ---------------------------------------------------------------------
-- The sub-select on profiles runs under the profiles policy above, so a hidden
-- profile's sections are hidden too.
create policy "Visible sections of visible profiles are public; owners see all"
  on public.sections for select
  to anon, authenticated
  using (
    (select auth.uid()) = profile_id
    or (
      visible
      and exists (select 1 from public.profiles p where p.id = profile_id)
    )
  );

create policy "Owners create their sections"
  on public.sections for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "Owners update their sections"
  on public.sections for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Owners delete their sections"
  on public.sections for delete
  to authenticated
  using ((select auth.uid()) = profile_id);

-- media_items ------------------------------------------------------------------
-- Readable by everyone. No insert/update/delete policies: only the server
-- (service role, which bypasses RLS) writes to the shared catalogue.
create policy "Media items are public"
  on public.media_items for select
  to anon, authenticated
  using (true);

-- entries ----------------------------------------------------------------------
create policy "Public entries in visible sections are public; owners see all"
  on public.entries for select
  to anon, authenticated
  using (
    (select auth.uid()) = profile_id
    or (
      not is_private
      and exists (select 1 from public.sections s where s.id = section_id)
    )
  );

create policy "Owners create their entries"
  on public.entries for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "Owners update their entries"
  on public.entries for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Owners delete their entries"
  on public.entries for delete
  to authenticated
  using ((select auth.uid()) = profile_id);

-- social_links -----------------------------------------------------------------
create policy "Links of visible profiles are public; owners see their own"
  on public.social_links for select
  to anon, authenticated
  using (
    (select auth.uid()) = profile_id
    or exists (select 1 from public.profiles p where p.id = profile_id)
  );

create policy "Owners create their links"
  on public.social_links for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "Owners update their links"
  on public.social_links for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Owners delete their links"
  on public.social_links for delete
  to authenticated
  using ((select auth.uid()) = profile_id);

-- integrations (owner only; the server reads them with the service role) -------
create policy "Owners read their integrations"
  on public.integrations for select
  to authenticated
  using ((select auth.uid()) = profile_id);

create policy "Owners create their integrations"
  on public.integrations for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "Owners update their integrations"
  on public.integrations for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Owners delete their integrations"
  on public.integrations for delete
  to authenticated
  using ((select auth.uid()) = profile_id);

-- reports ----------------------------------------------------------------------
-- Anyone may file a report. There is no select policy, so nobody can read
-- reports through the API; admins use the dashboard / service role.
create policy "Anyone can report a profile"
  on public.reports for insert
  to anon, authenticated
  with check (true);

-- =============================================================================
-- Storage: avatars and covers
-- Public buckets (images are shown on public pages). Each user may only write
-- inside a folder named after their user id: "<user id>/<file>".
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('covers',  'covers',  true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Replacing a file (upsert) needs select + insert + update, so all are granted.
create policy "Users read their own profile images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('avatars', 'covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users upload their own profile images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users replace their own profile images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete their own profile images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'covers')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
