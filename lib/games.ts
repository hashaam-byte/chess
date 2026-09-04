import { getSupabase } from "./supabase";

export type GameStatus = "waiting" | "active" | "finished";

export type LiveGame = {
  id: string;
  whiteName: string;
  whiteAvatarId: string;
  blackName: string | null;
  blackAvatarId: string | null;
  fen: string;
  pgn: string;
  status: GameStatus;
  result: "white" | "black" | "draw" | null;
};

type GameRow = {
  id: string;
  white_name: string;
  white_avatar_id: string;
  black_name: string | null;
  black_avatar_id: string | null;
  fen: string;
  pgn: string;
  status: GameStatus;
  result: "white" | "black" | "draw" | null;
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
  };
}

/** Reads the fullmove number out of a FEN string, for a rough "Move N" display. */
export function moveNumberFromFen(fen: string): number {
  const n = parseInt(fen.trim().split(" ")[5] ?? "1", 10);
  return Number.isNaN(n) ? 1 : n;
}

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
  if (error || !data) return null;
  return fromRow(data as GameRow);
}

/** Creates a game waiting for an opponent. Returns the new game's id, or null if unconfigured. */
export async function createLiveGame(white: { name: string; avatarId: string }, fen: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("live_games")
    .insert({ white_name: white.name, white_avatar_id: white.avatarId, fen, pgn: "" })
    .select("id")
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

/**
 * Attempts to join a waiting game as Black. The WHERE clause makes this
 * safe against two people clicking the same share link at once — only the
 * first request can succeed, verified against a real race in testing.
 * Returns true if this call is the one that won the seat.
 */
export async function joinLiveGame(id: string, black: { name: string; avatarId: string }): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("live_games")
    .update({ black_name: black.name, black_avatar_id: black.avatarId, status: "active" })
    .eq("id", id)
    .eq("status", "waiting")
    .is("black_name", null)
    .select("id")
    .maybeSingle();

  return !error && !!data;
}

export async function updateLiveGame(id: string, fen: string, pgn: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("live_games").update({ fen, pgn }).eq("id", id);
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
