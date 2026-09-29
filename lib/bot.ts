import { Chess } from "chess.js";
import { getEngine } from "./engine";

export type BotTierKey = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king" | "obsidianKing";

export type BotTier = {
  key: BotTierKey;
  name: string;
  /** Approximate strength on Stockfish's own scale (see the note above the
   *  tier list). Use tierEloLabel() for display. */
  approxElo: number;
  depth: number;
  /** Passed to the engine's own strength limiter. Stockfish's UCI_Elo floor
   *  is ~1320 — tiers below that use blunderChance instead (see below). */
  limitElo?: number;
  /** Chance, per move, of playing a random legal move instead of the
   *  engine's choice — how "Pawn" through "Bishop" actually end up weak.
   *  UCI_Elo can't honestly reach beginner strength on its own. */
  blunderChance?: number;
};

// Tier strengths were measured, not assumed: each tier played the others (and
// Stockfish's own lowest setting, UCI_Elo 1320, as a ruler) using exactly the
// parameters below. Two facts shaped the design:
//   - UCI_Elo can't go below 1320, so Pawn/Knight/Bishop get their weakness
//     from a depth-1 search plus a chance of playing a random legal move.
//     That knob is very touchy (at depth 3, 12% -> 22% random moves took a
//     bot from ~1390 to under 700), which is why they all use depth 1.
//   - The limiter's Elo->skill curve is steep, so evenly spaced settings
//     (1500/1800/2100) were NOT evenly spaced in strength; King at 2100 was
//     indistinguishable from Queen at 1800. 1500/2100/2500 separate cleanly.
// Numbers are approximate (small samples, +/-100-150) and are on Stockfish's
// own scale, not FIDE or chess.com Elo. Obsidian King is full strength and is
// shown as "Max" rather than a fabricated number; 2800 is only used internally.
export const BOT_TIERS: Record<BotTierKey, BotTier> = {
  pawn: { key: "pawn", name: "Pawn", approxElo: 800, depth: 1, blunderChance: 0.45 },
  knight: { key: "knight", name: "Knight", approxElo: 950, depth: 1, blunderChance: 0.3 },
  bishop: { key: "bishop", name: "Bishop", approxElo: 1200, depth: 1, blunderChance: 0.22 },
  rook: { key: "rook", name: "Rook", approxElo: 1400, depth: 10, limitElo: 1500 },
  queen: { key: "queen", name: "Queen", approxElo: 1700, depth: 12, limitElo: 2100 },
  king: { key: "king", name: "King", approxElo: 2000, depth: 14, limitElo: 2500 },
  obsidianKing: { key: "obsidianKing", name: "Obsidian King", approxElo: 2800, depth: 16 },
};

/** What to show next to a tier's name. Obsidian King is "Max", not a number. */
export function tierEloLabel(tier: BotTier): string {
  return tier.key === "obsidianKing" ? "Max" : `~${tier.approxElo}`;
}

export const BOT_TIER_ORDER: BotTierKey[] = ["pawn", "knight", "bishop", "rook", "queen", "king", "obsidianKing"];

/**
 * Picks the bot's move for a position. For tiers with a blunderChance, rolls
 * against it first — on a "blunder", plays a uniformly random legal move
 * rather than consulting the engine at all (cheap, and guarantees the weak
 * tiers occasionally do something a real beginner would). Otherwise asks
 * Stockfish, at that tier's depth and (if set) strength cap.
 */
export async function getBotMove(fen: string, tierKey: BotTierKey): Promise<{ from: string; to: string; promotion?: string } | null> {
  const tier = BOT_TIERS[tierKey];
  const position = new Chess(fen);
  const legal = position.moves({ verbose: true });
  if (legal.length === 0) return null;

  if (tier.blunderChance && Math.random() < tier.blunderChance) {
    const pick = legal[Math.floor(Math.random() * legal.length)];
    return { from: pick.from, to: pick.to, promotion: pick.promotion };
  }

  const engine = getEngine();
  const result = await engine.getMove(fen, { depth: tier.depth, limitElo: tier.limitElo });
  if (!result.move) {
    const pick = legal[Math.floor(Math.random() * legal.length)];
    return { from: pick.from, to: pick.to, promotion: pick.promotion };
  }

  return uciToMove(result.move);
}

/** A full-strength suggestion, ignoring the bot's own tier — used for the "Hint" button. */
export async function getHint(fen: string): Promise<{ from: string; to: string; promotion?: string } | null> {
  const engine = getEngine();
  const result = await engine.getMove(fen, { depth: 14 });
  return result.move ? uciToMove(result.move) : null;
}

function uciToMove(uci: string): { from: string; to: string; promotion?: string } {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
  };
}