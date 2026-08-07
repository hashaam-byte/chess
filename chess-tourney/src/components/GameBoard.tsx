"use client";

import { useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board, { squareName } from "./Board";

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

function toBoardPosition(chess: Chess) {
  return chess.board().map((row) =>
    row.map((cell) =>
      cell ? { type: TYPE_MAP[cell.type], color: cell.color === "w" ? "white" as const : "black" as const } : null
    )
  );
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
  const chessRef = useRef(new Chess());
  const [, bump] = useState(0);
  const rerender = () => bump((v) => v + 1);

  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [resolved, setResolved] = useState(false);

  const chess = chessRef.current;
  const position = useMemo(() => toBoardPosition(chess), [chess, lastMove, selected, promo]);

  const turn = chess.turn() === "w" ? "white" : "black";
  const inCheck = chess.inCheck();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isDraw = chess.isDraw();
  const gameOver = isCheckmate || isStalemate || isDraw;

  let checkSquare: string | null = null;
  if (inCheck) {
    const kingCell = chess.board().flat().find((c) => c && c.type === "k" && c.color === chess.turn());
    if (kingCell) checkSquare = kingCell.square;
  }

  const legalTargets = selected
    ? chess.moves({ square: selected as any, verbose: true }).map((m: any) => m.to)
    : [];

  function commitResult() {
    if (resolved) return;
    setResolved(true);
    if (isCheckmate) onResult?.(turn === "white" ? "black" : "white");
    else if (isStalemate || isDraw) onResult?.("draw");
  }

  function handleSquareClick(sq: string) {
    if (gameOver || promo) return;

    if (selected) {
      if (legalTargets.includes(sq)) {
        const moves = chess.moves({ square: selected as any, verbose: true }) as any[];
        const mv = moves.find((m) => m.to === sq);
        const isPromotion = mv?.flags?.includes("p");
        if (isPromotion) {
          setPromo({ from: selected, to: sq });
          setSelected(null);
          return;
        }
        chess.move({ from: selected, to: sq });
        setLastMove({ from: selected, to: sq });
        setSelected(null);
        rerender();
        return;
      }
      const piece = chess.get(sq as any);
      if (piece && piece.color === chess.turn()) {
        setSelected(sq);
      } else {
        setSelected(null);
      }
      return;
    }

    const piece = chess.get(sq as any);
    if (piece && piece.color === chess.turn()) {
      setSelected(sq);
    }
  }

  function choosePromotion(flag: "q" | "r" | "b" | "n") {
    if (!promo) return;
    chess.move({ from: promo.from, to: promo.to, promotion: flag });
    setLastMove({ from: promo.from, to: promo.to });
    setPromo(null);
    rerender();
  }

  function resetGame() {
    chessRef.current = new Chess();
    setSelected(null);
    setLastMove(null);
    setPromo(null);
    setResolved(false);
    rerender();
  }

  let statusText = `${turn === "white" ? whiteLabel : blackLabel} to move`;
  if (isCheckmate) statusText = `Checkmate — ${turn === "white" ? blackLabel : whiteLabel} wins`;
  else if (isStalemate) statusText = "Stalemate — draw";
  else if (isDraw) statusText = "Draw";
  else if (inCheck) statusText = `${turn === "white" ? whiteLabel : blackLabel} is in check`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[560px] text-sm">
        <span className={turn === "white" && !gameOver ? "text-[#C9A24B]" : "text-[#A9A499]"}>{whiteLabel}</span>
        <span className={gameOver ? "text-[#C9A24B]" : inCheck ? "text-[#D64545]" : "text-[#A9A499]"}>
          {statusText}
        </span>
        <span className={turn === "black" && !gameOver ? "text-[#C9A24B]" : "text-[#A9A499]"}>{blackLabel}</span>
      </div>

      <div className="relative">
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
                  className="w-16 h-16 flex items-center justify-center bg-[#272727] rounded hover:bg-[#333] border border-[#3A423F]"
                >
                  <img
                    src={`/pieces/${chess.turn() === "w" ? "white" : "black"}_${type}.png`}
                    alt={type}
                    className="h-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {gameOver && (
        <button
          onClick={() => {
            commitResult();
          }}
          className="px-4 py-1.5 rounded bg-[#C9A24B] text-[#12181B] text-sm font-medium"
        >
          {resolved ? "Result recorded" : "Confirm result"}
        </button>
      )}

      <button onClick={resetGame} className="text-xs text-[#A9A499] hover:text-[#EDEAE1]">
        Reset board
      </button>
    </div>
  );
}
