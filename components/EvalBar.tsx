"use client";

import type { EngineEval } from "@/lib/engine";

// Lichess's cp -> win% curve — gives a visually honest bar instead of a raw linear cp scale.
function whitePercent(e: EngineEval | null): number {
  if (!e) return 50;
  if (e.mate != null) return e.mate > 0 ? 99 : 1;
  const cp = e.cp ?? 0;
  const winChances = 2 / (1 + Math.exp(-0.00368208 * cp)) - 1;
  return ((winChances + 1) / 2) * 100;
}

function formatEval(e: EngineEval | null): string {
  if (!e) return "0.0";
  if (e.mate != null) return e.mate > 0 ? `M${e.mate}` : `-M${Math.abs(e.mate)}`;
  const pawns = (e.cp ?? 0) / 100;
  return (pawns >= 0 ? "+" : "") + pawns.toFixed(1);
}

export default function EvalBar({ evalScore, pending }: { evalScore: EngineEval | null; pending: boolean }) {
  const pct = whitePercent(evalScore);
  const label = formatEval(evalScore);
  const favorsWhite = pct >= 50;

  return (
    <div className="flex items-center justify-center" style={{ height: "100%", width: 38 }}>
      <div className="relative" style={{ width: 13, height: "100%", minHeight: 80 }}>
        {/* The tube — rounded and clipped, holds the fill and tick marks */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: "#0b0b0f",
            border: "1px solid color-mix(in srgb, var(--cx-accent) 20%, #23232c)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className="absolute left-0 right-0"
              style={{ bottom: `${tick}%`, height: 1, background: "rgba(255,255,255,0.08)" }}
            />
          ))}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: `${pct}%`,
              background: "linear-gradient(180deg, #ffffff, #cfceda)",
              transition: "height 500ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          {pending && (
            <div
              className="absolute left-0 right-0"
              style={{ height: "40%", background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--cx-accent) 35%, transparent), transparent)", animation: "cxScan 1.6s ease-in-out infinite" }}
            />
          )}
        </div>

        {/* Boundary bead — glowing marker riding the fill line, drawn outside the clipped tube */}
        <div
          className="absolute rounded-full"
          style={{
            left: "50%",
            bottom: `${pct}%`,
            width: 10,
            height: 10,
            transform: "translate(-50%, 50%)",
            background: "var(--cx-accent-light)",
            boxShadow: pending ? "0 0 10px 2px var(--cx-accent)" : "0 0 6px 1px color-mix(in srgb, var(--cx-accent) 70%, transparent)",
            transition: "bottom 500ms cubic-bezier(0.22,1,0.36,1)",
            animation: pending ? "cxBeadPulse 1s ease-in-out infinite" : "none",
          }}
        />

        {/* Floating readout — tracks the bead instead of sitting fixed at one end */}
        <div
          className="absolute flex items-center justify-center rounded-md px-1"
          style={{
            left: "50%",
            bottom: `${pct}%`,
            transform: "translate(-50%, 50%)",
            minWidth: 26,
            height: 15,
            background: "#111116",
            border: `1px solid ${favorsWhite ? "rgba(255,255,255,0.25)" : "color-mix(in srgb, var(--cx-accent) 45%, transparent)"}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            transition: "bottom 500ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span
            className="font-mono font-semibold tabular-nums"
            style={{ fontSize: 9, color: favorsWhite ? "#F5F3F7" : "var(--cx-accent-light)" }}
          >
            {label}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cxScan { 0% { transform: translateY(-140%); } 100% { transform: translateY(240%); } }
        @keyframes cxBeadPulse { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
