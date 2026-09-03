"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Board from "@/components/Board";
import AvatarIcon from "@/components/AvatarIcon";
import { getLiveGame, moveNumberFromFen, type LiveGame } from "@/lib/games";
import { fenToPosition, checkSquareFromFen } from "@/lib/fenToPosition";

const POLL_MS = 2000;

export default function SpectateGamePage() {
  const params = useParams<{ id: string }>();
  const [game, setGame] = useState<LiveGame | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    function poll() {
      getLiveGame(params.id).then((g) => {
        if (!cancelled) setGame(g);
      });
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.id]);

  if (game === undefined) return null;

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: "#8f8a9c" }}>
            This game isn&apos;t live anymore, or never existed.
          </p>
          <Link href="/watch" className="text-sm hover:underline" style={{ color: "var(--cx-accent)" }}>
            ← Back to Watch
          </Link>
        </div>
      </div>
    );
  }

  const position = fenToPosition(game.fen);
  const checkSquare = checkSquareFromFen(game.fen);

  let statusText = `Move ${moveNumberFromFen(game.fen)}`;
  if (game.status === "finished") {
    statusText =
      game.result === "draw"
        ? "Game over — draw"
        : `Game over — ${game.result === "white" ? game.whiteName : game.blackName} wins`;
  }

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />

      <div className="flex flex-col items-center p-6 sm:p-10">
        <div className="w-full flex items-center justify-between mb-6" style={{ maxWidth: 560 }}>
          <div className="flex items-center gap-2">
            <AvatarIcon avatarId={game.whiteAvatarId} size={28} />
            <span className="text-sm font-medium">{game.whiteName}</span>
          </div>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              color: game.status === "active" ? "#F43F5E" : "#8f8a9c",
              background: game.status === "active" ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.05)",
            }}
          >
            {game.status === "active" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: "#F43F5E" }} />
            )}
            {statusText}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{game.blackName}</span>
            <AvatarIcon avatarId={game.blackAvatarId} size={28} />
          </div>
        </div>

        <div
          className="rounded-2xl p-5 sm:p-8"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
            border: "1px solid color-mix(in srgb, var(--cx-accent) 14%, transparent)",
          }}
        >
          <Board position={position} checkSquare={checkSquare} />
        </div>

        <p className="text-xs mt-6" style={{ color: "#5c5968" }}>
          Spectating — updates roughly every {POLL_MS / 1000}s.
        </p>
      </div>
    </div>
  );
}
