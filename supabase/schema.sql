-- CHESS//X database schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor (or `psql` against any Postgres 14+).
--
-- Design notes:
--   * Players are identified by a unique display name for now (no auth
--     system yet — see the app's roadmap notes). avatar_url points at a
--     file in the "avatars" Storage bucket.
--   * A tournament's bracket (rounds/matches) is stored as JSONB rather than
--     fully normalized into rows. The bracket-building logic already lives
--     in TypeScript (src/lib/tournament.ts) and is easiest to keep there —
--     JSONB lets the whole bracket move in and out of Postgres as one
--     document without translating tree structure into join tables.
--   * `matches` is a normalized, queryable log of decisive games (one row
--     per finished game), separate from the JSONB bracket blob, so you can
--     do things like "show me all of Alice's games" with a plain SQL query
--     instead of parsing JSON.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────
-- players
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  rating      integer not null default 1200,
  games       integer not null default 0,
  wins        integer not null default 0,
  losses      integer not null default 0,
  draws       integer not null default 0,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists players_rating_idx on players (rating desc);

-- ─────────────────────────────────────────────────────────────────────────
-- tournaments
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  players     jsonb not null default '[]'::jsonb,  -- seeded player-name order
  rounds      jsonb not null default '[]'::jsonb,  -- BracketMatch[][] — see src/lib/tournament.ts
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tournaments_created_at_idx on tournaments (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- matches — one row per finished game, independent of bracket structure
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid references tournaments(id) on delete set null,
  round          integer,          -- null if not part of a tournament
  white_player   text not null references players(name) on update cascade,
  black_player   text not null references players(name) on update cascade,
  result         text not null check (result in ('white', 'black', 'draw')),
  white_rating_before integer,
  black_rating_before integer,
  white_rating_after  integer,
  black_rating_after  integer,
  pgn            text,             -- optional: full move list, if you want to store it
  played_at      timestamptz not null default now()
);

create index if not exists matches_tournament_idx on matches (tournament_id);
create index if not exists matches_players_idx on matches (white_player, black_player);

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at housekeeping
-- ─────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists players_set_updated_at on players;
create trigger players_set_updated_at
  before update on players
  for each row execute function set_updated_at();

drop trigger if exists tournaments_set_updated_at on tournaments;
create trigger tournaments_set_updated_at
  before update on tournaments
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- There's no auth system yet, so these policies are intentionally open —
-- anyone with the anon key can read and write. That's fine for a casual
-- local/friend-group tool, but is the first thing to tighten once real
-- accounts exist (e.g. restrict UPDATE on players to the row's owner).
-- ─────────────────────────────────────────────────────────────────────────
alter table players enable row level security;
alter table tournaments enable row level security;
alter table matches enable row level security;

create policy "players are publicly readable" on players
  for select using (true);
create policy "players are publicly writable" on players
  for insert with check (true);
create policy "players are publicly updatable" on players
  for update using (true);

create policy "tournaments are publicly readable" on tournaments
  for select using (true);
create policy "tournaments are publicly writable" on tournaments
  for insert with check (true);
create policy "tournaments are publicly updatable" on tournaments
  for update using (true);

create policy "matches are publicly readable" on matches
  for select using (true);
create policy "matches are publicly writable" on matches
  for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Storage: avatars bucket
-- Run this part in the Supabase SQL editor too — it configures the bucket
-- created via Storage → New bucket → name it exactly "avatars", public.
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "anyone can upload an avatar" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "anyone can update an avatar" on storage.objects
  for update using (bucket_id = 'avatars');
