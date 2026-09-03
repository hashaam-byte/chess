-- CHESS//X database schema, v2 (Supabase / Postgres)
-- Scoped only to what this version of the app actually does: play a game,
-- let it show up on Watch. No accounts, no ELO, no tournaments — those were
-- deliberately scrapped. Add them back as separate migrations if/when they
-- come back.
--
-- Design notes:
--   * No "players" or "profiles" table yet — there's no account system, so
--     a player's name/avatar are just denormalized text columns on the game
--     itself (whatever they'd set locally at the time they started playing).
--     This is intentionally simple; normalize into a real profiles table
--     once accounts exist.
--   * `fen` is the single source of truth for board position. The
--     spectator view polls this table and re-renders from `fen` — it does
--     not replay `pgn` move by move. `pgn` is stored purely for the move
--     list / review UI, not for reconstructing position.
--   * Polling, not Realtime, for v1: simpler to reason about and debug.
--     Swapping to `supabase.channel(...).on('postgres_changes', ...)` later
--     is a client-side change only — this schema doesn't need to change.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create table if not exists live_games (
  id               uuid primary key default gen_random_uuid(),
  white_name       text not null,
  white_avatar_id  text not null,
  black_name       text not null,
  black_avatar_id  text not null,
  fen              text not null,
  pgn              text not null default '',
  status           text not null default 'active' check (status in ('active', 'finished')),
  result           text check (result in ('white', 'black', 'draw')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists live_games_status_idx on live_games (status, updated_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists live_games_set_updated_at on live_games;
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

-- Optional cleanup: finished games older than a day don't need to hang
-- around forever. Run manually or wire up as a scheduled Supabase Edge
-- Function / pg_cron job later — not required for the app to work.
-- delete from live_games where status = 'finished' and updated_at < now() - interval '1 day';
