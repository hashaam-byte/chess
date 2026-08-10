import { DEFAULT_RATING, updateElo, type MatchScore } from "./elo";

export type Player = {
  name: string;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
};

const STORAGE_KEY = "chess-tourney:players";

function loadAll(): Record<string, Player> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Player>) : {};
  } catch {
    return {};
  }
}

function saveAll(players: Record<string, Player>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function blankPlayer(name: string): Player {
  return { name, rating: DEFAULT_RATING, games: 0, wins: 0, losses: 0, draws: 0 };
}

export function getPlayer(name: string): Player {
  return loadAll()[name] ?? blankPlayer(name);
}

export function listPlayers(): Player[] {
  return Object.values(loadAll()).sort((a, b) => b.rating - a.rating);
}

/** Ensures a player row exists (e.g. so a freshly-entered tournament name shows up with a starting rating). */
export function ensurePlayer(name: string): Player {
  const all = loadAll();
  if (!all[name]) {
    all[name] = blankPlayer(name);
    saveAll(all);
  }
  return all[name];
}

/**
 * Records a completed match result and updates both players' Elo ratings.
 * `result` is from playerA's perspective: 'a' = A won, 'b' = B won, 'draw' = draw.
 */
export function recordMatch(nameA: string, nameB: string, result: "a" | "b" | "draw"): { a: Player; b: Player } {
  const all = loadAll();
  const a = all[nameA] ?? blankPlayer(nameA);
  const b = all[nameB] ?? blankPlayer(nameB);

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

  all[nameA] = updatedA;
  all[nameB] = updatedB;
  saveAll(all);
  return { a: updatedA, b: updatedB };
}
