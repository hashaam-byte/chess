import Link from "next/link";
import GameBoard from "@/components/GameBoard";

export default function Home() {
  return (
    <div className="dl-page min-h-screen flex flex-col items-center p-6 sm:p-10">
      <style>{`
        .dl-page {
          background:
            radial-gradient(ellipse 700px 420px at 50% -8%, rgba(202,163,86,0.10), transparent 65%),
            radial-gradient(ellipse 600px 500px at 100% 100%, rgba(202,163,86,0.05), transparent 60%),
            #0d1114;
          color: #EDEAE1;
        }
      `}</style>

      <div className="w-full flex items-center justify-between" style={{ maxWidth: 560 }}>
        <h1 className="font-serif text-2xl sm:text-[28px] tracking-wide" style={{ color: "#f1e9d8" }}>
          Chess Tourney
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/tournament" className="text-xs text-[#8f887c] hover:text-[#EDEAE1] transition-colors">
            Tournaments →
          </Link>
          <Link href="/pieces" className="text-xs text-[#8f887c] hover:text-[#EDEAE1] transition-colors">
            Piece set →
          </Link>
        </div>
      </div>
      <p className="text-sm text-[#8f887c] mb-8 self-start" style={{ maxWidth: 560 }}>
        Local pass-and-play — full rules via chess.js: check, checkmate, stalemate, castling, en passant, promotion.
      </p>

      <div
        className="w-full rounded-2xl p-5 sm:p-7 flex flex-col items-center"
        style={{
          maxWidth: 640,
          background: "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
          border: "1px solid rgba(202,163,86,0.12)",
          boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
        }}
      >
        <GameBoard whiteLabel="Player 1" blackLabel="Player 2" />
      </div>
    </div>
  );
}
