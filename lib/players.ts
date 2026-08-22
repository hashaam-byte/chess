import { DEFAULT_RATING, updateElo, type MatchScore } from "./elo";
import { getSupabase } from "./supabase";

export type Player = {
  name: string;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  avatarUrl?: string | null;
};

function blankPlayer(name: string): Player {
  return { name, rating: DEFAULT_RATING, games: 0, wins: 0, losses: 0, draws: 0, avatarUrl: null };
}

// ── localStorage fallback (used automatically when Supabase isn't configured) ──

const STORAGE_KEY = "chess-tourney:players";

function loadAllLocal(): Record<string, Player> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Player>) : {};
  } catch {
    return {};
  }
}

function saveAllLocal(players: Record<string, Player>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

// ── row <-> Player mapping ──

type PlayerRow = {
  name: string;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  avatar_url: string | null;
};

function fromRow(row: PlayerRow): Player {
  return {
    name: row.name,
    rating: row.rating,
    games: row.games,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    avatarUrl: row.avatar_url,
  };
}

// ── public API ──

export async function getPlayer(name: string): Promise<Player> {
  const supabase = getSupabase();
  if (!supabase) return loadAllLocal()[name] ?? blankPlayer(name);

  const { data, error } = await supabase.from("players").select("*").eq("name", name).maybeSingle();
  if (error || !data) return blankPlayer(name);
  return fromRow(data as PlayerRow);
}

export async function listPlayers(): Promise<Player[]> {
  const supabase = getSupabase();
  if (!supabase) return Object.values(loadAllLocal()).sort((a, b) => b.rating - a.rating);

  const { data, error } = await supabase.from("players").select("*").order("rating", { ascending: false });
  if (error || !data) return [];
  return (data as PlayerRow[]).map(fromRow);
}

/** Ensures a player row exists (e.g. so a freshly-entered tournament name shows up with a starting rating). */
export async function ensurePlayer(name: string): Promise<Player> {
  const supabase = getSupabase();
  if (!supabase) {
    const all = loadAllLocal();
    if (!all[name]) {
      all[name] = blankPlayer(name);
      saveAllLocal(all);
    }
    return all[name];
  }

  const existing = await getPlayer(name);
  if (existing.games > 0 || existing.avatarUrl) return existing; // already a real row

  const { data, error } = await supabase
    .from("players")
    .upsert({ name, rating: DEFAULT_RATING }, { onConflict: "name", ignoreDuplicates: true })
    .select()
    .maybeSingle();

  if (error || !data) return blankPlayer(name);
  return fromRow(data as PlayerRow);
}

/**
 * Records a completed match result and updates both players' Elo ratings.
 * `result` is from playerA's perspective: 'a' = A won, 'b' = B won, 'draw' = draw.
 *
 * Note: this reads-then-writes each player's rating rather than updating
 * atomically in SQL, so two matches finishing at the exact same instant for
 * the same player could race. Fine for casual use; worth moving into a
 * Postgres function (`update_elo(...)`) if this ever needs to hold up under
 * concurrent traffic.
 */
export async function recordMatch(nameA: string, nameB: string, result: "a" | "b" | "draw"): Promise<{ a: Player; b: Player }> {
  const supabase = getSupabase();

  if (!supabase) {
    const all = loadAllLocal();
    const a = all[nameA] ?? blankPlayer(nameA);
    const b = all[nameB] ?? blankPlayer(nameB);
    const { updatedA, updatedB } = computeUpdate(a, b, result);
    all[nameA] = updatedA;
    all[nameB] = updatedB;
    saveAllLocal(all);
    return { a: updatedA, b: updatedB };
  }

  await ensurePlayer(nameA);
  await ensurePlayer(nameB);
  const a = await getPlayer(nameA);
  const b = await getPlayer(nameB);
  const { updatedA, updatedB } = computeUpdate(a, b, result);

  await supabase.from("players").update({
    rating: updatedA.rating, games: updatedA.games, wins: updatedA.wins, losses: updatedA.losses, draws: updatedA.draws,
  }).eq("name", nameA);
  await supabase.from("players").update({
    rating: updatedB.rating, games: updatedB.games, wins: updatedB.wins, losses: updatedB.losses, draws: updatedB.draws,
  }).eq("name", nameB);

  return { a: updatedA, b: updatedB };
}

function computeUpdate(a: Player, b: Player, result: "a" | "b" | "draw") {
  const scoreA: MatchScore = result === "a" ? 1 : result === "b" ? 0 : 0.5;
  const { ratingA, ratingB } = updateElo(a.rating, b.rating, scoreA);

  const updatedA: Player = {
    ...a,
    rating: ratingA,
    games: a.games + 1,
    wins: a.wins + (result === "a" ? 1 : 0),
    losses: a.losses + (result === "b" ? 1 : 0),
    draws: a.draws + (result === "draw" ? 1 : 0),
  };
  const updatedB: Player = {
    ...b,
    rating: ratingB,
    games: b.games + 1,
    wins: b.wins + (result === "b" ? 1 : 0),
    losses: b.losses + (result === "a" ? 1 : 0),
    draws: b.draws + (result === "draw" ? 1 : 0),
  };
  return { updatedA, updatedB };
}

/**
 * Uploads an avatar image to the "avatars" Storage bucket and attaches its
 * public URL to the player's row. Returns the public URL, or null if
 * Supabase isn't configured (avatars require real storage — there's no
 * localStorage fallback for binary files).
 */
export async function uploadAvatar(name: string, file: File): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  await ensurePlayer(name);

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${name.toLowerCase().replace(/[^a-z0-9-_]/g, "-")}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = data.publicUrl;

  await supabase.from("players").update({ avatar_url: url }).eq("name", name);
  return url;
}
