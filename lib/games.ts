export type LiveGame = {
  id: string;
  whiteName: string;
  whiteAvatarId: string;
  blackName: string;
  blackAvatarId: string;
  moveCount: number;
  spectatorCount: number;
};

/**
 * Placeholder data layer for "games currently being played." There's no
 * real-time backend yet (see project notes) — this always returns an empty
 * list so the UI shows its real empty state rather than fake demo games.
 * Once a backend exists, this is the one function to replace.
 */
export async function listLiveGames(): Promise<LiveGame[]> {
  return [];
}
