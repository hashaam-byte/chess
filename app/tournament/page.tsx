"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="dl-page min-h-screen flex flex-col items-center p-6 sm:p-10">
      <style>{`
        .dl-page {
          background:
            radial-gradient(ellipse 700px 420px at 50% -8%, rgba(202,163,86,0.10), transparent 65%),
            radial-gradient(ellipse 600px 500px at 100% 100%, rgba(202,163,86,0.05), transparent 60%),
            #0d1114;
          color: #EDEAE1;
        }
        .dl-input {
          background: #15110d; border: 1px solid #332c22; border-radius: 10px;
          padding: 10px 14px; color: #EDEAE1; font-size: 14px; width: 100%;
        }
        .dl-input:focus { outline: none; border-color: #caa356; }
        .dl-input::placeholder { color: #6b6153; }
      `}</style>

      <div className="w-full flex items-center justify-between" style={{ maxWidth: 640 }}>
        <h1 className="font-serif text-2xl sm:text-[28px] tracking-wide" style={{ color: "#f1e9d8" }}>
          Tournaments
        </h1>
        <Link href="/" className="text-xs text-[#8f887c] hover:text-[#EDEAE1] transition-colors">
          ← Board
        </Link>
      </div>
      <p className="text-sm text-[#8f887c] mb-8 self-start" style={{ maxWidth: 640 }}>
        Single-elimination brackets, seeded by Elo rating. Local to this browser for now — one device, pass-and-play per match.
      </p>

      <div className="w-full grid gap-6" style={{ maxWidth: 640, gridTemplateColumns: "1.3fr 1fr" }}>
        <div
          className="rounded-2xl p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(202,163,86,0.12)" }}
        >
          <h2 className="font-serif text-lg mb-4" style={{ color: "#f1e9d8" }}>
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
              className="px-4 py-2 rounded-full bg-gradient-to-b from-[#dab766] to-[#caa356] text-[#1c1712] text-sm font-semibold hover:brightness-110 transition"
            >
              Create bracket
            </button>
          </form>

          {tournaments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#332c22]">
              <h3 className="text-xs uppercase tracking-wider text-[#8f887c] mb-3">Existing</h3>
              <div className="flex flex-col gap-2">
                {tournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournament/${t.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#1c1712] transition"
                  >
                    <span className="text-sm text-[#c9bfae]">{t.name}</span>
                    <span className="text-[11px] text-[#6b6153]">{t.players.length} players</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-5 sm:p-6 h-fit"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(202,163,86,0.12)" }}
        >
          <h2 className="font-serif text-lg mb-4" style={{ color: "#f1e9d8" }}>
            Ratings
          </h2>
          {players.length === 0 ? (
            <p className="text-xs text-[#6b6153]">No games recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {players.slice(0, 10).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="text-[#c9bfae]">
                    <span className="text-[#6b6153] mr-2">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="text-[#caa356] font-medium">{p.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
