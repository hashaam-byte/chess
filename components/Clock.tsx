"use client";

import { useEffect, useRef, useState } from "react";
import { computeRemainingMs, type LiveGame, type Seat } from "@/lib/games";

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0 && totalSeconds <= 20) {
    // Show a decisecond under 20s left — the moment it matters most.
    return `${(ms / 1000).toFixed(1)}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Clock({
  game,
  seat,
  label,
  onFlagFall,
}: {
  game: LiveGame;
  seat: Seat;
  label: string;
  /** Fired once (per mount) if this clock hits zero while it's actually running. */
  onFlagFall?: (seat: Seat) => void;
}) {
  const [remaining, setRemaining] = useState(() => computeRemainingMs(game, seat));
  const firedRef = useRef(false);

  useEffect(() => {
    setRemaining(computeRemainingMs(game, seat));
  }, [game, seat]);

  useEffect(() => {
    if (game.status !== "active") return;
    const interval = setInterval(() => {
      const next = computeRemainingMs(game, seat);
      setRemaining(next);
      if (next != null && next <= 0 && !firedRef.current) {
        firedRef.current = true;
        onFlagFall?.(seat);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [game, seat, onFlagFall]);

  if (remaining == null) return null;

  const low = remaining < 20_000;
  const isOnClock = game.status === "active" && game.fen.split(" ")[1] === (seat === "black" ? "b" : "w");

  return (
    <div
      className="px-3 py-1.5 rounded-lg text-sm font-semibold tabular-nums flex items-center gap-2"
      style={{
        background: isOnClock ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isOnClock ? "var(--cx-accent)" : "#23232c"}`,
        color: low ? "#F43F5E" : "#F5F3F7",
      }}
    >
      <span className="text-[11px] font-normal" style={{ color: "#8f8a9c" }}>{label}</span>
      {formatMs(remaining)}
    </div>
  );
}