"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
import BotAvatar, { BOT_LOOK, type BotMood } from "@/components/BotAvatar";
import { BOT_TIERS, BOT_TIER_ORDER, tierEloLabel, type BotTierKey } from "@/lib/bot";
import { getProfile, recordBotGameResult, getIncludeBotInStats, setIncludeBotInStats } from "@/lib/profile";

type Seat = "white" | "black";

const TIER_BLURB: Record<BotTierKey, string> = {
  pawn: "Just learning the moves. Makes plenty of mistakes.",
  knight: "Knows the basics, still hangs pieces.",
  bishop: "Solid fundamentals, misses tactics.",
  rook: "A club player. Punishes obvious errors.",
  queen: "Strong. Rarely gives anything away.",
  king: "Expert level. Precise and patient.",
  obsidianKing: "Full strength. Good luck.",
};

const TAUNT: Record<BotTierKey, string> = {
  pawn: "Is this piece allowed to move like that?",
  knight: "I love the little jumpy one!",
  bishop: "Watch the diagonals. I will.",
  rook: "Straight lines. No mercy.",
  queen: "Bring your best. I'll wait.",
  king: "Every move you make, I've seen.",
  obsidianKing: "Calculating your defeat.",
};

function BotCard({ tierKey, active, onPick }: { tierKey: BotTierKey; active: boolean; onPick: () => void }) {
  const t = BOT_TIERS[tierKey];
  const [hover, setHover] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const level = BOT_TIER_ORDER.indexOf(tierKey) + 1;
  const c = BOT_LOOK[tierKey];

  function track(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setLook({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
  }

  return (
    <button
      onClick={onPick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setLook({ x: 0, y: 0 }); }}
      onMouseMove={track}
      aria-pressed={active}
      className="cx-botcard relative rounded-2xl p-4 pt-5 text-left flex flex-col items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: active ? "color-mix(in srgb, var(--cx-accent) 14%, #111116)" : "#111116",
        border: `1px solid ${active ? "var(--cx-accent)" : "#23232c"}`,
        outlineColor: "var(--cx-accent-light)",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover || active ? `0 16px 36px -14px ${c.c1}66` : "none",
        transition: "transform 180ms, box-shadow 180ms, border-color 180ms",
      }}
    >
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[11px] pointer-events-none"
        style={{
          background: "#1b1b23",
          border: `1px solid ${c.c1}55`,
          color: "#F5F3F7",
          opacity: hover ? 1 : 0,
          transition: "opacity 150ms",
        }}
      >
        {TAUNT[tierKey]}
      </span>
      <BotAvatar tier={tierKey} size={84} mood={hover ? "hover" : "idle"} look={look} />
      <span className="font-serif font-semibold text-sm">{t.name}</span>
      <span className="text-xs tabular-nums" style={{ color: "var(--cx-accent-light)" }}>{tierEloLabel(t)}</span>
      <span className="flex gap-1" aria-label={`Level ${level} of ${BOT_TIER_ORDER.length}`}>
        {BOT_TIER_ORDER.map((k, i) => (
          <span key={k} className="h-1 w-3 rounded-full" style={{ background: i < level ? c.c1 : "#23232c" }} />
        ))}
      </span>
    </button>
  );
}

export default function BotGamePage() {
  const [tier, setTier] = useState<BotTierKey>("bishop");
  const [colorChoice, setColorChoice] = useState<Seat | "random">("random");
  // Read from localStorage after mount, not in the initial state — reading it
  // during render would make the server-rendered checkbox (always unchecked)
  // disagree with the client's first render and trigger a hydration warning.
  const [countInStats, setCountInStats] = useState(false);
  useEffect(() => {
    setCountInStats(getIncludeBotInStats());
  }, []);

  // Set once a game starts; null while on the setup screen.
  const [session, setSession] = useState<{ tier: BotTierKey; human: Seat; key: number } | null>(null);
  const [result, setResult] = useState<{ outcome: "win" | "loss" | "draw"; tier: BotTierKey } | null>(null);

  const profile = getProfile();
  const humanName = profile?.name || "You";

  function startGame() {
    const human: Seat = colorChoice === "random" ? (Math.random() < 0.5 ? "white" : "black") : colorChoice;
    setResult(null);
    setSession({ tier, human, key: Date.now() });
  }

  function handleResult(winner: "white" | "black" | "draw") {
    if (!session) return;
    const outcome = winner === "draw" ? "draw" : winner === session.human ? "win" : "loss";
    recordBotGameResult(outcome);
    setResult({ outcome, tier: session.tier });
  }

  function toggleCount(next: boolean) {
    setCountInStats(next);
    setIncludeBotInStats(next);
  }

  // ── Game screen ────────────────────────────────────────────────
  if (session) {
    const botName = `${BOT_TIERS[session.tier].name} Bot`;
    const whiteLabel = session.human === "white" ? humanName : botName;
    const blackLabel = session.human === "black" ? humanName : botName;
    const t = BOT_TIERS[session.tier];

    return (
      <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <SiteNav />
        <div className="w-full flex flex-col items-center p-6 sm:p-10">
          {result && (
            <div
              className="w-full rounded-xl px-4 py-3 mb-4 text-sm text-center"
              style={{
                maxWidth: 560,
                background: result.outcome === "loss" ? "rgba(244,63,94,0.08)" : "rgba(139,92,246,0.10)",
                border: `1px solid ${result.outcome === "loss" ? "rgba(244,63,94,0.3)" : "rgba(139,92,246,0.35)"}`,
                color: result.outcome === "loss" ? "#F43F5E" : "#F5F3F7",
              }}
            >
              {result.outcome === "loss" && `Lost to Bot: ${BOT_TIERS[result.tier].name} (${tierEloLabel(BOT_TIERS[result.tier])})`}
              {result.outcome === "win" && `Beat Bot: ${BOT_TIERS[result.tier].name} (${tierEloLabel(BOT_TIERS[result.tier])})`}
              {result.outcome === "draw" && `Drew with Bot: ${BOT_TIERS[result.tier].name} (${tierEloLabel(BOT_TIERS[result.tier])})`}
              <div className="text-[11px] mt-1" style={{ color: "#8f8a9c" }}>
                {countInStats ? "Counted toward your win/loss stats." : "Recorded separately — not counted toward your win/loss streak."}
              </div>
            </div>
          )}

          <div
            className="w-full rounded-2xl p-5 sm:p-8 flex flex-col items-center gap-4"
            style={{ maxWidth: 640, background: "rgba(255,255,255,0.02)", border: "1px solid #23232c" }}
          >
            <div className="flex items-center gap-3 text-xs" style={{ color: "#8f8a9c" }}>
              <BotAvatar
                tier={session.tier}
                size={44}
                mood={(result ? (result.outcome === "loss" ? "win" : result.outcome === "win" ? "lose" : "idle") : "idle") as BotMood}
              />
              <span>vs {t.name} Bot · {tierEloLabel(t)} · runs entirely on your device</span>
            </div>
            <GameBoard
              key={session.key}
              whiteLabel={whiteLabel}
              blackLabel={blackLabel}
              playAs={session.human}
              bot={{ tier: session.tier }}
              onResult={handleResult}
            />
            <button
              onClick={() => setSession(null)}
              className="text-xs px-4 py-1.5 rounded-full border transition"
              style={{ color: "#8f8a9c", borderColor: "#23232c" }}
            >
              New bot game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup screen ───────────────────────────────────────────────
  const sel = BOT_TIERS[tier];
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <style>{`@media (prefers-reduced-motion: reduce) { .cx-botcard { transition: none !important; transform: none !important; } }`}</style>
      <SiteNav />
      <div className="w-full max-w-5xl p-6 sm:p-10 grid gap-8 lg:grid-cols-[1fr_340px] items-start">
        <div>
          <h1 className="font-serif text-2xl mb-1">Pick your opponent</h1>
          <p className="text-sm mb-8" style={{ color: "#8f8a9c" }}>
            Seven bots, easiest to hardest. Works offline, and you can ask for a hint any time on your turn.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-7">
            {BOT_TIER_ORDER.map((key) => (
              <BotCard key={key} tierKey={key} active={tier === key} onPick={() => setTier(key)} />
            ))}
          </div>
          <p className="text-[11px] mt-6" style={{ color: "#5c5968" }}>
            Approximate strength, measured on Stockfish&apos;s own scale — not an official rating.
          </p>
        </div>

        <div
          className="rounded-2xl p-6 flex flex-col gap-6 lg:sticky lg:top-6"
          style={{ background: "#111116", border: "1px solid #23232c" }}
        >
          <div className="flex items-center gap-4">
            <BotAvatar tier={tier} size={72} />
            <div>
              <div className="font-serif text-lg font-semibold">{sel.name} Bot</div>
              <div className="text-xs" style={{ color: "#8f8a9c" }}>{TIER_BLURB[tier]}</div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#8f8a9c" }}>Play as</p>
            <div className="grid grid-cols-3 gap-2">
              {(["white", "random", "black"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColorChoice(c)}
                  aria-pressed={colorChoice === c}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition"
                  style={{
                    background: colorChoice === c ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${colorChoice === c ? "var(--cx-accent)" : "#23232c"}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" checked={countInStats} onChange={(e) => toggleCount(e.target.checked)} className="mt-0.5" />
            <span>
              Count bot games toward my win/loss stats
              <span className="block text-xs mt-0.5" style={{ color: "#8f8a9c" }}>
                Off by default. Bot results are always tracked separately and labeled as bot games either way.
              </span>
            </span>
          </label>

          <button
            onClick={startGame}
            className="w-full px-4 py-3 rounded-full text-sm font-semibold transition hover:brightness-110"
            style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
          >
            Play {sel.name} Bot
          </button>

          <Link href="/play" className="text-xs text-center hover:underline" style={{ color: "#8f8a9c" }}>
            ← Play a friend instead
          </Link>
        </div>
      </div>
    </div>
  );
}