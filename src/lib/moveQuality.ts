export type MoveQuality = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

export const QUALITY_LABEL: Record<MoveQuality, string> = {
  best: "Best",
  excellent: "Excellent",
  good: "Good",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export const QUALITY_COLOR: Record<MoveQuality, string> = {
  best: "#7cc576",
  excellent: "#9fd18a",
  good: "#caa356",
  inaccuracy: "#e0b85f",
  mistake: "#e0885f",
  blunder: "#e0685f",
};

/**
 * Classifies a move from the centipawn loss it caused, i.e. how much the
 * position's evaluation (from the mover's own perspective) got worse
 * compared to the engine's best available move. Thresholds are the same
 * rough buckets used by most consumer chess sites — heuristic, not a
 * formal standard.
 */
export function classifyMove(centipawnLoss: number): MoveQuality {
  if (centipawnLoss <= 10) return "best";
  if (centipawnLoss <= 25) return "excellent";
  if (centipawnLoss <= 50) return "good";
  if (centipawnLoss <= 100) return "inaccuracy";
  if (centipawnLoss <= 200) return "mistake";
  return "blunder";
}
