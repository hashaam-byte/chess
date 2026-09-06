import { DEFAULT_AVATAR_ID } from "./avatars";

export type ProfileStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  /** Positive = current win streak, negative = current losing streak, 0 = draw or no games yet. */
  currentStreak: number;
  bestWinStreak: number;
};

export type Profile = {
  name: string;
  avatarId: string;
  stats: ProfileStats;
};

const STORAGE_KEY = "chess-x:profile";

function blankStats(): ProfileStats {
  return { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, bestWinStreak: 0 };
}

export function blankProfile(): Profile {
  return { name: "", avatarId: DEFAULT_AVATAR_ID, stats: blankStats() };
}

/**
 * Reads the saved profile. Safe against older saves made before `stats`
 * existed — missing or malformed stats are backfilled with zeros rather
 * than crashing or silently dropping the person's name/avatar.
 */
export function getProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (!parsed.name) return null;
    return {
      name: parsed.name,
      avatarId: parsed.avatarId ?? DEFAULT_AVATAR_ID,
      stats: { ...blankStats(), ...parsed.stats },
    };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/** Updates streak/win-loss stats after one of your games finishes. No-ops if no profile is set up. */
export function recordGameResult(outcome: "win" | "loss" | "draw"): Profile | null {
  const profile = getProfile();
  if (!profile) return null;

  const s = profile.stats;
  const currentStreak =
    outcome === "win" ? (s.currentStreak > 0 ? s.currentStreak + 1 : 1) :
    outcome === "loss" ? (s.currentStreak < 0 ? s.currentStreak - 1 : -1) :
    0;

  const next: Profile = {
    ...profile,
    stats: {
      gamesPlayed: s.gamesPlayed + 1,
      wins: s.wins + (outcome === "win" ? 1 : 0),
      losses: s.losses + (outcome === "loss" ? 1 : 0),
      draws: s.draws + (outcome === "draw" ? 1 : 0),
      currentStreak,
      bestWinStreak: Math.max(s.bestWinStreak, currentStreak),
    },
  };

  saveProfile(next);
  return next;
}
