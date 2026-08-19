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
          background: pending ? "#caa356" : "#3d3327",
          boxShadow: pending ? "0 0 6px #caa356" : "none",
          animation: pending ? "dlEvalPulse 1s ease-in-out infinite" : "none",
        }}
        title="Live Stockfish evaluation"
      />
      <div
        className="relative flex-1 rounded-full overflow-hidden"
        style={{ width: 16, background: "#1c1712", border: "1px solid #332c22", minHeight: 80 }}
      >
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${pct}%`,
            background: "linear-gradient(180deg, #f6efe0, #d8cbac)",
            transition: "height 500ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <div className="absolute left-0 right-0" style={{ top: "50%", height: 1, background: "rgba(202,163,86,0.45)" }} />
      </div>
      <span
        className="text-[10px] font-semibold tabular-nums transition-colors duration-300 flex-shrink-0"
        style={{ color: favorsWhite ? "#e9dfc9" : "#8f887c" }}
      >
        {label || "0.0"}
      </span>
      <style>{`
        @keyframes dlEvalPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}