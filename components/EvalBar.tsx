"use client";

import type { EngineEval } from "../lib/engine";

// Lichess's cp -> win% curve — gives a visually honest bar instead of a raw linear cp scale.
function whitePercent(e: EngineEval | null): number {
  if (!e) return 50;
  if (e.mate != null) return e.mate > 0 ? 99 : 1;
  const cp = e.cp ?? 0;
  const winChances = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return ((winChances + 1) / 2) * 100;
}

function formatEval(e: EngineEval | null): string {
  if (!e) return "";
  if (e.mate != null) return e.mate > 0 ? `M${e.mate}` : `-M${Math.abs(e.mate)}`;
  const pawns = (e.cp ?? 0) / 100;
  return (pawns >= 0 ? "+" : "") + pawns.toFixed(1);
}

export default function EvalBar({ evalScore, pending }: { evalScore: EngineEval | null; pending: boolean }) {
  const pct = whitePercent(evalScore);
  const label = formatEval(evalScore);
  const favorsWhite = pct >= 50;

  return (
    <div className="flex flex-col items-center gap-2" style={{ height: "100%" }}>
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: pending ? "var(--cx-accent)" : "#3d3327",
          boxShadow: pending ? "0 0 6px var(--cx-accent)" : "none",
          animation: pending ? "dlEvalPulse 1s ease-in-out infinite" : "none",
        }}
        title="Live Stockfish evaluation"
      />
      <div
        className="relative flex-1 rounded-full overflow-hidden"
        style={{ width: 16, background: "#111116", border: "1px solid #23232c", minHeight: 80 }}
      >
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${pct}%`,
            background: "linear-gradient(180deg, #f1f0f4, #c9c6d6)",
            transition: "height 500ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <div className="absolute left-0 right-0" style={{ top: "50%", height: 1, background: "color-mix(in srgb, var(--cx-accent) 45%, transparent)" }} />
      </div>
      <span
        className="text-[10px] font-semibold tabular-nums transition-colors duration-300 flex-shrink-0"
        style={{ color: favorsWhite ? "#e5e3ec" : "#8f8a9c" }}
      >
        {label || "0.0"}
      </span>
      <style>{`
        @keyframes dlEvalPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
