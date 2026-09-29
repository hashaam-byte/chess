"use client";

import type { BotTierKey } from "@/lib/bot";

export type BotMood = "idle" | "hover" | "win" | "lose";

// Per-tier identity: body colours, brow angle (negative = worried, positive =
// stern) and resting smile curve. Colours are fixed on purpose, like the
// player avatars, so a bot is recognisable whatever accent the user picked.
export const BOT_LOOK: Record<BotTierKey, { c1: string; c2: string; brow: number; smile: number; eye: string }> = {
  pawn: { c1: "#6EE7B7", c2: "#047857", brow: -4, smile: 3, eye: "#0b0b0f" },
  knight: { c1: "#5EEAD4", c2: "#0F766E", brow: -1, smile: 7, eye: "#0b0b0f" },
  bishop: { c1: "#FCD34D", c2: "#B45309", brow: 1, smile: 5, eye: "#0b0b0f" },
  rook: { c1: "#FDBA74", c2: "#C2410C", brow: 3, smile: 0, eye: "#0b0b0f" },
  queen: { c1: "#FDA4AF", c2: "#BE123C", brow: 3, smile: 4, eye: "#0b0b0f" },
  king: { c1: "#C4B5FD", c2: "#6D28D9", brow: 4, smile: 0, eye: "#0b0b0f" },
  obsidianKing: { c1: "#3a3a48", c2: "#0a0a10", brow: 5, smile: -1, eye: "#C4B5FD" },
};

function Top({ tier, fill }: { tier: BotTierKey; fill: string }) {
  switch (tier) {
    case "pawn":
      return <circle cx="50" cy="27" r="11" fill={fill} />;
    case "knight":
      return <path d="M27 42 30 16 45 34ZM73 42 70 16 55 34Z" fill={fill} />;
    case "bishop":
      return (
        <>
          <path d="M50 10C67 23 67 35 62 38H38C33 35 33 23 50 10Z" fill={fill} />
          <circle cx="50" cy="8" r="4" fill={fill} />
        </>
      );
    case "rook":
      return (
        <>
          <rect x="24" y="20" width="12" height="18" fill={fill} />
          <rect x="44" y="20" width="12" height="18" fill={fill} />
          <rect x="64" y="20" width="12" height="18" fill={fill} />
        </>
      );
    case "queen":
      return <path d="M25 40 27 18 38 30 50 14 62 30 73 18 75 40Z" fill={fill} />;
    default: // king + obsidianKing
      return (
        <>
          <rect x="47" y="4" width="6" height="22" rx="2" fill={fill} />
          <rect x="40" y="10" width="20" height="6" rx="2" fill={fill} />
          <rect x="28" y="26" width="44" height="12" rx="4" fill={fill} />
        </>
      );
  }
}

export default function BotAvatar({
  tier,
  size = 72,
  mood = "idle",
  look = { x: 0, y: 0 },
}: {
  tier: BotTierKey;
  size?: number;
  mood?: BotMood;
  /** Pupil direction, each axis -1..1 — the page feeds this from the cursor. */
  look?: { x: number; y: number };
}) {
  const t = BOT_LOOK[tier];
  const id = `bot-${tier}`;
  const strong = tier === "queen" || tier === "king" || tier === "obsidianKing";
  const brow = mood === "lose" ? -5 : mood === "win" ? 0 : mood === "hover" && strong ? t.brow + 1 : t.brow;
  const smile = mood === "win" ? 13 : mood === "lose" ? -9 : mood === "hover" ? t.smile + 6 : t.smile;
  const glow = tier === "obsidianKing";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${tier} bot face`} className="flex-shrink-0">
      <style>{`
        .cx-eye { transform-box: fill-box; transform-origin: center; animation: cxBlink 5s infinite; }
        @keyframes cxBlink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.1); } }
        @media (prefers-reduced-motion: reduce) { .cx-eye { animation: none; } }
      `}</style>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.c1} />
          <stop offset="1" stopColor={t.c2} />
        </linearGradient>
        {glow && (
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        )}
      </defs>
      <Top tier={tier} fill={`url(#${id})`} />
      <rect x="20" y="34" width="60" height="52" rx="22" fill={`url(#${id})`} />
      {glow && <rect x="20" y="34" width="60" height="52" rx="22" fill="none" stroke="#A78BFA" strokeOpacity="0.5" strokeWidth="1.5" />}
      {[39, 61].map((cx) => (
        <g key={cx} className="cx-eye">
          {glow && <circle cx={cx} cy="57" r="9" fill={t.eye} filter={`url(#${id}-glow)`} />}
          <ellipse cx={cx} cy="57" rx="7.5" ry="8.5" fill={glow ? "#0a0a10" : "#fff"} />
          <circle cx={cx + look.x * 3} cy={57 + look.y * 3} r="4" fill={t.eye} />
        </g>
      ))}
      <path
        d={`M30 ${45 - brow} L47 ${45 + brow}M53 ${45 + brow} L70 ${45 - brow}`}
        stroke={glow ? "#A78BFA" : "rgba(17,17,22,0.85)"}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        style={{ transition: "d 180ms" }}
      />
      <path
        d={`M40 74 Q50 ${74 + smile} 60 74`}
        stroke={glow ? "#A78BFA" : "rgba(17,17,22,0.85)"}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        style={{ transition: "d 180ms" }}
      />
    </svg>
  );
}