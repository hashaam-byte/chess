import { DEFAULT_AVATAR_ID } from "./avatars";

export type ProfileStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  /** Positive = current win streak, negative = current losing streak, 0 = draw or no games yet. */
  currentStreak: number;
  bestWinStreak: number;
  /** Bot games always land here, separate from the stats above, so a bot
   *  loss never quietly drags down a real win streak unless you ask it to. */
  botStats: { gamesPlayed: number; wins: number; losses: number; draws: number };
};

export type Profile = {
  name: string;
  avatarId: string;
  stats: ProfileStats;
};

const STORAGE_KEY = "chess-x:profile";
/** Whether bot results should ALSO count toward the main stats above.
 *  A standalone key (not part of Profile) because it's a setting, not a
 *  stat — it doesn't get reset by anything that resets stats. */
const INCLUDE_BOT_KEY = "chess-x:include-bot-in-stats";

function blankStats(): ProfileStats {
  return { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, bestWinStreak: 0, botStats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 } };
}

export function blankProfile(): Profile {
  return { name: "", avatarId: DEFAULT_AVATAR_ID, stats: blankStats() };
}

export function getIncludeBotInStats(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(INCLUDE_BOT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setIncludeBotInStats(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INCLUDE_BOT_KEY, value ? "1" : "0");
  } catch {}
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
      stats: { ...blankStats(), ...parsed.stats, botStats: { ...blankStats().botStats, ...parsed.stats?.botStats } },
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
      // Spread first so fields this function doesn't own (botStats) survive —
      // rebuilding the object field-by-field would silently drop them.
      ...s,
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

/**
 * Records a bot game result. Always updates the separate botStats bucket;
 * only folds into the main win/loss/streak numbers if the player has opted
 * in (getIncludeBotInStats()) — checked here rather than left to call
 * sites, so there's one place that decision is enforced.
 */
export function recordBotGameResult(outcome: "win" | "loss" | "draw"): Profile | null {
  const profile = getProfile();
  if (!profile) return null;

  const b = profile.stats.botStats;
  const withBotStats: Profile = {
    ...profile,
    stats: {
      ...profile.stats,
      botStats: {
        gamesPlayed: b.gamesPlayed + 1,
        wins: b.wins + (outcome === "win" ? 1 : 0),
        losses: b.losses + (outcome === "loss" ? 1 : 0),
        draws: b.draws + (outcome === "draw" ? 1 : 0),
      },
    },
  };
  saveProfile(withBotStats);

  if (getIncludeBotInStats()) {
    return recordGameResult(outcome);
  }
  return withBotStats;
}