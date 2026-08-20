"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import { createTournament } from "../../lib/tournament";
import { listTournaments, saveTournament } from "../../lib/tournamentStore";
import { listPlayers, ensurePlayer, type Player } from "../../lib/players";
import type { Tournament } from "../../lib/tournament";

export default function TournamentListPage() {
  const router = useRouter();
  const [tournaments] = useState<Tournament[]>(() => listTournaments());
  const [players] = useState<Player[]>(() => listPlayers());
  const [name, setName] = useState("");
  const [namesInput, setNamesInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const names = Array.from(
      new Set(
        namesInput
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean)
      )
    );

    if (names.length < 2) {
      setError("Enter at least 2 player names, one per line.");
      return;
    }
    if (!name.trim()) {
      setError("Give the tournament a name.");
      return;
    }

    // Seed by current rating (unrated players default to 1200), highest first.
    for (const n of names) ensurePlayer(n);
    const ratings = listPlayers();
    const seeded = [...names].sort((a, b) => {
      const ra = ratings.find((p) => p.name === a)?.rating ?? 1200;
      const rb = ratings.find((p) => p.name === b)?.rating ?? 1200;
      return rb - ra;
    });

    const t = createTournament(name.trim(), seeded);
    saveTournament(t);
    router.push(`/tournament/${t.id}`);
  }

  return (
    <div className="dl-page min-h-screen flex flex-col items-center">
      <style>{`
        .dl-page {
          background:
            radial-gradient(ellipse 700px 420px at 50% -8%, color-mix(in srgb, var(--cx-accent) 10%, transparent), transparent 65%),
            radial-gradient(ellipse 600px 500px at 100% 100%, color-mix(in srgb, var(--cx-accent) 5%, transparent), transparent 60%),
            #07070A;
          color: #F5F3F7;
        }
        .dl-input {
          background: #0c0c10; border: 1px solid #23232c; border-radius: 10px;
          padding: 10px 14px; color: #F5F3F7; font-size: 14px; width: 100%;
        }
        .dl-input:focus { outline: none; border-color: var(--cx-accent); }
        .dl-input::placeholder { color: #5c5968; }
      `}</style>

      <SiteNav />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
      <div className="w-full flex items-center justify-between" style={{ maxWidth: 640 }}>
        <h1 className="font-serif font-semibold text-2xl sm:text-[28px] tracking-tight" style={{ color: "#F5F3F7" }}>
          Tournaments
        </h1>
      </div>
      <p className="text-sm text-[#8f8a9c] mb-8 self-start" style={{ maxWidth: 640 }}>
        Single-elimination brackets, seeded by Elo rating. Local to this browser for now — one device, pass-and-play per match.
      </p>

      <div className="w-full grid gap-6" style={{ maxWidth: 640, gridTemplateColumns: "1.3fr 1fr" }}>
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid color-mix(in srgb, var(--cx-accent) 12%, transparent)" }}
        >
          <h2 className="font-serif font-semibold text-lg mb-4" style={{ color: "#F5F3F7" }}>
            New tournament
          </h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              className="dl-input"
              placeholder="Tournament name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="dl-input"
              placeholder={"Player names, one per line\ne.g.\nAlice\nBob\nCarol\nDave"}
              rows={6}
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
            />
            {error && <p className="text-xs text-[#e0685f]">{error}</p>}
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-gradient-to-b from-[var(--cx-accent-light)] to-[var(--cx-accent)] text-[#111116] text-sm font-semibold hover:brightness-110 transition"
            >
              Create bracket
            </button>
          </form>

          {tournaments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#23232c]">
              <h3 className="text-xs uppercase tracking-wider text-[#8f8a9c] mb-3">Existing</h3>
              <div className="flex flex-col gap-2">
                {tournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournament/${t.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#111116] transition"
                  >
                    <span className="text-sm text-[#c8c6d0]">{t.name}</span>
                    <span className="text-[11px] text-[#5c5968]">{t.players.length} players</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-5 sm:p-6 h-fit"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid color-mix(in srgb, var(--cx-accent) 12%, transparent)" }}
        >
          <h2 className="font-serif font-semibold text-lg mb-4" style={{ color: "#F5F3F7" }}>
            Ratings
          </h2>
          {players.length === 0 ? (
            <p className="text-xs text-[#5c5968]">No games recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {players.slice(0, 10).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="text-[#c8c6d0]">
                    <span className="text-[#5c5968] mr-2">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span style={{ color: "var(--cx-accent-light)" }} className="font-medium">{p.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
