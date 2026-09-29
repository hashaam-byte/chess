"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
import AvatarIcon from "@/components/AvatarIcon";
import ChessQRCode from "@/components/ChessQRCode";
import Clock from "@/components/Clock";
import { getProfile, recordGameResult } from "@/lib/profile";
import { getMySeat, claimSeat } from "@/lib/localIdentity";
import {
  getLiveGame,
  joinLiveGame,
  recordMove,
  finishLiveGame,
  pingLiveGame,
  subscribeToGame,
  type LiveGame,
  type Seat,
} from "@/lib/games";

const HEARTBEAT_MS = 20_000;

export default function PlayRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [game, setGame] = useState<LiveGame | null | undefined>(undefined);
  const [mySeat, setMySeat] = useState<Seat | null>(null);
  const [remoteFen, setRemoteFen] = useState<string | undefined>();
  const [remoteVersion, setRemoteVersion] = useState(0);
  const [endedRemotely, setEndedRemotely] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const finishedRef = useRef(false);
  // Guards against the same join-race the redirect effect below has to
  // account for — see the comment near that effect.
  const joiningRef = useRef(false);

  useEffect(() => {
    // Safety net: "bot" is a reserved id (app/play/bot/page.tsx) and should
    // never reach this dynamic route at all — Next.js's static-over-dynamic
    // routing is supposed to send /play/bot there directly. If it lands
    // here anyway (route not deployed yet, dev server needs a restart to
    // pick up a brand-new route folder, etc.), redirect instead of calling
    // getLiveGame("bot"), which isn't a valid id and just surfaces a raw
    // Postgres UUID error.
    if (params.id === "bot") {
      router.replace("/play/bot");
      return;
    }
    let cancelled = false;
    getLiveGame(params.id).then((g) => {
      if (cancelled) return;
      setGame(g);
      setMySeat(getMySeat(params.id));
      // Seed the board with wherever this game currently is — without this,
      // reloading mid-game shows the starting position until the *next*
      // move happens, since the subscription below only reports changes
      // that occur after it starts listening, not the current state.
      if (g) {
        setRemoteFen(g.fen);
        setRemoteVersion(1);
      }
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
        finishedRef.current = true;
        setEndedRemotely(
          updated.result === "draw"
            ? "Game ended in a draw."
            : `${updated.result === "white" ? updated.whiteName : updated.blackName} won — your opponent ended the game.`
        );
        if (mySeat && updated.result) {
          recordGameResult(updated.result === "draw" ? "draw" : updated.result === mySeat ? "win" : "loss");
        }
      }
    });
  }, [params.id, mySeat]);

  useEffect(() => {
    if (!mySeat || game?.status === "finished") return;
    const interval = setInterval(() => pingLiveGame(params.id), HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [params.id, mySeat, game?.status]);

  // Redirect third-party visitors on an active/finished game to the proper
  // read-only spectator page rather than duplicating that view here.
  useEffect(() => {
    if (game && game.status !== "waiting" && !mySeat && !joiningRef.current) {
      router.replace(`/watch/${params.id}`);
    }
  }, [game, mySeat, params.id, router]);

  async function handleJoin() {
    joiningRef.current = true;
    try {
      const profile = getProfile();
      const seat = await joinLiveGame(params.id, {
        name: profile?.name || "Player 2",
        avatarId: profile?.avatarId ?? "slate-pawn",
      });
      const fresh = await getLiveGame(params.id);
      setGame(fresh);
      if (seat) {
        claimSeat(params.id, seat);
        setMySeat(seat);
      }
      // If seat is null, someone else won it first — the effect above will
      // redirect us to spectate once `game` reflects the new active state.
    } finally {
      joiningRef.current = false;
    }
  }

  function handleStateChange(fen: string, pgn: string) {
    recordMove(params.id, fen, pgn).then((result) => {
      if (result?.flagFall && !finishedRef.current) {
        finishedRef.current = true;
        const winner: Seat = result.flagFall === "white" ? "black" : "white";
        setEndedRemotely(mySeat === result.flagFall ? "You ran out of time." : "Your opponent ran out of time — you win.");
        if (mySeat) recordGameResult(winner === mySeat ? "win" : "loss");
      }
    });
  }

  function handleResult(winner: "white" | "black" | "draw") {
    if (!finishedRef.current) {
      finishedRef.current = true;
      finishLiveGame(params.id, winner);
      if (mySeat) {
        recordGameResult(winner === "draw" ? "draw" : winner === mySeat ? "win" : "loss");
      }
    }
  }

  /** A clock hitting zero on either player's own screen ends the game the
   *  same way an opponent resigning does — reuses the same bookkeeping.
   *  Sets its own message rather than relying on the realtime round trip,
   *  since by the time that arrives `finishedRef` may already be set and
   *  the subscription handler will skip it. */
  function handleFlagFall(seat: Seat) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setEndedRemotely(mySeat === seat ? "You ran out of time." : "Your opponent ran out of time — you win.");
    const winner: Seat = seat === "white" ? "black" : "white";
    finishLiveGame(params.id, winner);
    if (mySeat) recordGameResult(winner === mySeat ? "win" : "loss");
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

  const timeLabel =
    game.timeMinutes == null ? "Untimed" : `${game.timeMinutes}+${game.timeIncrement}`;

  // Waiting room — I created this game and no one has joined yet. Since the
  // creator can now be either color, this is just "I hold a seat while the
  // game is still waiting" rather than assuming white specifically.
  if (game.status === "waiting" && mySeat) {
    const myAvatar = mySeat === "white" ? game.whiteAvatarId : game.blackAvatarId;
    return (
      <RoomShell>
        <div className="rounded-2xl p-8 text-center" style={{ maxWidth: 420, background: "#111116", border: "1px solid #23232c" }}>
          <div className="flex justify-center mb-4">
            <AvatarIcon avatarId={myAvatar ?? "violet-king"} size={48} />
          </div>
          <h1 className="font-serif font-semibold text-lg mb-1">Waiting for an opponent…</h1>
          <p className="text-xs mb-4" style={{ color: "#8f8a9c" }}>
            You&apos;re playing {mySeat} · {timeLabel}
          </p>
          <p className="text-sm mb-6" style={{ color: "#8f8a9c" }}>
            Send this link to whoever you want to play, or have them scan the code. The game starts the moment they open it.
          </p>
          {typeof window !== "undefined" && (
            <div className="flex justify-center mb-6">
              <ChessQRCode url={window.location.href} size={180} />
            </div>
          )}
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

  // A friend's waiting-room link — offer to join whichever seat is open.
  if (game.status === "waiting" && !mySeat) {
    const hostName = game.whiteName ?? game.blackName ?? "Someone";
    const hostAvatar = game.whiteAvatarId ?? game.blackAvatarId ?? "violet-king";
    const openSeat: Seat = game.whiteName == null ? "white" : "black";
    return (
      <RoomShell>
        <div className="rounded-2xl p-8 text-center" style={{ maxWidth: 420, background: "#111116", border: "1px solid #23232c" }}>
          <div className="flex justify-center mb-4">
            <AvatarIcon avatarId={hostAvatar} size={48} />
          </div>
          <h1 className="font-serif font-semibold text-lg mb-2">{hostName} is waiting to play</h1>
          <p className="text-sm mb-6" style={{ color: "#8f8a9c" }}>
            You&apos;ll play as {openSeat} · {timeLabel}
          </p>
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
    const opponent: Seat = mySeat === "white" ? "black" : "white";
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
        {game.timeMinutes != null && (
          <div className="w-full flex items-center justify-between mb-3" style={{ maxWidth: 560 }}>
            <Clock game={game} seat={opponent} label={opponent === "white" ? game.whiteName ?? "White" : game.blackName ?? "Black"} onFlagFall={handleFlagFall} />
            <Clock game={game} seat={mySeat} label="You" onFlagFall={handleFlagFall} />
          </div>
        )}
        <GameBoard
          whiteLabel={game.whiteName ?? "White"}
          blackLabel={game.blackName ?? "Player 2"}
          playAs={mySeat}
          remoteFen={remoteFen}
          remoteVersion={remoteVersion}
          onStateChange={handleStateChange}
          onResult={handleResult}
          frozen={!!endedRemotely}
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