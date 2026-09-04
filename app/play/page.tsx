"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
import { getProfile } from "@/lib/profile";
import { createLiveGame } from "@/lib/games";
import { claimSeat } from "@/lib/localIdentity";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function PlayPage() {
  const router = useRouter();
  const [fallbackLocal, setFallbackLocal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const profile = getProfile();

    createLiveGame({ name: profile?.name || "Player 1", avatarId: profile?.avatarId ?? "violet-king" }, START_FEN).then(
      (id) => {
        if (cancelled) return;
        if (id) {
          claimSeat(id, "white");
          router.replace(`/play/${id}`);
        } else {
          // No Supabase project connected — fall back to old-style local
          // pass-and-play so the page still does something useful.
          setFallbackLocal(true);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!fallbackLocal) {
    return (
      <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <SiteNav />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "#8f8a9c" }}>Setting up your game…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <p className="text-xs mb-6 text-center max-w-sm" style={{ color: "#5c5968" }}>
          No Supabase project connected, so this is local pass-and-play only — see .env.local.example to enable
          real multiplayer and Watch.
        </p>
        <div
          className="w-full rounded-2xl p-5 sm:p-8 flex flex-col items-center"
          style={{ maxWidth: 640, background: "rgba(255,255,255,0.02)", border: "1px solid #23232c" }}
        >
          <GameBoard whiteLabel={getProfile()?.name || "Player 1"} blackLabel="Player 2" />
        </div>
      </div>
    </div>
  );
}
