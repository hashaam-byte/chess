-- Referenced by lib/players.ts and named in README.md, but never actually
-- committed to the repo — without this, listPlayers/getPlayer/recordMatch/
-- claimPlayerName/uploadAvatar all fail silently against a real Supabase
-- project (falling back to per-browser localStorage, or erroring outright
-- for avatar upload, which has no local fallback at all).
--
-- Run this after schema.sql and tournament_schema.sql.

create table if not exists players (
  name        text primary key,
  -- Case-insensitive uniqueness for name claiming (see claimPlayerName in
  -- lib/players.ts) — "Alex" and "alex" are the same claimed name.
  name_key    text generated always as (lower(name)) stored unique,
  rating      integer not null default 1200,
  games       integer not null default 0,
  wins        integer not null default 0,
  losses      integer not null default 0,
  draws       integer not null default 0,
  avatar_url  text,
  avatar_id   text,
  -- Per-browser random token (lib/deviceKey.ts) that "owns" this name, so a
  -- second device can't take over someone else's claimed name. Not a real
  -- account system — clearing localStorage loses the claim, same tradeoff
  -- as every other identity in this app.
  owner_key   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists players_rating_idx on players (rating desc);

create or replace function touch_players_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_touch_updated_at on players;
create trigger players_touch_updated_at
  before update on players
  for each row execute function touch_players_updated_at();

alter table players enable row level security;

-- Same open-policy tradeoff as live_games and tournaments: no accounts, so
-- there's no server-side identity to check ownership against beyond
-- owner_key, which the client itself supplies. Fine for friends and side
-- projects; see the README's note on tightening this before anything
-- sensitive depends on it.
drop policy if exists "players_select" on players;
create policy "players_select" on players for select using (true);
drop policy if exists "players_insert" on players;
create policy "players_insert" on players for insert with check (true);
drop policy if exists "players_update" on players;
create policy "players_update" on players for update using (true);

-- Public read access for player avatars. Uploads still require going
-- through lib/players.ts's uploadAvatar(), which sets the path — this
-- policy just makes the resulting files fetchable.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_public_write" on storage.objects;
create policy "avatars_public_write" on storage.objects for insert
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_public_update" on storage.objects;
create policy "avatars_public_update" on storage.objects for update
  using (bucket_id = 'avatars');