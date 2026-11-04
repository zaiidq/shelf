-- =============================================================================
-- Shelf — publishing a shelf from onboarding
--
-- 1. Reserved usernames are enforced in the database, so nobody can claim
--    /login or /api by calling the API directly.
-- 2. Usernames may not start or end with "." or contain "..".
-- 3. publish_shelf(): creates the profile, its sections and its first entries
--    in ONE transaction. A profile only exists once it is published, so
--    half-finished onboardings never appear at /username.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Reserved usernames
-- Keep in sync with RESERVED_USERNAMES in src/lib/username.ts.
-- -----------------------------------------------------------------------------
create table private.reserved_usernames (
  username text primary key
);

insert into private.reserved_usernames (username) values
  -- app routes and files
  ('_next'), ('api'), ('auth'), ('login'), ('logout'), ('signin'), ('signout'), ('signup'),
  ('register'), ('onboarding'), ('settings'), ('account'), ('accounts'), ('edit'), ('new'),
  ('explore'), ('search'), ('about'), ('help'), ('support'), ('contact'), ('terms'),
  ('privacy'), ('legal'), ('credits'), ('report'), ('reports'), ('admin'), ('dashboard'),
  ('favicon.ico'), ('robots.txt'), ('sitemap.xml'), ('manifest.json'), ('manifest.webmanifest'),
  ('opengraph-image'), ('twitter-image'), ('icon'), ('apple-icon'),
  -- brand and common words
  ('shelf'), ('shelves'), ('official'), ('team'), ('staff'), ('moderator'), ('mod'),
  ('root'), ('system'), ('www'), ('app'), ('static'), ('assets'), ('public'), ('images'),
  ('img'), ('home'), ('index'), ('feed'), ('blog'), ('news'), ('status'), ('security'),
  ('docs'), ('mail'), ('email'), ('profile'), ('profiles'), ('user'), ('users'), ('me'),
  ('null'), ('undefined'), ('notifications'), ('messages'), ('films'), ('shows'),
  ('books'), ('music'), ('currently');

create function private.check_username_not_reserved()
returns trigger
language plpgsql
security definer -- reads private.reserved_usernames, which users cannot read
set search_path = ''
as $$
begin
  if exists (select 1 from private.reserved_usernames r where r.username = new.username) then
    raise exception 'Username "%" is reserved', new.username
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function private.check_username_not_reserved() from public, anon, authenticated;

create trigger profiles_username_not_reserved
  before insert or update of username on public.profiles
  for each row execute function private.check_username_not_reserved();

alter table public.profiles
  add constraint profiles_username_dots
  check (username !~ '(^\.|\.$|\.\.)');

-- -----------------------------------------------------------------------------
-- publish_shelf()
--
-- Runs as the calling user (security invoker), so every insert goes through
-- the normal Row Level Security policies and column grants.
--
-- p_items: ordered JSON array, first = rank 1:
--   [{ "media_item_id": uuid, "status": entry_status, "rating": 1-5|null,
--      "why_i_love_it": text|null, "progress": text|null }, ...]
-- -----------------------------------------------------------------------------
create function public.publish_shelf(
  p_username     text,
  p_display_name text,
  p_bio          text,
  p_section_kind public.section_kind,
  p_items        jsonb,
  p_avatar_path  text default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id    uuid := auth.uid();
  v_section_id uuid;
  v_kind       public.section_kind;
  v_position   smallint := 1;
begin
  if v_user_id is null then
    raise exception 'Not signed in' using errcode = 'insufficient_privilege';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'This account already has a shelf' using errcode = 'unique_violation';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) < 3 then
    raise exception 'Add at least 3 items before publishing' using errcode = 'check_violation';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many items' using errcode = 'check_violation';
  end if;

  -- Uploaded avatars must live in the user's own folder.
  if p_avatar_path is not null and p_avatar_path not like v_user_id::text || '/%' then
    raise exception 'Invalid avatar path' using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, username, display_name, bio, avatar_path)
  values (
    v_user_id,
    lower(p_username),
    btrim(p_display_name),
    nullif(btrim(coalesce(p_bio, '')), ''),
    p_avatar_path
  );

  -- The section filled during onboarding comes first (hero). The others are
  -- created empty, so they are ready in edit mode; empty sections never show
  -- on the public page.
  insert into public.sections (profile_id, kind, position)
  values (v_user_id, p_section_kind, 0)
  returning id into v_section_id;

  foreach v_kind in array enum_range(null::public.section_kind) loop
    if v_kind <> p_section_kind then
      insert into public.sections (profile_id, kind, position)
      values (v_user_id, v_kind, v_position);
      v_position := v_position + 1;
    end if;
  end loop;

  insert into public.entries
    (profile_id, section_id, media_item_id, rank, status, rating, why_i_love_it, progress)
  select
    v_user_id,
    v_section_id,
    (item ->> 'media_item_id')::uuid,
    ordinality::smallint,
    coalesce(item ->> 'status', 'favorite')::public.entry_status,
    (item ->> 'rating')::smallint,
    nullif(btrim(coalesce(item ->> 'why_i_love_it', '')), ''),
    nullif(btrim(coalesce(item ->> 'progress', '')), '')
  from jsonb_array_elements(p_items) with ordinality as t(item, ordinality);

  return lower(p_username);
end;
$$;

revoke execute on function public.publish_shelf(text, text, text, public.section_kind, jsonb, text)
  from public, anon;
grant execute on function public.publish_shelf(text, text, text, public.section_kind, jsonb, text)
  to authenticated;
