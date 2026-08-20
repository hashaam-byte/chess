"use client";

import { useState } from "react";
import SiteNav from "../../components/SiteNav";
import { listPlayers, type Player } from "../../lib/players";

export default function RankingsPage() {
  const [players] = useState<Player[]>(() => listPlayers());

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div className="w-full" style={{ maxWidth: 640 }}>
          <h1 className="font-serif font-semibold text-[26px] sm:text-[30px] tracking-tight mb-2">Rankings</h1>
          <p className="text-sm mb-8" style={{ color: "#8f8a9c" }}>
            Elo ratings from games played and recorded on this device.
          </p>

          {players.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "#111116", border: "1px solid #23232c" }}
            >
              <p className="text-sm" style={{ color: "#8f8a9c" }}>
                No rated games yet. Ratings appear here once tournament matches are played.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111116", border: "1px solid #23232c" }}>
              {players.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i === players.length - 1 ? "none" : "1px solid #1a1a1f" }}
                >
                  <span
                    className="w-6 text-sm font-semibold tabular-nums"
                    style={{ color: i < 3 ? "var(--cx-accent-light)" : "#5c5968" }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{ background: "linear-gradient(155deg, var(--cx-accent-light), var(--cx-accent-dark))", color: "#111116" }}
                  >
                    {p.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px]" style={{ color: "#5c5968" }}>
                      {p.games} game{p.games === 1 ? "" : "s"} · {p.wins}W {p.losses}L {p.draws}D
                    </div>
                  </div>
                  <span className="text-base font-semibold tabular-nums" style={{ color: "var(--cx-accent-light)" }}>
                    {p.rating}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
