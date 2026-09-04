-- CHESS//X database schema, v3 (Supabase / Postgres)
--
-- Changes from v2:
--   * status now has three states: 'waiting' (created, no opponent yet),
--     'active' (both seats filled), 'finished'.
--   * black_name / black_avatar_id are nullable — empty until someone joins
--     via the share link.
--   * updated_at doubles as a heartbeat: the Play page pings it periodically
--     while the tab is open (see lib/games.ts: pingLiveGame). Watch/list
--     queries filter out anything not pinged recently, so a closed tab
--     disappears from Watch on its own without needing a cron job.
--
-- If you already ran schema v2 and have no real data worth keeping yet,
-- easiest is: drop table live_games cascade; then run this file fresh.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

drop table if exists live_games cascade;

create table live_games (
  id               uuid primary key default gen_random_uuid(),
  white_name       text not null,
  white_avatar_id  text not null,
  black_name       text,
  black_avatar_id  text,
  fen              text not null,
  pgn              text not null default '',
  status           text not null default 'waiting' check (status in ('waiting', 'active', 'finished')),
  result           text check (result in ('white', 'black', 'draw')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index live_games_status_idx on live_games (status, updated_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger live_games_set_updated_at
  before update on live_games
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security — open for now (no accounts to restrict by yet).
-- ─────────────────────────────────────────────────────────────────────────
alter table live_games enable row level security;

create policy "live games are publicly readable" on live_games
  for select using (true);
create policy "live games are publicly writable" on live_games
  for insert with check (true);
create policy "live games are publicly updatable" on live_games
  for update using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Realtime — Supabase only streams postgres_changes for tables explicitly
-- added to this publication.
-- ─────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table live_games;

-- Optional cleanup: finished games older than a day don't need to hang
-- around forever. Run manually, or wire up as a scheduled job later.
-- delete from live_games where status = 'finished' and updated_at < now() - interval '1 day';
