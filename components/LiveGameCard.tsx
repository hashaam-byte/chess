import Link from "next/link";
import Image from "next/image";
import AvatarIcon from "./AvatarIcon";
import { fenToPosition } from "@/lib/fenToPosition";
import { moveNumberFromFen, type LiveGame } from "@/lib/games";

export default function LiveGameCard({ game }: { game: LiveGame }) {
  return (
    <Link
      href={`/watch/${game.id}`}
      className="cx-card group relative block rounded-2xl h-[210px]"
      style={{ background: "#111116", border: "1px solid #23232c" }}
    >
      {/* Front: original layout, unchanged */}
      <div className="absolute inset-0 p-5 flex flex-col gap-4 transition-opacity duration-300 group-hover:opacity-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full cx-live-dot" style={{ background: "#F43F5E" }} />
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: "#F43F5E" }}>
            LIVE
          </span>
        </span>

        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <AvatarIcon avatarId={game.whiteAvatarId} size={40} />
            <span className="text-xs font-medium truncate max-w-[80px]">{game.whiteName}</span>
          </div>
          <span className="text-xs font-semibold" style={{ color: "#5c5968" }}>
            vs
          </span>
          <div className="flex flex-col items-center gap-1.5">
            <AvatarIcon avatarId={game.blackAvatarId} size={40} />
            <span className="text-xs font-medium truncate max-w-[80px]">{game.blackName}</span>
          </div>
        </div>

        <div className="text-center text-[11px]" style={{ color: "#5c5968" }}>
          Move {moveNumberFromFen(game.fen)}
        </div>
      </div>

      {/* Back: the hover reveal you liked — a real mini board from this game's live FEN */}
      <div
        className="absolute inset-0 p-3 flex items-center justify-center opacity-0 scale-[1.03] transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 pointer-events-none"
        style={{ background: "rgba(17,17,22,0.92)" }}
      >
        <MiniBoard fen={game.fen} />
      </div>
    </Link>
  );
}

/** Small static board render for the hover preview — not the interactive Board component. */
function MiniBoard({ fen }: { fen: string }) {
  const rows = fenToPosition(fen);
  return (
    <div className="grid grid-cols-8 w-[164px] h-[164px] rounded-md overflow-hidden" style={{ boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)" }}>
      {rows.map((row, r) =>
        row.map((cell, c) => {
          const light = (r + c) % 2 === 0;
          return (
            <div key={`${r}-${c}`} className="relative" style={{ background: light ? "var(--cx-sq-light, #2a2a33)" : "var(--cx-sq-dark, #17171c)" }}>
              {cell && (
                <Image
                  src={`/pieces/${cell.color}_${cell.type}.png`}
                  alt=""
                  fill
                  sizes="20px"
                  style={{ objectFit: "contain", padding: "2px" }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}