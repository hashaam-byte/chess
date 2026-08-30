import Link from "next/link";
import AvatarIcon from "./AvatarIcon";
import type { LiveGame } from "@/lib/games";

export default function LiveGameCard({ game }: { game: LiveGame }) {
  return (
    <Link
      href={`/watch/${game.id}`}
      className="cx-card rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#111116", border: "1px solid #23232c" }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full cx-live-dot" style={{ background: "#F43F5E" }} />
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: "#F43F5E" }}>
            LIVE
          </span>
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: "#8f8a9c" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {game.spectatorCount}
        </span>
      </div>

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
        Move {game.moveCount}
      </div>
    </Link>
  );
}
