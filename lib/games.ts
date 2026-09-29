import { getSupabase } from "./supabase";

/** Whether a Supabase project is configured at all — used to tell "not set up" apart from "set up but this request failed" in the UI. */
export function getSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

export type GameStatus = "waiting" | "active" | "finished";
export type Seat = "white" | "black";

export type LiveGame = {
  id: string;
  whiteName: string | null;
  whiteAvatarId: string | null;
  blackName: string | null;
  blackAvatarId: string | null;
  fen: string;
  pgn: string;
  status: GameStatus;
  result: "white" | "black" | "draw" | null;
  /** null means untimed — every clock-related field below is meaningless if so. */
  timeMinutes: number | null;
  timeIncrement: number;
  whiteTimeMs: number | null;
  blackTimeMs: number | null;
  /** ISO timestamp of when the side "on the clock" started thinking. */
  turnStartedAt: string | null;
};

type GameRow = {
  id: string;
  white_name: string | null;
  white_avatar_id: string | null;
  black_name: string | null;
  black_avatar_id: string | null;
  fen: string;
  pgn: string;
  status: GameStatus;
  result: "white" | "black" | "draw" | null;
  time_minutes: number | null;
  time_increment: number;
  white_time_ms: number | null;
  black_time_ms: number | null;
  turn_started_at: string | null;
};

// A game not pinged in this long is treated as abandoned (tab closed,
// crashed, etc.) and disappears from Watch on its own — no cron job needed.
const STALE_AFTER_MS = 90_000;

function fromRow(row: GameRow): LiveGame {
  return {
    id: row.id,
    whiteName: row.white_name,
    whiteAvatarId: row.white_avatar_id,
    blackName: row.black_name,
    blackAvatarId: row.black_avatar_id,
    fen: row.fen,
    pgn: row.pgn,
    status: row.status,
    result: row.result,
    timeMinutes: row.time_minutes,
    timeIncrement: row.time_increment,
    whiteTimeMs: row.white_time_ms,
    blackTimeMs: row.black_time_ms,
    turnStartedAt: row.turn_started_at,
  };
}

/** Reads the fullmove number out of a FEN string, for a rough "Move N" display. */
export function moveNumberFromFen(fen: string): number {
  const n = parseInt(fen.trim().split(" ")[5] ?? "1", 10);
  return Number.isNaN(n) ? 1 : n;
}

/** Whose turn it is right now, per the FEN's active-color field. */
export function turnFromFen(fen: string): Seat {
  return fen.trim().split(" ")[1] === "b" ? "black" : "white";
}

/**
 * Live remaining time for a seat, right now, accounting for time elapsed
 * since turn_started_at if that seat is the one currently "on the clock".
 * Pure function of the game's last-known state + wall-clock time, so both
 * players' (and spectators') browsers compute the identical countdown
 * independently, without needing a server round trip every second.
 * Returns null for an untimed game.
 */
export function computeRemainingMs(game: LiveGame, seat: Seat): number | null {
  if (game.timeMinutes == null) return null;
  const stored = seat === "white" ? game.whiteTimeMs : game.blackTimeMs;
  if (stored == null) return null;
  const isOnClock = game.status === "active" && turnFromFen(game.fen) === seat;
  if (!isOnClock || !game.turnStartedAt) return stored;
  const elapsed = Date.now() - new Date(game.turnStartedAt).getTime();
  return Math.max(0, stored - elapsed);
}

export const TIME_PRESETS = {
  bullet: { minutes: 1, increment: 0 },
  blitz: { minutes: 5, increment: 0 },
  rapid: { minutes: 10, increment: 5 },
  classical: { minutes: 30, increment: 20 },
} as const;
export type TimePreset = keyof typeof TIME_PRESETS | "custom" | "untimed";

/** Lists games in progress (both seats filled, recently active). Empty if Supabase isn't configured. */
export async function listLiveGames(): Promise<LiveGame[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const { data, error } = await supabase
    .from("live_games")
    .select("*")
    .eq("status", "active")
    .gte("updated_at", cutoff)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return (data as GameRow[]).map(fromRow);
}

export async function getLiveGame(id: string): Promise<LiveGame | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from("live_games").select("*").eq("id", id).maybeSingle();
  if (error) console.error("getLiveGame failed:", error.message, error);
  if (error || !data) return null;
  return fromRow(data as GameRow);
}

export type CreateGameOptions = {
  /** Which seat the creator takes. "random" resolves to white/black immediately. */
  color: Seat | "random";
  /** null = untimed. */
  timeMinutes: number | null;
  timeIncrement: number;
};

/**
 * Creates a game waiting for an opponent, in whichever seat the creator
 * didn't take. Returns the new game's id and the creator's resolved seat
 * (useful when color was "random"), or null if unconfigured.
 */
export async function createLiveGame(
  creator: { name: string; avatarId: string },
  fen: string,
  options: CreateGameOptions
): Promise<{ id: string; seat: Seat } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const seat: Seat = options.color === "random" ? (Math.random() < 0.5 ? "white" : "black") : options.color;
  const startMs = options.timeMinutes != null ? options.timeMinutes * 60_000 : null;

  const row: Record<string, unknown> = {
    fen,
    pgn: "",
    time_minutes: options.timeMinutes,
    time_increment: options.timeIncrement,
    white_time_ms: startMs,
    black_time_ms: startMs,
  };
  if (seat === "white") {
    row.white_name = creator.name;
    row.white_avatar_id = creator.avatarId;
  } else {
    row.black_name = creator.name;
    row.black_avatar_id = creator.avatarId;
  }

  const { data, error } = await supabase.from("live_games").insert(row).select("id").maybeSingle();
  if (error || !data) {
    // Surfaced to devtools rather than swallowed — a silent null here reads
    // as "Supabase isn't configured" to the caller, which is misleading if
    // it's actually configured but rejecting the insert (e.g. a migration
    // that hasn't been run yet, adding columns this insert now relies on).
    if (error) console.error("createLiveGame failed:", error.message, error);
    return null;
  }
  return { id: (data as { id: string }).id, seat };
}

/**
 * Attempts to join a waiting game, taking whichever seat is still open.
 * Reads the row first to find the open seat, then attempts a conditional
 * update guarded on that specific seat still being empty — same
 * optimistic-concurrency shape as before, just generalized to either seat
 * now that the creator can be either color.
 * Returns the seat claimed if this call won it, or null otherwise (someone
 * else won the seat first, or the game isn't in a joinable state).
 */
export async function joinLiveGame(id: string, joiner: { name: string; avatarId: string }): Promise<Seat | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: current } = await supabase.from("live_games").select("*").eq("id", id).maybeSingle();
  if (!current) return null;
  const row = current as GameRow;
  const openSeat: Seat | null = row.white_name == null ? "white" : row.black_name == null ? "black" : null;
  if (!openSeat || row.status !== "waiting") return null;

  const nameCol = openSeat === "white" ? "white_name" : "black_name";
  const avatarCol = openSeat === "white" ? "white_avatar_id" : "black_avatar_id";

  const { data, error } = await supabase
    .from("live_games")
    .update({
      [nameCol]: joiner.name,
      [avatarCol]: joiner.avatarId,
      status: "active",
      turn_started_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "waiting")
    .is(nameCol, null)
    .select("id")
    .maybeSingle();

  return !error && data ? openSeat : null;
}

/** Untimed-game path — no clock bookkeeping, unchanged from before. */
export async function updateLiveGame(id: string, fen: string, pgn: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("live_games").update({ fen, pgn }).eq("id", id);
}

export type MoveResult = { flagFall: Seat } | null;

/**
 * Records a move. For untimed games this is identical to updateLiveGame.
 * For timed games, deducts the time the mover just spent (plus their
 * increment) from their clock, and switches turn_started_at to now so the
 * opponent's clock starts running. If the mover's clock would go to zero
 * or below, the game is finished immediately with the opponent as the
 * winner (a "flag fall") instead of writing the move.
 */
export async function recordMove(id: string, fen: string, pgn: string): Promise<MoveResult> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: current } = await supabase.from("live_games").select("*").eq("id", id).maybeSingle();
  if (!current) return null;
  const row = current as GameRow;

  if (row.time_minutes == null) {
    await supabase.from("live_games").update({ fen, pgn }).eq("id", id);
    return null;
  }

  // The FEN's active-color field names whoever moves NEXT, so the mover is
  // the other side.
  const mover: Seat = fen.trim().split(" ")[1] === "b" ? "white" : "black";
  const moverTimeCol = mover === "white" ? "white_time_ms" : "black_time_ms";
  const storedMs = (mover === "white" ? row.white_time_ms : row.black_time_ms) ?? 0;
  const elapsed = row.turn_started_at ? Date.now() - new Date(row.turn_started_at).getTime() : 0;
  const remaining = storedMs - elapsed + row.time_increment * 1000;

  if (remaining <= 0) {
    const winner: Seat = mover === "white" ? "black" : "white";
    await supabase
      .from("live_games")
      .update({ status: "finished", result: winner, [moverTimeCol]: 0 })
      .eq("id", id);
    return { flagFall: mover };
  }

  await supabase
    .from("live_games")
    .update({ fen, pgn, [moverTimeCol]: remaining, turn_started_at: new Date().toISOString() })
    .eq("id", id);
  return null;
}

export async function finishLiveGame(id: string, result: "white" | "black" | "draw"): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("live_games").update({ status: "finished", result }).eq("id", id);
}

/** Heartbeat — call periodically while a game's tab is open so it doesn't go stale. */
export async function pingLiveGame(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  // Postgres fires the updated_at trigger on any UPDATE, even one that
  // writes back the same value — so re-writing the current fen is a safe,
  // reliable way to "touch" the row without needing a separate column.
  const { data } = await supabase.from("live_games").select("fen").eq("id", id).maybeSingle();
  if (!data) return;
  await supabase.from("live_games").update({ fen: (data as { fen: string }).fen }).eq("id", id);
}

/**
 * Deletes old rows to keep the table small — not needed for correctness
 * (the staleness filter in listLiveGames already hides dead games from
 * Watch), just housekeeping. Two separate rules:
 *   - finished games older than a day: the result's been seen, no reason
 *     to keep the row around forever.
 *   - waiting/active games with no heartbeat in ABANDONED_AFTER_MS: genuinely
 *     abandoned (tab closed, browser crashed, etc.), not just "someone's
 *     thinking hard about a move" — a real move or a heartbeat ping both
 *     touch updated_at, so a legitimately ongoing game never hits this.
 *     Kept comfortably above the 20s heartbeat interval so normal network
 *     hiccups never cause a false cleanup.
 * Safe to call opportunistically (e.g. whenever Watch loads) — cheap when
 * there's nothing to clean up, and harmless if called concurrently from
 * two tabs at once.
 */
const ABANDONED_AFTER_MS = 2.5 * 60 * 1000;

export async function cleanupStaleGames(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const finishedCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const abandonedCutoff = new Date(Date.now() - ABANDONED_AFTER_MS).toISOString();

  await supabase.from("live_games").delete().eq("status", "finished").lt("updated_at", finishedCutoff);
  await supabase.from("live_games").delete().in("status", ["waiting", "active"]).lt("updated_at", abandonedCutoff);
}

/**
 * Subscribes to live changes on a single game. Calls `onChange` with the
 * updated row whenever it changes. Returns an unsubscribe function.
 * No-ops (returns a no-op cleanup) if Supabase isn't configured.
 */
export function subscribeToGame(id: string, onChange: (game: LiveGame) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`live_games:${id}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "live_games", filter: `id=eq.${id}` },
      (payload) => onChange(fromRow(payload.new as GameRow))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to any change on the live_games table so a list page can
 * refetch. Deliberately coarse (any INSERT/UPDATE/DELETE triggers one
 * refetch) rather than trying to patch state incrementally — simpler to
 * get right, and cheap at this scale.
 */
export function subscribeToGameList(onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel("live_games:list")
    .on("postgres_changes", { event: "*", schema: "public", table: "live_games" }, () => onChange())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}