import Image from "next/image";

type Piece = { type: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn"; color: "white" | "black" };
type Square = Piece | null;

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function squareName(row: number, col: number) {
  return `${FILES[col]}${8 - row}`;
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
  return (
    <div
      className="relative"
      style={{
        width: `min(${maxSize}px, 92vw)`,
        aspectRatio: "1 / 1",
        padding: "4.5%",
        background: "#272727",
        borderRadius: 6,
        boxShadow: "0 20px 40px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "4.5%",
          margin: "1.5%",
          border: "1.5px solid #C9A24B",
          borderRadius: 2,
          pointerEvents: "none",
        }}
      />
      <div
        className="relative grid grid-cols-8 grid-rows-8"
        style={{ width: "100%", height: "100%" }}
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
            const Tag = onSquareClick ? "button" : "div";

            return (
              <Tag
                key={sq}
                type={onSquareClick ? "button" : undefined}
                onClick={onSquareClick ? () => onSquareClick(sq) : undefined}
                role="gridcell"
                aria-label={describeSquare(sq, piece)}
                aria-selected={isSelected}
                className="relative flex items-center justify-center appearance-none border-0 p-0 m-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#C9A24B]"
                style={{
                  background: isDark ? "#323233" : "#E8D4BC",
                  cursor: onSquareClick ? "pointer" : "default",
                  font: "inherit",
                }}
              >
                {isLastMove && (
                  <div className="absolute inset-0" style={{ background: "#C9A24B", opacity: 0.28 }} />
                )}
                {isCheck && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "radial-gradient(circle, rgba(214,69,69,0.75) 0%, rgba(214,69,69,0.15) 70%)",
                    }}
                  />
                )}
                {isSelected && <div className="absolute inset-0" style={{ background: "#C9A24B", opacity: 0.45 }} />}

                {isLastRank && (
                  <span
                    className="absolute bottom-[3px] right-[5px] text-[10px] font-semibold select-none leading-none"
                    style={{ color: isDark ? "#E8D4BC" : "#323233", opacity: 0.85, zIndex: 2 }}
                  >
                    {FILES[c]}
                  </span>
                )}
                {c === 0 && (
                  <span
                    className="absolute top-[3px] left-[5px] text-[10px] font-semibold select-none leading-none"
                    style={{ color: isDark ? "#E8D4BC" : "#323233", opacity: 0.85, zIndex: 2 }}
                  >
                    {8 - r}
                  </span>
                )}

                {piece && (
                  <div
                    className="relative"
                    style={{
                      height: "82%",
                      width: "82%",
                      zIndex: 1,
                      filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.35))",
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
                    className="absolute rounded-full"
                    style={{ width: "28%", height: "28%", background: "#C9A24B", opacity: 0.55, zIndex: 1 }}
                  />
                )}
                {isTarget && piece && (
                  <div
                    className="absolute inset-0 rounded-none"
                    style={{ boxShadow: "inset 0 0 0 4px rgba(201,162,75,0.75)", zIndex: 2 }}
                  />
                )}
              </Tag>
            );
          })
        )}
      </div>
    </div>
  );
}
