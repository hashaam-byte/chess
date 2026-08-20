"use client";

import { useState } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import { listTournaments } from "../lib/tournamentStore";
import { isComplete, type Tournament } from "../lib/tournament";
import { listPlayers, type Player } from "../lib/players";

function tournamentStatus(t: Tournament): "live" | "upcoming" | "completed" {
  if (isComplete(t)) return "completed";
  const started = t.rounds.some((round) => round.some((m) => m.winner !== null));
  return started ? "live" : "upcoming";
}

export default function Home() {
  const [tournaments] = useState<Tournament[]>(() => listTournaments());
  const [players] = useState<Player[]>(() => listPlayers());

  const liveTournament = tournaments.find((t) => tournamentStatus(t) === "live");
  const featured = liveTournament ?? tournaments[0];

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <style>{`
        @keyframes cxFloat { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-14px) rotate(1deg); } }
        @keyframes cxPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .cx-king { animation: cxFloat 7s ease-in-out infinite; }
        .cx-live-dot { animation: cxPulse 1.4s ease-in-out infinite; }
        .cx-hero-bg {
          background:
            radial-gradient(ellipse 900px 560px at 18% 0%, color-mix(in srgb, var(--cx-accent) 16%, transparent), transparent 65%),
            radial-gradient(ellipse 700px 500px at 100% 30%, color-mix(in srgb, var(--cx-accent-light) 10%, transparent), transparent 60%),
            radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px) 0 0 / 24px 24px,
            #07070A;
        }
        .cx-card { background: #111116; border: 1px solid #23232c; transition: border-color 200ms, transform 200ms; }
        .cx-card:hover { border-color: color-mix(in srgb, var(--cx-accent) 40%, transparent); transform: translateY(-2px); }
      `}</style>

      <div className="cx-hero-bg">
        <SiteNav />

        {/* Hero */}
        <section className="px-6 sm:px-10 pt-10 pb-16 grid gap-10 lg:grid-cols-2 items-center max-w-7xl mx-auto">
          <div>
            <h1
              className="font-serif font-bold tracking-tight leading-[0.95]"
              style={{ fontSize: "clamp(2.6rem, 6vw, 4.2rem)" }}
            >
              THE NEXT MOVE
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                IS YOURS.
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg" style={{ color: "#8f8a9c" }}>
              Play. Watch. Compete.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/play"
                className="px-6 py-3 rounded-full text-sm font-semibold transition hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))",
                  color: "#0b0b0f",
                  boxShadow: "0 12px 32px -10px color-mix(in srgb, var(--cx-accent) 60%, transparent)",
                }}
              >
                ▶ Play Now
              </Link>
              <Link
                href="/tournament"
                className="px-6 py-3 rounded-full text-sm font-semibold transition"
                style={{ border: "1px solid #2a2a33", color: "#F5F3F7" }}
              >
                Explore Tournaments
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Decorative king mark — swap for a rendered 3D piece via the image prompt in the handoff notes */}
            <svg
              className="cx-king"
              width="220"
              height="220"
              viewBox="0 0 100 100"
              style={{ filter: "drop-shadow(0 30px 60px color-mix(in srgb, var(--cx-accent) 45%, transparent))" }}
            >
              <defs>
                <linearGradient id="kingGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--cx-accent-light)" />
                  <stop offset="100%" stopColor="var(--cx-accent-dark)" />
                </linearGradient>
              </defs>
              <path
                d="M50 8 L54 16 L62 18 L55 24 L57 32 L50 28 L43 32 L45 24 L38 18 L46 16 Z"
                fill="url(#kingGrad)"
              />
              <rect x="47" y="30" width="6" height="8" fill="url(#kingGrad)" />
              <path
                d="M30 42 C30 34 38 30 50 30 C62 30 70 34 70 42 L66 78 C66 82 62 86 57 86 L43 86 C38 86 34 82 34 78 Z"
                fill="url(#kingGrad)"
                opacity="0.92"
              />
              <rect x="24" y="86" width="52" height="7" rx="2" fill="url(#kingGrad)" />
            </svg>

            <div
              className="absolute -bottom-4 right-0 sm:right-4 rounded-2xl p-4 w-56"
              style={{ background: "rgba(17,17,22,0.85)", backdropFilter: "blur(8px)", border: "1px solid #23232c" }}
            >
              {featured ? (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full cx-live-dot" style={{ background: tournamentStatus(featured) === "live" ? "#F43F5E" : "var(--cx-accent)" }} />
                    <span className="text-[10px] font-semibold tracking-wide" style={{ color: tournamentStatus(featured) === "live" ? "#F43F5E" : "var(--cx-accent-light)" }}>
                      {tournamentStatus(featured).toUpperCase()} TOURNAMENT
                    </span>
                  </div>
                  <div className="text-sm font-semibold mb-1">{featured.name}</div>
                  <div className="text-[11px]" style={{ color: "#8f8a9c" }}>{featured.players.length} players</div>
                  <Link
                    href={`/tournament/${featured.id}`}
                    className="mt-3 block text-center text-[11px] font-semibold py-2 rounded-full"
                    style={{ background: "color-mix(in srgb, var(--cx-accent) 15%, transparent)", color: "var(--cx-accent-light)" }}
                  >
                    View Bracket
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold mb-1">No tournaments yet</div>
                  <p className="text-[11px] mb-3" style={{ color: "#8f8a9c" }}>Create the first one and it shows up here.</p>
                  <Link
                    href="/tournament"
                    className="block text-center text-[11px] font-semibold py-2 rounded-full"
                    style={{ background: "color-mix(in srgb, var(--cx-accent) 15%, transparent)", color: "var(--cx-accent-light)" }}
                  >
                    Create Tournament
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Tournaments */}
      <section className="px-6 sm:px-10 py-14 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-semibold text-xl">Tournaments</h2>
          <Link href="/tournament" className="text-xs font-medium" style={{ color: "var(--cx-accent-light)" }}>
            View all →
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="cx-card rounded-2xl p-8 text-center">
            <p className="text-sm mb-4" style={{ color: "#8f8a9c" }}>
              No tournaments running yet. Set up a bracket and invite players.
            </p>
            <Link
              href="/tournament"
              className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: "var(--cx-accent)", color: "#0b0b0f" }}
            >
              Create the first tournament
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tournaments.slice(0, 4).map((t) => {
              const status = tournamentStatus(t);
              return (
                <Link key={t.id} href={`/tournament/${t.id}`} className="cx-card rounded-2xl p-5 flex flex-col">
                  <div className="text-sm font-semibold mb-1 truncate">{t.name}</div>
                  <div className="text-[11px] mb-4" style={{ color: "#5c5968" }}>
                    {t.players.length} players · {t.rounds.length} round{t.rounds.length === 1 ? "" : "s"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: status === "live" ? "#F43F5E" : status === "completed" ? "#5c5968" : "var(--cx-accent)" }}
                    />
                    <span className="text-[10px] font-semibold tracking-wide" style={{ color: status === "live" ? "#F43F5E" : "#8f8a9c" }}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section className="px-6 sm:px-10 py-14 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-semibold text-xl">Leaderboard</h2>
          <Link href="/rankings" className="text-xs font-medium" style={{ color: "var(--cx-accent-light)" }}>
            Full rankings →
          </Link>
        </div>

        {players.length === 0 ? (
          <div className="cx-card rounded-2xl p-8 text-center">
            <p className="text-sm" style={{ color: "#8f8a9c" }}>
              Ratings appear here once tournament matches are played.
            </p>
          </div>
        ) : (
          <div className="cx-card rounded-2xl overflow-hidden">
            {players.slice(0, 5).map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i === Math.min(players.length, 5) - 1 ? "none" : "1px solid #1a1a1f" }}
              >
                <span className="w-5 text-sm font-semibold" style={{ color: i < 3 ? "var(--cx-accent-light)" : "#5c5968" }}>
                  {i + 1}
                </span>
                <span className="text-sm font-medium flex-1">{p.name}</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--cx-accent-light)" }}>
                  {p.rating}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="px-6 sm:px-10 py-10 text-center text-[11px]" style={{ color: "#5c5968", borderTop: "1px solid #16161d" }}>
        CHESS<span style={{ color: "var(--cx-accent)" }}>{"//"}</span>X — click the color dot in the corner to make it yours.
      </footer>
    </div>
  );
}
