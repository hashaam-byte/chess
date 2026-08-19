export const DEFAULT_RATING = 1200;
export const DEFAULT_K_FACTOR = 32;

/** Probability player A is expected to score against player B. */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export type MatchScore = 0 | 0.5 | 1;

/**
 * Standard Elo update for a single game. scoreA is 1 for a win, 0.5 for a
 * draw, 0 for a loss, from player A's perspective.
 */
export function updateElo(
  ratingA: number,
  ratingB: number,
  scoreA: MatchScore,
  kFactor: number = DEFAULT_K_FACTOR
): { ratingA: number; ratingB: number; deltaA: number; deltaB: number } {
  const expectedA = expectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;
  const scoreB = (1 - scoreA) as MatchScore;

  const deltaA = Math.round(kFactor * (scoreA - expectedA));
  const deltaB = Math.round(kFactor * (scoreB - expectedB));

  return {
    ratingA: ratingA + deltaA,
    ratingB: ratingB + deltaB,
    deltaA,
    deltaB,
  };
}
