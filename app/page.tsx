"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteNav from "../components/SiteNav";
import { listTournaments } from "../lib/tournamentStore";
import { isComplete, type Tournament } from "../lib/tournament";
import { listPlayers, type Player } from "../lib/players";

const CARD_ART = [
  "/images/tournaments/night-of-kings.webp",
  "/images/tournaments/rising-knights.webp",
  "/images/tournaments/weekend-blitz.webp",
  "/images/tournaments/grand-arena.webp",
];

function tournamentStatus(t: Tournament): "live" | "upcoming" | "completed" {
  if (isComplete(t)) return "completed";
  const started = t.rounds.some((round) => round.some((m) => m.winner !== null));
  return started ? "live" : "upcoming";
}

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    listTournaments().then(setTournaments);
    listPlayers().then(setPlayers);
  }, []);

  const liveTournament = tournaments.find((t) => tournamentStatus(t) === "live");
  const featured = liveTournament ?? tournaments[0];

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <style>{`
        @keyframes cxFloatPhoto { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes cxPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .cx-king { animation: cxFloatPhoto 6s ease-in-out infinite; }
        .cx-live-dot { animation: cxPulse 1.4s ease-in-out infinite; }
        .cx-hero-bg {
          background:
            radial-gradient(ellipse 900px 560px at 18% 0%, color-mix(in srgb, var(--cx-accent) 16%, transparent), transparent 65%),
            radial-gradient(ellipse 700px 500px at 100% 30%, color-mix(in srgb, var(--cx-accent-light) 10%, transparent), transparent 60%),
            radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px) 0 0 / 24px 24px,
            #07070A;
        }
        .cx-card { position: relative; overflow: hidden; border: 1px solid #23232c; transition: border-color 200ms, transform 200ms; }
        .cx-card:hover { border-color: color-mix(in srgb, var(--cx-accent) 40%, transparent); transform: translateY(-2px); }
        .cx-card-plain { background: #111116; }
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
            {/* Ambient glow behind the piece, tinted by whatever accent is active */}
            <div
              className="absolute rounded-full"
              style={{
                width: 320,
                height: 320,
                background: "radial-gradient(circle, color-mix(in srgb, var(--cx-accent) 35%, transparent), transparent 70%)",
                filter: "blur(20px)",
                zIndex: 0,
              }}
            />
            <div className="cx-king relative" style={{ width: "clamp(220px, 26vw, 340px)", zIndex: 1 }}>
              <Image
                src="/images/hero-king.webp"
                alt="A single obsidian chess king, dramatically lit"
                width={760}
                height={1140}
                priority
                style={{ width: "100%", height: "auto", filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.6))" }}
              />
            </div>

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
          <div className="cx-card cx-card-plain rounded-2xl p-8 text-center">
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
            {tournaments.slice(0, 4).map((t, i) => {
              const status = tournamentStatus(t);
              return (
                <Link key={t.id} href={`/tournament/${t.id}`} className="cx-card rounded-2xl flex flex-col h-52">
                  <Image
                    src={CARD_ART[i % CARD_ART.length]}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    style={{ objectFit: "cover", zIndex: 0 }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(7,7,10,0.15) 0%, rgba(7,7,10,0.9) 85%)", zIndex: 1 }}
                  />
                  <div className="relative p-5 flex flex-col flex-1" style={{ zIndex: 2 }}>
                    <div className="text-sm font-semibold mb-1 truncate mt-auto">{t.name}</div>
                    <div className="text-[11px] mb-3" style={{ color: "#c8c6d0" }}>
                      {t.players.length} players · {t.rounds.length} round{t.rounds.length === 1 ? "" : "s"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: status === "live" ? "#F43F5E" : status === "completed" ? "#8f8a9c" : "var(--cx-accent)" }}
                      />
                      <span className="text-[10px] font-semibold tracking-wide" style={{ color: status === "live" ? "#F43F5E" : "#c8c6d0" }}>
                        {status.toUpperCase()}
                      </span>
                    </div>
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
          <div className="cx-card cx-card-plain rounded-2xl p-8 text-center">
            <p className="text-sm" style={{ color: "#8f8a9c" }}>
              Ratings appear here once tournament matches are played.
            </p>
          </div>
        ) : (
          <div className="cx-card cx-card-plain rounded-2xl overflow-hidden">
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
