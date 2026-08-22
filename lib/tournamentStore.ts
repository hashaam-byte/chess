import type { Tournament } from "./tournament";
import { getSupabase } from "./supabase";

const STORAGE_KEY = "chess-tourney:tournaments";

function loadAllLocal(): Record<string, Tournament> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Tournament>) : {};
  } catch {
    return {};
  }
}

function saveAllLocal(tournaments: Record<string, Tournament>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

type TournamentRow = {
  id: string;
  name: string;
  players: string[];
  rounds: Tournament["rounds"];
  created_at: string;
};

function fromRow(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    players: row.players,
    rounds: row.rounds,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function listTournaments(): Promise<Tournament[]> {
  const supabase = getSupabase();
  if (!supabase) return Object.values(loadAllLocal()).sort((a, b) => b.createdAt - a.createdAt);

  const { data, error } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as TournamentRow[]).map(fromRow);
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const supabase = getSupabase();
  if (!supabase) return loadAllLocal()[id] ?? null;

  const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return fromRow(data as TournamentRow);
}

export async function saveTournament(t: Tournament): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    const all = loadAllLocal();
    all[t.id] = t;
    saveAllLocal(all);
    return;
  }

  await supabase.from("tournaments").upsert({
    id: t.id,
    name: t.name,
    players: t.players,
    rounds: t.rounds,
    created_at: new Date(t.createdAt).toISOString(),
  });
}

export async function deleteTournament(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    const all = loadAllLocal();
    delete all[id];
    saveAllLocal(all);
    return;
  }

  await supabase.from("tournaments").delete().eq("id", id);
}
