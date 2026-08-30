"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import LiveGameCard from "@/components/LiveGameCard";
import { listLiveGames, type LiveGame } from "@/lib/games";

export default function WatchPage() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLiveGames().then((g) => {
      setGames(g);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />

      <div className="px-6 sm:px-10 py-10 max-w-7xl mx-auto">
        <h1 className="font-serif font-semibold text-[26px] sm:text-[30px] tracking-tight mb-2">Watch</h1>
        <p className="text-sm mb-8" style={{ color: "#8f8a9c" }}>
          Every game being played right now, open to anyone — no account needed to spectate.
        </p>

        {loading ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
            <p className="text-sm" style={{ color: "#8f8a9c" }}>Loading…</p>
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
            <p className="text-sm mb-4" style={{ color: "#8f8a9c" }}>
              No games are being played right now. Once someone starts one, it shows up here automatically —
              anyone with this page open will see it.
            </p>
            <Link
              href="/play"
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: "var(--cx-accent)", color: "#0b0b0f" }}
            >
              Start a game
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((g) => (
              <LiveGameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
