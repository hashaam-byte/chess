import type { Tournament } from "./tournament";

const STORAGE_KEY = "chess-tourney:tournaments";

function loadAll(): Record<string, Tournament> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Tournament>) : {};
  } catch {
    return {};
  }
}

function saveAll(tournaments: Record<string, Tournament>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tournaments));
}

export function listTournaments(): Tournament[] {
  return Object.values(loadAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getTournament(id: string): Tournament | null {
  return loadAll()[id] ?? null;
}

export function saveTournament(t: Tournament) {
  const all = loadAll();
  all[t.id] = t;
  saveAll(all);
}

export function deleteTournament(id: string) {
  const all = loadAll();
  delete all[id];
  saveAll(all);
}
