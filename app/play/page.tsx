import SiteNav from "../../components/SiteNav";
import GameBoard from "../../components/GameBoard";

export default function PlayPage() {
  return (
    <div className="dl-page min-h-screen flex flex-col items-center">
      <style>{`
        .dl-page {
          background:
            radial-gradient(ellipse 700px 420px at 50% -8%, color-mix(in srgb, var(--cx-accent) 10%, transparent), transparent 65%),
            radial-gradient(ellipse 600px 500px at 100% 100%, color-mix(in srgb, var(--cx-accent) 5%, transparent), transparent 60%),
            radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px) 0 0 / 22px 22px,
            #07070A;
          color: #F5F3F7;
        }
        .dl-badge {
          font-size: 11px; color: #8f8a9c; padding: 4px 11px; border-radius: 100px;
          border: 1px solid color-mix(in srgb, var(--cx-accent) 18%, transparent);
          background: color-mix(in srgb, var(--cx-accent) 4%, transparent);
        }
      `}</style>

      <SiteNav />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div className="w-full" style={{ maxWidth: 560 }}>
          <h1 className="font-serif font-semibold text-[26px] sm:text-[30px] tracking-tight mb-3" style={{ color: "#F5F3F7" }}>
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
            border: "1px solid color-mix(in srgb, var(--cx-accent) 14%, transparent)",
            boxShadow: "0 30px 60px -30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <GameBoard whiteLabel="Player 1" blackLabel="Player 2" />
        </div>
      </div>
    </div>
  );
}
