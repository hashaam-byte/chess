-- CHESS//X tournament schema, v1 (Supabase / Postgres)
--
-- Design notes:
--   * "open" tournaments: anyone can add their own name during signup.
--     "closed" tournaments: the creator pre-lists invited_names up front,
--     and joining just claims one of those names — it doesn't let someone
--     type an arbitrary new name in. Both still have no real accounts
--     behind them (matches the rest of the app), so "claiming" a name is
--     still just a local-device thing, same trust model as live_games.
--   * Pairing happens once, at start_at, client-triggered (see
--     lib/tournaments.ts: startTournamentIfDue) — there's no server cron in
--     this setup, so whoever's browser happens to load the tournament page
--     after start_at passes is the one that triggers it. A guarded UPDATE
--     (status='signup' -> 'active') makes this safe even if two people's
--     browsers both try at once — only one can win the transition.
--   * `rounds` reuses the same BracketMatch[][] shape as the old ELO-based
--     tournament system did (seed order, byes, propagateWinners) — that
--     bracket algorithm was already solid, only the seeding input changes
--     (random shuffle instead of rating-based).
--   * Each BracketMatch gets a `gameId` once two known players actually
--     start playing it — that id points at a row in live_games, reusing
--     100% of the existing board/multiplayer/eval/review infrastructure
--     rather than building a second parallel game system.

create extension if not exists "pgcrypto";

create table if not exists tournaments (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  visibility            text not null default 'open' check (visibility in ('open', 'closed')),
  invited_names         jsonb not null default '[]'::jsonb,
  start_at              timestamptz not null,
  time_control_minutes  integer,
  prize_text            text,
  prize_image_url       text,
  status                text not null default 'signup' check (status in ('signup', 'active', 'completed')),
  players               jsonb not null default '[]'::jsonb,
  rounds                jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists tournament_signups (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  name           text not null,
  avatar_id      text not null,
  joined_at      timestamptz not null default now(),
  unique (tournament_id, name)
);

create index if not exists tournaments_status_idx on tournaments (status, start_at);
create index if not exists tournament_signups_tournament_idx on tournament_signups (tournament_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tournaments_set_updated_at on tournaments;
create trigger tournaments_set_updated_at
  before update on tournaments
  for each row execute function set_updated_at();

alter table tournaments enable row level security;
alter table tournament_signups enable row level security;

create policy "tournaments are publicly readable" on tournaments for select using (true);
create policy "tournaments are publicly writable" on tournaments for insert with check (true);
create policy "tournaments are publicly updatable" on tournaments for update using (true);

create policy "signups are publicly readable" on tournament_signups for select using (true);
create policy "signups are publicly writable" on tournament_signups for insert with check (true);

alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table tournament_signups;
