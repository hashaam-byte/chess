"use client";

import type { MoveQuality } from "../lib/moveQuality";
import { QUALITY_COLOR } from "../lib/moveQuality";

export type PlyAnalysis = { quality: MoveQuality; cpLoss: number };

const GRAPH_CAP = 600; // cp — evals beyond this (including mate) are drawn at full height

export function accuracyFromAvgLoss(avgLossCp: number): number {
  const acc = 103.1668 * Math.exp(-0.04354 * avgLossCp) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

function clampEval(v: number): number {
  // whitePerspectiveValue() encodes mate as a huge number (±100000-ish) so it
  // sorts correctly — collapse that back down to the graph's visual cap here.
  if (Math.abs(v) > 5000) return v > 0 ? GRAPH_CAP : -GRAPH_CAP;
  return Math.max(-GRAPH_CAP, Math.min(GRAPH_CAP, v));
}

export default function GameReview({
  analysis,
  evalPoints,
  whiteLabel,
  blackLabel,
}: {
  analysis: PlyAnalysis[];
  evalPoints: number[]; // length = analysis.length + 1, index 0 = starting position
  whiteLabel: string;
  blackLabel: string;
}) {
  const whiteMoves = analysis.filter((_, i) => i % 2 === 0);
  const blackMoves = analysis.filter((_, i) => i % 2 === 1);
  const avg = (arr: PlyAnalysis[]) => (arr.length ? arr.reduce((s, a) => s + a.cpLoss, 0) / arr.length : 0);
  const whiteAccuracy = accuracyFromAvgLoss(avg(whiteMoves));
  const blackAccuracy = accuracyFromAvgLoss(avg(blackMoves));

  const W = 300;
  const H = 76;
  const mid = H / 2;
  const n = evalPoints.length;
  const points = evalPoints.map((v, i) => {
    const x = n > 1 ? (i / (n - 1)) * W : 0;
    const y = mid - (clampEval(v) / GRAPH_CAP) * mid;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const areaPath = `M 0 ${mid} ${points.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} L ${W} ${mid} Z`;

  const markers = analysis
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => a.quality === "blunder" || a.quality === "mistake");

  return (
    <div
      className="w-full rounded-xl p-4 dl-fade-in"
      style={{ maxWidth: 560, background: "#0c0c10", border: "1px solid #23232c" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: "#F5F3F7" }}>
          Game Review
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span style={{ color: "#e5e3ec" }}>{whiteLabel}: {whiteAccuracy.toFixed(1)}%</span>
          <span style={{ color: "#8f8a9c" }}>{blackLabel}: {blackAccuracy.toFixed(1)}%</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <clipPath id="dlUpperHalf">
          <rect x="0" y="0" width={W} height={mid} />
        </clipPath>
        <clipPath id="dlLowerHalf">
          <rect x="0" y={mid} width={W} height={mid} />
        </clipPath>

        <path d={areaPath} fill="#e5e3ec" opacity="0.85" clipPath="url(#dlUpperHalf)" />
        <path d={areaPath} fill="#000000" opacity="0.55" clipPath="url(#dlLowerHalf)" />
        <line x1="0" y1={mid} x2={W} y2={mid} style={{ stroke: "color-mix(in srgb, var(--cx-accent) 50%, transparent)" }} strokeWidth="1" />
        <path d={linePath} fill="none" style={{ stroke: "var(--cx-accent)" }} strokeWidth="1.4" />

        {markers.map(({ a, i }) => {
          const [x, y] = points[i + 1]; // +1: points[0] is the pre-game start position
          return <circle key={i} cx={x} cy={y} r="2.6" fill={QUALITY_COLOR[a.quality]} stroke="#0c0c10" strokeWidth="1" />;
        })}
      </svg>
    </div>
  );
}
