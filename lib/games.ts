import { getSupabase } from "./supabase";

export type LiveGame = {
  id: string;
  whiteName: string;
  whiteAvatarId: string;
  blackName: string;
  blackAvatarId: string;
  fen: string;
  pgn: string;
  status: "active" | "finished";
  result: "white" | "black" | "draw" | null;
};

type GameRow = {
  id: string;
  white_name: string;
  white_avatar_id: string;
  black_name: string;
  black_avatar_id: string;
  fen: string;
  pgn: string;
  status: "active" | "finished";
  result: "white" | "black" | "draw" | null;
};

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

/**
 * Lists games currently in progress. Returns an empty array (not an error)
 * if no Supabase project is connected yet — see .env.local.example.
 */
export async function listLiveGames(): Promise<LiveGame[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("live_games")
    .select("*")
    .eq("status", "active")
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

/**
 * Publishes a new game so it appears on Watch. Returns null if Supabase
 * isn't configured — the caller should treat that as "play locally only,
 * nothing to show spectators" rather than an error.
 */
export async function createLiveGame(
  white: { name: string; avatarId: string },
  black: { name: string; avatarId: string },
  fen: string
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("live_games")
    .insert({
      white_name: white.name,
      white_avatar_id: white.avatarId,
      black_name: black.name,
      black_avatar_id: black.avatarId,
      fen,
      pgn: "",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
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
