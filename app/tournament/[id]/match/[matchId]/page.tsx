"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
import { recordGameResult } from "@/lib/profile";
import { getMySeat, claimSeat } from "@/lib/localIdentity";
import { getLiveGame, createLiveGame, joinLiveGame, updateLiveGame, finishLiveGame, pingLiveGame, subscribeToGame, type LiveGame } from "@/lib/games";
import { getTournament, saveRounds, subscribeToTournament, type Tournament } from "@/lib/tournamentStore";
import { findMatch, recordMatchWinner, type BracketMatch } from "@/lib/bracket";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const HEARTBEAT_MS = 20_000;

export default function TournamentMatchPage() {
  const params = useParams<{ id: string; matchId: string }>();
  const identityKey = `tournament:${params.id}:${params.matchId}`;

  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [match, setMatch] = useState<BracketMatch | null>(null);
  const [mySeat, setMySeat] = useState<"white" | "black" | null>(null);
  const [game, setGame] = useState<LiveGame | null>(null);
  const [remoteFen, setRemoteFen] = useState<string | undefined>();
  const [remoteVersion, setRemoteVersion] = useState(0);
  const [endedRemotely, setEndedRemotely] = useState<string | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    getTournament(params.id).then((t) => {
      setTournament(t);
      if (t) setMatch(findMatch(t.rounds, params.matchId));
      setMySeat(getMySeat(identityKey));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, params.matchId]);

  useEffect(() => {
    return subscribeToTournament(params.id, (t) => {
      setTournament(t);
      setMatch(findMatch(t.rounds, params.matchId));
    });
  }, [params.id, params.matchId]);

  // Once I know my seat, either create the live game (white/playerA does this,
  // deterministically — avoids a create-race between two browsers) or wait
  // for it to appear (black/playerB polls until white has created it).
  useEffect(() => {
    if (!match || !mySeat || !match.playerA || !match.playerB) return;
    if (match.gameId) {
      getLiveGame(match.gameId).then(setGame);
      return;
    }
    if (mySeat !== "white") return; // black waits for the subscription below to pick up gameId

    let cancelled = false;
    createLiveGame({ name: match.playerA, avatarId: "violet-king" }, START_FEN).then(async (gameId) => {
      if (cancelled || !gameId || !match.playerB) return;
      // createLiveGame only sets up White; joinLiveGame fills in Black's
      // identity and flips the row to 'active' — same path a normal
      // (non-tournament) opponent joining a game takes.
      await joinLiveGame(gameId, { name: match.playerB, avatarId: "amber-king" });
      const fresh = await getTournament(params.id);
      if (!fresh) return;
      const updatedRounds = fresh.rounds.map((round) =>
        round.map((m) => (m.id === match.id ? { ...m, gameId } : m))
      );
      await saveRounds(params.id, updatedRounds);
      setGame(await getLiveGame(gameId));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.gameId, mySeat]);

  useEffect(() => {
    if (!game) return;
    return subscribeToGame(game.id, (updated) => {
      setGame(updated);
      setRemoteFen(updated.fen);
      setRemoteVersion((v) => v + 1);
      if (updated.status === "finished" && !finishedRef.current) {
        finishedRef.current = true;
        setEndedRemotely(
          updated.result === "draw" ? "Game ended in a draw." : `${updated.result === "white" ? updated.whiteName : updated.blackName} won.`
        );
        if (mySeat && updated.result) {
          recordGameResult(updated.result === "draw" ? "draw" : updated.result === mySeat ? "win" : "loss");
        }
      }
    });
    // Intentionally keyed on game?.id only, not the whole `game` object —
    // `game` itself changes on every move, and resubscribing on every move
    // would tear down and rebuild the channel constantly for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, mySeat]);

  useEffect(() => {
    if (!game || game.status === "finished") return;
    const interval = setInterval(() => pingLiveGame(game.id), HEARTBEAT_MS);
    return () => clearInterval(interval);
    // Same reasoning as above — only re-arm the heartbeat when the game id
    // or its status actually changes, not on every position update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, game?.status]);

  function choose(seat: "white" | "black") {
    claimSeat(identityKey, seat);
    setMySeat(seat);
  }

  function handleStateChange(fen: string, pgn: string) {
    if (game) updateLiveGame(game.id, fen, pgn);
  }

  async function handleResult(winner: "white" | "black" | "draw") {
    if (finishedRef.current || !game || !match) return;
    finishedRef.current = true;
    await finishLiveGame(game.id, winner);
    if (mySeat) recordGameResult(winner === "draw" ? "draw" : winner === mySeat ? "win" : "loss");

    if (winner !== "draw") {
      const winnerName = winner === "white" ? match.playerA : match.playerB;
      if (winnerName) {
        const fresh = await getTournament(params.id);
        if (fresh) {
          const freshMatch = findMatch(fresh.rounds, match.id);
          if (freshMatch && !freshMatch.winner) {
            await saveRounds(params.id, recordMatchWinner(fresh.rounds, match.id, winnerName));
          }
        }
      }
    }
  }

  if (tournament === undefined) return null;

  if (tournament === null || !match) {
    return (
      <Shell>
        <p className="text-sm mb-3" style={{ color: "#8f8a9c" }}>This match doesn&apos;t exist.</p>
        <Link href="/tournament" className="text-sm hover:underline" style={{ color: "var(--cx-accent)" }}>← Back to tournaments</Link>
      </Shell>
    );
  }

  if (!match.playerA || !match.playerB) {
    return (
      <Shell>
        <p className="text-sm" style={{ color: "#8f8a9c" }}>Waiting on an earlier round to finish before this match is ready.</p>
      </Shell>
    );
  }

  if (!mySeat) {
    return (
      <Shell>
        <h1 className="font-serif font-semibold text-lg mb-4">Which player are you?</h1>
        <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 320 }}>
          <button onClick={() => choose("white")} className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 transition" style={{ border: "1px solid #23232c" }}>
            {match.playerA} <span style={{ color: "#5c5968" }}>(White)</span>
          </button>
          <button onClick={() => choose("black")} className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 transition" style={{ border: "1px solid #23232c" }}>
            {match.playerB} <span style={{ color: "#5c5968" }}>(Black)</span>
          </button>
        </div>
      </Shell>
    );
  }

  if (!game) {
    return (
      <Shell>
        <p className="text-sm" style={{ color: "#8f8a9c" }}>
          {mySeat === "white" ? "Setting up the board…" : `Waiting for ${match.playerA} to start the match…`}
        </p>
      </Shell>
    );
  }

  return (
    <Shell wide>
      {endedRemotely && (
        <div className="w-full rounded-xl px-4 py-3 mb-4 text-sm text-center" style={{ maxWidth: 560, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", color: "#F43F5E" }}>
          {endedRemotely}
        </div>
      )}
      <GameBoard
        whiteLabel={match.playerA}
        blackLabel={match.playerB}
        playAs={mySeat}
        remoteFen={remoteFen}
        remoteVersion={remoteVersion}
        onStateChange={handleStateChange}
        onResult={handleResult}
        frozen={!!endedRemotely}
      />
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <div className="w-full flex flex-col items-center p-6 sm:p-10 flex-1 justify-center text-center">
        {wide ? (
          <div className="w-full rounded-2xl p-5 sm:p-8 flex flex-col items-center" style={{ maxWidth: 640, background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))", border: "1px solid color-mix(in srgb, var(--cx-accent) 14%, transparent)" }}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
