import Link from "next/link";
import GameBoard from "../components/GameBoard";

export default function Home() {
  return (
    <div className="dl-page min-h-screen flex flex-col items-center">
      <style>{`
        .dl-page {
          background:
            radial-gradient(ellipse 700px 420px at 50% -8%, rgba(202,163,86,0.10), transparent 65%),
            radial-gradient(ellipse 600px 500px at 100% 100%, rgba(202,163,86,0.05), transparent 60%),
            radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 22px 22px,
            #0d1114;
          color: #EDEAE1;
        }
        .dl-nav-link {
          font-size: 12px; color: #8f887c; text-decoration: none; transition: color 150ms;
          padding: 6px 12px; border-radius: 100px;
        }
        .dl-nav-link:hover { color: #EDEAE1; background: rgba(255,255,255,0.04); }
        .dl-badge {
          font-size: 11px; color: #a49a86; padding: 4px 11px; border-radius: 100px;
          border: 1px solid rgba(202,163,86,0.18); background: rgba(202,163,86,0.04);
        }
      `}</style>

      <nav
        className="w-full flex items-center justify-between px-6 sm:px-10 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(155deg, #dab766, #a9803f)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1c1712">
              <path d="M12 2l1.8 3.6L18 6l-3 3.2.7 4.3L12 11.5 8.3 13.5 9 9.2 6 6l4.2-.4L12 2z" />
              <rect x="7" y="16" width="10" height="2.5" rx="1" />
              <rect x="6" y="19.5" width="12" height="2.5" rx="1" />
            </svg>
          </div>
          <span className="font-serif text-lg tracking-wide" style={{ color: "#f1e9d8" }}>
            Chess Tourney
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/tournament" className="dl-nav-link">
            Tournaments
          </Link>
          <Link href="/pieces" className="dl-nav-link">
            Piece set
          </Link>
        </div>
      </nav>

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div className="w-full" style={{ maxWidth: 560 }}>
          <h1 className="font-serif text-[28px] sm:text-[32px] tracking-wide mb-3" style={{ color: "#f1e9d8" }}>
            Play a game
          </h1>
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <span className="dl-badge">Pass-and-play</span>
            <span className="dl-badge">Full rules via chess.js</span>
            <span className="dl-badge">Live Stockfish eval</span>
            <span className="dl-badge">Elo rated</span>
          </div>
        </div>

        <div
          className="w-full rounded-2xl p-5 sm:p-8 flex flex-col items-center"
          style={{
            maxWidth: 640,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
            border: "1px solid rgba(202,163,86,0.14)",
            boxShadow: "0 30px 60px -30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <GameBoard whiteLabel="Player 1" blackLabel="Player 2" />
        </div>
      </div>
    </div>
  );
}