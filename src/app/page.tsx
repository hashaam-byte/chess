import Link from "next/link";
import GameBoard from "@/components/GameBoard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#12181B] text-[#EDEAE1] p-6 sm:p-10 flex flex-col items-center">
      <div className="w-full flex items-center justify-between" style={{ maxWidth: 560 }}>
        <h1 className="font-serif text-2xl tracking-wide">Chess Tourney</h1>
        <Link href="/pieces" className="text-xs text-[#A9A499] hover:text-[#EDEAE1]">
          Piece set →
        </Link>
      </div>
      <p className="text-sm text-[#A9A499] mb-8 self-start" style={{ maxWidth: 560 }}>
        Local pass-and-play — full rules via chess.js: check, checkmate, stalemate, castling, en passant, promotion.
      </p>
      <GameBoard whiteLabel="Player 1" blackLabel="Player 2" />
    </div>
  );
}
