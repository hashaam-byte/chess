"use client";

import { useState } from "react";
import { Chess, type Square } from "chess.js";
import Image from "next/image";
import Board from "./Board";

type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
const TYPE_MAP: Record<string, PieceType> = {
  k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn",
};
const PROMO_ORDER: { flag: "q" | "r" | "b" | "n"; type: PieceType }[] = [
  { flag: "q", type: "queen" },
  { flag: "r", type: "rook" },
  { flag: "b", type: "bishop" },
  { flag: "n", type: "knight" },
];

type MoveEnd = { from: Square; to: Square };

function toBoardPosition(chess: Chess) {
  return chess.board().map((row) =>
    row.map((cell) =>
      cell ? { type: TYPE_MAP[cell.type], color: cell.color === "w" ? ("white" as const) : ("black" as const) } : null
    )
  );
}

// Groups a flat SAN move list into numbered pairs for display, e.g. "1. e4 e5".
function pairMoves(history: string[]) {
  const pairs: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: history[i], black: history[i + 1] });
  }
  return pairs;
}

export default function GameBoard({
  whiteLabel = "White",
  blackLabel = "Black",
  onResult,
}: {
  whiteLabel?: string;
  blackLabel?: string;
  onResult?: (winner: "white" | "black" | "draw") => void;
}) {
  // The Chess instance is mutable and mutated in place inside event handlers;
  // `version` is bumped alongside it purely to force a re-render. It's kept in
  // useState (not useRef) so nothing reads a ref's `.current` during render.
  const [chess, setChess] = useState(() => new Chess());
  const [version, setVersion] = useState(0);
  const touch = () => setVersion((v) => v + 1);

  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<MoveEnd | null>(null);
  const [promo, setPromo] = useState<MoveEnd | null>(null);
  const [resolved, setResolved] = useState(false);
  const [resigned, setResigned] = useState<"white" | "black" | null>(null);

  // `version` isn't read here, but the Chess instance mutates in place —
  // this recompute has to re-run on every state change that touches it,
  // and an 8x8 array build is cheap enough not to bother memoizing.
  void version;
  const position = toBoardPosition(chess);
  const history = chess.history();

  const turn = chess.turn() === "w" ? "white" : "black";
  const inCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();
  const gameOver = isCheckmate || isStalemate || isDraw || resigned !== null;

  let checkSquare: string | null = null;
  if (inCheck) {
    const kingCell = chess.board().flat().find((c) => c && c.type === "k" && c.color === chess.turn());
    if (kingCell) checkSquare = kingCell.square;
  }

  const legalMoves = selected ? chess.moves({ square: selected, verbose: true }) : [];
  const legalTargets = legalMoves.map((m) => m.to);

  function commitResult() {
    if (resolved) return;
    setResolved(true);
    if (resigned) onResult?.(resigned === "white" ? "black" : "white");
    else if (isCheckmate) onResult?.(turn === "white" ? "black" : "white");
    else if (isStalemate || isDraw) onResult?.("draw");
  }

  function handleSquareClick(sqStr: string) {
    if (gameOver || promo) return;
    const sq = sqStr as Square;

    if (selected) {
      if (legalTargets.includes(sq)) {
        const mv = legalMoves.find((m) => m.to === sq);
        if (mv?.isPromotion()) {
          setPromo({ from: selected, to: sq });
          setSelected(null);
          return;
        }
        chess.move({ from: selected, to: sq });
        setLastMove({ from: selected, to: sq });
        setSelected(null);
        touch();
        return;
      }
      const piece = chess.get(sq);
      setSelected(piece && piece.color === chess.turn() ? sq : null);
      return;
    }

    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn()) {
      setSelected(sq);
    }
  }

  function choosePromotion(flag: "q" | "r" | "b" | "n") {
    if (!promo) return;
    chess.move({ from: promo.from, to: promo.to, promotion: flag });
    setLastMove({ from: promo.from, to: promo.to });
    setPromo(null);
    touch();
  }

  function undoMove() {
    if (gameOver || promo) return;
    chess.undo();
    const hist = chess.history({ verbose: true });
    const prev = hist[hist.length - 1];
    setLastMove(prev ? { from: prev.from, to: prev.to } : null);
    setSelected(null);
    touch();
  }

  function resign(color: "white" | "black") {
    if (gameOver) return;
    setResigned(color);
    touch();
  }

  function resetGame() {
    setChess(new Chess());
    setSelected(null);
    setLastMove(null);
    setPromo(null);
    setResolved(false);
    setResigned(null);
  }

  let statusText = `${turn === "white" ? whiteLabel : blackLabel} to move`;
  if (resigned) statusText = `${resigned === "white" ? whiteLabel : blackLabel} resigned — ${resigned === "white" ? blackLabel : whiteLabel} wins`;
  else if (isCheckmate) statusText = `Checkmate — ${turn === "white" ? blackLabel : whiteLabel} wins`;
  else if (isStalemate) statusText = "Stalemate — draw";
  else if (isDraw) statusText = "Draw";
  else if (inCheck) statusText = `${turn === "white" ? whiteLabel : blackLabel} is in check`;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center justify-between w-full" style={{ maxWidth: 560 }}>
        <span className={turn === "white" && !gameOver ? "text-[#C9A24B]" : "text-[#A9A499]"}>{whiteLabel}</span>
        <span
          className={gameOver ? "text-[#C9A24B]" : inCheck ? "text-[#D64545]" : "text-[#A9A499]"}
          role="status"
          aria-live="polite"
        >
          {statusText}
        </span>
        <span className={turn === "black" && !gameOver ? "text-[#C9A24B]" : "text-[#A9A499]"}>{blackLabel}</span>
      </div>

      <div className="relative flex justify-center w-full">
        <Board
          position={position}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          onSquareClick={handleSquareClick}
        />

        {promo && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(18,24,27,0.75)" }}
          >
            <div className="bg-[#1A2124] border border-[#3A423F] rounded p-4 flex gap-3">
              {PROMO_ORDER.map(({ flag, type }) => (
                <button
                  key={flag}
                  onClick={() => choosePromotion(flag)}
                  aria-label={`Promote to ${type}`}
                  className="relative w-16 h-16 flex items-center justify-center bg-[#272727] rounded hover:bg-[#333] border border-[#3A423F]"
                >
                  <Image
                    src={`/pieces/${chess.turn() === "w" ? "white" : "black"}_${type}.png`}
                    alt=""
                    fill
                    sizes="64px"
                    style={{ objectFit: "contain" }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Move list */}
      {history.length > 0 && (
        <div
          className="w-full text-xs text-[#A9A499] overflow-y-auto border border-[#3A423F] rounded"
          style={{ maxWidth: 560, maxHeight: 120 }}
        >
          <table className="w-full">
            <tbody>
              {pairMoves(history).map(({ n, white, black }) => (
                <tr key={n} className="odd:bg-[#181d20]">
                  <td className="px-2 py-1 w-8 text-[#5c6a63]">{n}.</td>
                  <td className="px-2 py-1">{white}</td>
                  <td className="px-2 py-1">{black ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap justify-center">
        {gameOver ? (
          <button
            onClick={commitResult}
            className="px-4 py-1.5 rounded bg-[#C9A24B] text-[#12181B] text-sm font-medium"
          >
            {resolved ? "Result recorded" : "Confirm result"}
          </button>
        ) : (
          <>
            <button
              onClick={undoMove}
              disabled={history.length === 0}
              className="text-xs text-[#A9A499] hover:text-[#EDEAE1] disabled:opacity-40 disabled:hover:text-[#A9A499]"
            >
              Undo move
            </button>
            <button
              onClick={() => resign(turn)}
              className="text-xs text-[#D64545] hover:text-[#f08080]"
            >
              {turn === "white" ? whiteLabel : blackLabel} resigns
            </button>
          </>
        )}
        <button onClick={resetGame} className="text-xs text-[#A9A499] hover:text-[#EDEAE1]">
          Reset board
        </button>
      </div>
    </div>
  );
}
