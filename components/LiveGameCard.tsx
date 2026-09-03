import Link from "next/link";
import AvatarIcon from "./AvatarIcon";
import { moveNumberFromFen, type LiveGame } from "@/lib/games";

export default function LiveGameCard({ game }: { game: LiveGame }) {
  return (
    <Link
      href={`/watch/${game.id}`}
      className="cx-card rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: "#111116", border: "1px solid #23232c" }}
    >
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
    </Link>
  );
}
