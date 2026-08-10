"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

type Piece = { type: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn"; color: "white" | "black" };
type Square = Piece | null;

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_SIZE_PCT = 82; // must match the inline height/width % below

export function squareName(row: number, col: number) {
  return `${FILES[col]}${8 - row}`;
}

function squareToRowCol(sq: string) {
  return { row: 8 - parseInt(sq[1], 10), col: FILES.indexOf(sq[0]) };
}

function startingPosition(): Square[][] {
  const back: Piece["type"][] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  const board: Square[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: back[c], color: "black" };
    board[1][c] = { type: "pawn", color: "black" };
    board[6][c] = { type: "pawn", color: "white" };
    board[7][c] = { type: back[c], color: "white" };
  }
  return board;
}

function describeSquare(sq: string, piece: Square) {
  return piece ? `${sq}, ${piece.color} ${piece.type}` : `${sq}, empty`;
}

export default function Board({
  position = startingPosition(),
  maxSize = 560,
  selected,
  legalTargets = [],
  lastMove,
  checkSquare,
  onSquareClick,
}: {
  position?: Square[][];
  /** Max width/height in px — the board still shrinks to fit smaller screens. */
  maxSize?: number;
  selected?: string | null;
  legalTargets?: string[];
  lastMove?: { from: string; to: string } | null;
  checkSquare?: string | null;
  onSquareClick?: (square: string) => void;
}) {
  // FLIP-style slide: on a new lastMove, place the arriving piece back at its
  // origin offset (no transition), then clear the offset on the next frame
  // so the browser animates it sliding into place.
  const [slide, setSlide] = useState<{ sq: string; dx: number; dy: number } | null>(null);
  const animatedKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!lastMove) return;
    const key = `${lastMove.from}-${lastMove.to}`;
    if (animatedKeyRef.current === key) return;
    animatedKeyRef.current = key;

    const from = squareToRowCol(lastMove.from);
    const to = squareToRowCol(lastMove.to);
    const correction = 100 / PIECE_SIZE_PCT;
    const dx = (from.col - to.col) * correction;
    const dy = (from.row - to.row) * correction;

    setSlide({ sq: lastMove.to, dx, dy });
    const raf = requestAnimationFrame(() => {
      setSlide((cur) => (cur && cur.sq === lastMove.to ? { sq: lastMove.to, dx: 0, dy: 0 } : cur));
    });
    return () => cancelAnimationFrame(raf);
  }, [lastMove]);

  return (
    <div
      className="relative"
      style={{
        width: `min(${maxSize}px, 92vw)`,
        aspectRatio: "1 / 1",
        padding: "4.5%",
        borderRadius: 8,
        background: "linear-gradient(155deg, #241d17 0%, #17120e 55%, #1c1610 100%)",
        boxShadow:
          "0 24px 48px -16px rgba(0,0,0,0.65), 0 0 0 1px rgba(202,163,86,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "4.5%",
          margin: "1.5%",
          border: "1.5px solid #caa356",
          borderRadius: 3,
          boxShadow: "0 0 14px rgba(202,163,86,0.18)",
          pointerEvents: "none",
        }}
      />
      <div
        className="relative grid grid-cols-8 grid-rows-8 overflow-hidden"
        style={{ width: "100%", height: "100%", borderRadius: 2 }}
        role="grid"
        aria-label="Chess board"
      >
        {position.map((row, r) =>
          row.map((piece, c) => {
            const sq = squareName(r, c);
            const isDark = (r + c) % 2 === 1;
            const isLastRank = r === 7;
            const isSelected = selected === sq;
            const isTarget = legalTargets.includes(sq);
            const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isCheck = checkSquare === sq;
            const isSliding = slide?.sq === sq;
            const Tag = onSquareClick ? "button" : "div";

            return (
              <Tag
                key={sq}
                type={onSquareClick ? "button" : undefined}
                onClick={onSquareClick ? () => onSquareClick(sq) : undefined}
                role="gridcell"
                aria-label={describeSquare(sq, piece)}
                aria-selected={isSelected}
                className="dl-square relative flex items-center justify-center appearance-none border-0 p-0 m-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#caa356]"
                style={{
                  background: isDark ? "#332a22" : "#ecdfc4",
                  cursor: onSquareClick ? "pointer" : "default",
                  font: "inherit",
                }}
              >
                {isLastMove && (
                  <div className="absolute inset-0" style={{ background: "#caa356", opacity: 0.26 }} />
                )}
                {isCheck && (
                  <div
                    className="absolute inset-0 dl-check-pulse"
                    style={{
                      background: "radial-gradient(circle, rgba(214,69,69,0.8) 0%, rgba(214,69,69,0.15) 70%)",
                    }}
                  />
                )}
                {isSelected && (
                  <div
                    className="absolute inset-0"
                    style={{ boxShadow: "inset 0 0 0 3px #caa356, inset 0 0 18px rgba(202,163,86,0.35)" }}
                  />
                )}

                {isLastRank && (
                  <span
                    className="absolute bottom-[3px] right-[5px] text-[10px] font-semibold select-none leading-none"
                    style={{ color: isDark ? "#ecdfc4" : "#332a22", opacity: 0.75, zIndex: 2 }}
                  >
                    {FILES[c]}
                  </span>
                )}
                {c === 0 && (
                  <span
                    className="absolute top-[3px] left-[5px] text-[10px] font-semibold select-none leading-none"
                    style={{ color: isDark ? "#ecdfc4" : "#332a22", opacity: 0.75, zIndex: 2 }}
                  >
                    {8 - r}
                  </span>
                )}

                {piece && (
                  <div
                    className="relative"
                    style={{
                      height: `${PIECE_SIZE_PCT}%`,
                      width: `${PIECE_SIZE_PCT}%`,
                      zIndex: isSliding ? 20 : 1,
                      filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.4))",
                      transform: isSliding ? `translate(${slide!.dx}%, ${slide!.dy}%)` : undefined,
                      transition: isSliding && slide!.dx === 0 && slide!.dy === 0
                        ? "transform 220ms cubic-bezier(0.2,0.8,0.2,1)"
                        : undefined,
                      willChange: isSliding ? "transform" : undefined,
                    }}
                  >
                    <Image
                      src={`/pieces/${piece.color}_${piece.type}.png`}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 10vw, 70px"
                      style={{ objectFit: "contain", userSelect: "none" }}
                      draggable={false}
                    />
                  </div>
                )}

                {isTarget && !piece && (
                  <div
                    className="absolute rounded-full dl-target-dot"
                    style={{ width: "26%", height: "26%", background: "#caa356", zIndex: 1 }}
                  />
                )}
                {isTarget && piece && (
                  <div
                    className="absolute inset-0"
                    style={{ boxShadow: "inset 0 0 0 4px rgba(202,163,86,0.8)", zIndex: 2 }}
                  />
                )}
              </Tag>
            );
          })
        )}
      </div>

      <style>{`
        .dl-square { transition: filter 120ms ease; }
        .dl-square:hover { filter: brightness(1.12); }
        @keyframes dlTargetPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.12); }
        }
        .dl-target-dot { animation: dlTargetPulse 1.8s ease-in-out infinite; }
        @keyframes dlCheckPulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }
        .dl-check-pulse { animation: dlCheckPulse 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
