import { Chess } from "chess.js";

type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
type Piece = { type: PieceType; color: "white" | "black" };
type Square = Piece | null;

const TYPE_MAP: Record<string, PieceType> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};

/** Read-only conversion for spectator views — no game-state mutation, just a snapshot. */
export function fenToPosition(fen: string): Square[][] {
  const chess = new Chess(fen);
  return chess.board().map((row) =>
    row.map((cell): Square =>
      cell ? { type: TYPE_MAP[cell.type], color: cell.color === "w" ? "white" : "black" } : null
    )
  );
}

/** Returns the square of the king currently in check, or null. For spectator highlighting. */
export function checkSquareFromFen(fen: string): string | null {
  const chess = new Chess(fen);
  if (!chess.inCheck()) return null;
  const king = chess.board().flat().find((c) => c && c.type === "k" && c.color === chess.turn());
  return king?.square ?? null;
}
