"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteNav from "@/components/SiteNav";
import LiveGameCard from "@/components/LiveGameCard";
import { listLiveGames, type LiveGame } from "@/lib/games";

export default function Home() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function poll() {
      listLiveGames().then((g) => {
        if (!cancelled) {
          setGames(g);
          setLoading(false);
        }
      });
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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
        .cx-card { position: relative; overflow: hidden; transition: border-color 200ms, transform 200ms; text-decoration: none; }
        .cx-card:hover { border-color: color-mix(in srgb, var(--cx-accent) 40%, transparent) !important; transform: translateY(-2px); }
      `}</style>

      <div className="cx-hero-bg">
        <SiteNav />

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
                href="/watch"
                className="px-6 py-3 rounded-full text-sm font-semibold transition"
                style={{ border: "1px solid #2a2a33", color: "#F5F3F7" }}
              >
                Watch Live
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
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
          </div>
        </section>
      </div>

      {/* Live right now */}
      <section className="px-6 sm:px-10 py-14 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-semibold text-xl">Live right now</h2>
          <Link href="/watch" className="text-xs font-medium" style={{ color: "var(--cx-accent-light)" }}>
            Watch all →
          </Link>
        </div>

        {loading ? null : games.length === 0 ? (
          <div className="cx-card rounded-2xl p-8 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
            <p className="text-sm mb-4" style={{ color: "#8f8a9c" }}>
              No games are being played right now.
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.slice(0, 4).map((g) => (
              <LiveGameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section className="px-6 sm:px-10 py-14 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-semibold text-xl">Leaderboard</h2>
        </div>
        <div className="cx-card rounded-2xl p-8 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
          <p className="text-sm" style={{ color: "#8f8a9c" }}>
            Ratings will appear here once games are being played.
          </p>
        </div>
      </section>

      <footer className="px-6 sm:px-10 py-10 text-center text-[11px]" style={{ color: "#5c5968", borderTop: "1px solid #16161d" }}>
        CHESS<span style={{ color: "var(--cx-accent)" }}>{"//"}</span>X — click the color dot in the corner to make it yours.
      </footer>
    </div>
  );
}
