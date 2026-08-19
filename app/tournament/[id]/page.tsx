"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GameBoard from "@/components/GameBoard";
import { recordMatchResult, getChampion, type Tournament, type BracketMatch } from "../../../lib/tournament";
import { getTournament, saveTournament } from "../../../lib/tournamentStore";
import { recordMatch, getPlayer } from "../../../lib/players";

export default function TournamentPage() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(() => getTournament(params.id));
  const [activeMatch, setActiveMatch] = useState<BracketMatch | null>(null);

  if (tournament === null) {
    return (
      <div className="dl-page min-h-screen flex items-center justify-center" style={{ background: "#0d1114", color: "#EDEAE1" }}>
        <div className="text-center">
          <p className="text-sm text-[#8f887c] mb-3">Tournament not found on this device.</p>
          <Link href="/tournament" className="text-[#caa356] text-sm hover:underline">
            ← Back to tournaments
          </Link>
        </div>
      </div>
    );
  }

  const champion = getChampion(tournament);

  function handleResult(match: BracketMatch, winner: "white" | "black" | "draw") {
    if (!tournament || !match.playerA || !match.playerB) return;

    // White = playerA, Black = playerB (see the "Play match" button below).
    if (winner === "draw") {
      recordMatch(match.playerA, match.playerB, "draw");
      // Single-elimination has no draw-advance rule; require a decisive game to proceed.
      setActiveMatch(null);
      return;
    }

    const winnerName = winner === "white" ? match.playerA : match.playerB;
    const eloResult = winner === "white" ? "a" : "b";
    recordMatch(match.playerA, match.playerB, eloResult);

    const updated = recordMatchResult(tournament, match.round, match.slot, winnerName);
    saveTournament(updated);
    setTournament(updated);
    setActiveMatch(null);
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
      `}</style>

      <div className="w-full flex items-center justify-between" style={{ maxWidth: 900 }}>
        <h1 className="font-serif text-2xl sm:text-[28px] tracking-wide" style={{ color: "#f1e9d8" }}>
          {tournament.name}
        </h1>
        <Link href="/tournament" className="text-xs text-[#8f887c] hover:text-[#EDEAE1] transition-colors">
          ← All tournaments
        </Link>
      </div>

      {champion && (
        <div
          className="mt-4 mb-2 px-5 py-2 rounded-full text-sm font-semibold"
          style={{ background: "rgba(202,163,86,0.12)", border: "1px solid rgba(202,163,86,0.3)", color: "#caa356" }}
        >
          🏆 {champion} wins the tournament
        </div>
      )}

      <div className="w-full overflow-x-auto mt-6" style={{ maxWidth: 900 }}>
        <div className="flex gap-8 pb-4" style={{ minWidth: tournament.rounds.length * 220 }}>
          {tournament.rounds.map((round, r) => (
            <div key={r} className="flex flex-col gap-4 justify-center" style={{ width: 200, flexShrink: 0 }}>
              <div className="text-xs uppercase tracking-wider text-[#8f887c] text-center">
                {r === tournament.rounds.length - 1 ? "Final" : `Round ${r + 1}`}
              </div>
              {round.map((match) => (
                <MatchCard key={match.id} match={match} onPlay={() => setActiveMatch(match)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {activeMatch && activeMatch.playerA && activeMatch.playerB && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(13,17,20,0.88)", backdropFilter: "blur(3px)" }}
        >
          <div
            className="w-full rounded-2xl p-5 sm:p-7 flex flex-col items-center my-8"
            style={{
              maxWidth: 640,
              background: "linear-gradient(180deg, #171310, #14100c)",
              border: "1px solid rgba(202,163,86,0.2)",
              boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)",
            }}
          >
            <div className="w-full flex items-center justify-between mb-4" style={{ maxWidth: 560 }}>
              <span className="text-xs text-[#8f887c]">
                {activeMatch.round === tournament.rounds.length - 1 ? "Final" : `Round ${activeMatch.round + 1}`}
              </span>
              <button
                onClick={() => setActiveMatch(null)}
                className="text-xs text-[#8f887c] hover:text-[#EDEAE1] transition"
              >
                Close without playing ✕
              </button>
            </div>
            <GameBoard
              key={activeMatch.id}
              whiteLabel={activeMatch.playerA}
              blackLabel={activeMatch.playerB}
              onResult={(winner) => handleResult(activeMatch, winner)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, onPlay }: { match: BracketMatch; onPlay: () => void }) {
  const ready = match.playerA && match.playerB && !match.winner;
  const ratingA = match.playerA ? getPlayer(match.playerA).rating : null;
  const ratingB = match.playerB ? getPlayer(match.playerB).rating : null;

  return (
    <div
      className="rounded-xl p-3 text-sm"
      style={{
        background: match.winner ? "rgba(202,163,86,0.05)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${match.winner ? "rgba(202,163,86,0.2)" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      <PlayerLine name={match.playerA} rating={ratingA} won={match.winner === match.playerA} />
      <div className="my-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <PlayerLine name={match.playerB} rating={ratingB} won={match.winner === match.playerB} />

      {match.bye && <div className="text-[10px] text-[#6b6153] mt-2">Bye — advances automatically</div>}
      {ready && (
        <button
          onClick={onPlay}
          className="mt-2 w-full px-3 py-1.5 rounded-full text-xs font-medium bg-[#caa356] text-[#1c1712] hover:brightness-110 transition"
        >
          Play match
        </button>
      )}
    </div>
  );
}

function PlayerLine({ name, rating, won }: { name: string | null; rating: number | null; won: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: name ? (won ? "#caa356" : "#c9bfae") : "#5c534a", fontWeight: won ? 600 : 400 }}>
        {name ?? "TBD"}
      </span>
      {rating !== null && <span className="text-[11px] text-[#6b6153]">{rating}</span>}
    </div>
  );
}
