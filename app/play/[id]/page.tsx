"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
import AvatarIcon from "@/components/AvatarIcon";
import { getProfile } from "@/lib/profile";
import { getMySeat, claimSeat } from "@/lib/localIdentity";
import {
  getLiveGame,
  joinLiveGame,
  updateLiveGame,
  finishLiveGame,
  pingLiveGame,
  subscribeToGame,
  type LiveGame,
} from "@/lib/games";

const HEARTBEAT_MS = 20_000;

export default function PlayRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [game, setGame] = useState<LiveGame | null | undefined>(undefined);
  const [mySeat, setMySeat] = useState<"white" | "black" | null>(null);
  const [remoteFen, setRemoteFen] = useState<string | undefined>();
  const [remoteVersion, setRemoteVersion] = useState(0);
  const [endedRemotely, setEndedRemotely] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getLiveGame(params.id).then((g) => {
      if (cancelled) return;
      setGame(g);
      setMySeat(getMySeat(params.id));
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    return subscribeToGame(params.id, (updated) => {
      setGame(updated);
      setRemoteFen(updated.fen);
      setRemoteVersion((v) => v + 1);
      if (updated.status === "finished" && !finishedRef.current) {
        setEndedRemotely(
          updated.result === "draw"
            ? "Game ended in a draw."
            : `${updated.result === "white" ? updated.whiteName : updated.blackName} won — your opponent ended the game.`
        );
      }
    });
  }, [params.id]);

  useEffect(() => {
    if (!mySeat || game?.status === "finished") return;
    const interval = setInterval(() => pingLiveGame(params.id), HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [params.id, mySeat, game?.status]);

  // Redirect third-party visitors on an active/finished game to the proper
  // read-only spectator page rather than duplicating that view here.
  useEffect(() => {
    if (game && game.status !== "waiting" && !mySeat) {
      router.replace(`/watch/${params.id}`);
    }
  }, [game, mySeat, params.id, router]);

  async function handleJoin() {
    const profile = getProfile();
    const ok = await joinLiveGame(params.id, {
      name: profile?.name || "Player 2",
      avatarId: profile?.avatarId ?? "slate-pawn",
    });
    const fresh = await getLiveGame(params.id);
    setGame(fresh);
    if (ok) {
      claimSeat(params.id, "black");
      setMySeat("black");
    }
    // If !ok, someone else won the seat first — the effect above will
    // redirect us to spectate once `game` reflects the new active state.
  }

  function handleStateChange(fen: string, pgn: string) {
    updateLiveGame(params.id, fen, pgn);
  }

  function handleResult(winner: "white" | "black" | "draw") {
    if (!finishedRef.current) {
      finishedRef.current = true;
      finishLiveGame(params.id, winner);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (game === undefined) return null;

  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: "#8f8a9c" }}>This game doesn&apos;t exist (or was cleaned up).</p>
          <Link href="/play" className="text-sm hover:underline" style={{ color: "var(--cx-accent)" }}>
            Start a new game →
          </Link>
        </div>
      </div>
    );
  }

  // Waiting room — I created this game and no one has joined yet.
  if (game.status === "waiting" && mySeat === "white") {
    return (
      <RoomShell>
        <div className="rounded-2xl p-8 text-center" style={{ maxWidth: 420, background: "#111116", border: "1px solid #23232c" }}>
          <div className="flex justify-center mb-4">
            <AvatarIcon avatarId={game.whiteAvatarId} size={48} />
          </div>
          <h1 className="font-serif font-semibold text-lg mb-2">Waiting for an opponent…</h1>
          <p className="text-sm mb-6" style={{ color: "#8f8a9c" }}>
            Send this link to whoever you want to play. The game starts the moment they open it.
          </p>
          <button
            onClick={copyLink}
            className="w-full px-4 py-2.5 rounded-full text-sm font-semibold transition"
            style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
          >
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>
      </RoomShell>
    );
  }

  // A friend's waiting-room link — offer to join as Black.
  if (game.status === "waiting" && !mySeat) {
    return (
      <RoomShell>
        <div className="rounded-2xl p-8 text-center" style={{ maxWidth: 420, background: "#111116", border: "1px solid #23232c" }}>
          <div className="flex justify-center mb-4">
            <AvatarIcon avatarId={game.whiteAvatarId} size={48} />
          </div>
          <h1 className="font-serif font-semibold text-lg mb-2">{game.whiteName} is waiting to play</h1>
          <p className="text-sm mb-6" style={{ color: "#8f8a9c" }}>You&apos;ll play as Black.</p>
          <button
            onClick={handleJoin}
            className="w-full px-4 py-2.5 rounded-full text-sm font-semibold transition"
            style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
          >
            Join game
          </button>
        </div>
      </RoomShell>
    );
  }

  // I have a seat at an active/finished game — play.
  if (mySeat) {
    return (
      <RoomShell wide>
        {endedRemotely && (
          <div
            className="w-full rounded-xl px-4 py-3 mb-4 text-sm text-center"
            style={{ maxWidth: 560, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)", color: "#F43F5E" }}
          >
            {endedRemotely}
          </div>
        )}
        <GameBoard
          whiteLabel={game.whiteName}
          blackLabel={game.blackName ?? "Player 2"}
          playAs={mySeat}
          remoteFen={remoteFen}
          remoteVersion={remoteVersion}
          onStateChange={handleStateChange}
          onResult={handleResult}
        />
      </RoomShell>
    );
  }

  // No seat, game already active/finished — the redirect effect above is
  // sending us to /watch/[id]; render nothing in the meantime.
  return null;
}

function RoomShell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
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
      `}</style>
      <SiteNav />
      <div className="w-full flex flex-col items-center p-6 sm:p-10 flex-1 justify-center">
        {wide ? (
          <div
            className="w-full rounded-2xl p-5 sm:p-8 flex flex-col items-center"
            style={{
              maxWidth: 640,
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
              border: "1px solid color-mix(in srgb, var(--cx-accent) 14%, transparent)",
            }}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
