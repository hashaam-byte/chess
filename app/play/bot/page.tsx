"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
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
            <p className="text-xs" style={{ color: "#8f8a9c" }}>
              vs {t.name} Bot · {tierEloLabel(t)} · runs entirely on your device
            </p>
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
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div
          className="w-full rounded-2xl p-6 sm:p-8 flex flex-col gap-7"
          style={{ maxWidth: 480, background: "#111116", border: "1px solid #23232c" }}
        >
          <div>
            <h1 className="font-serif text-xl mb-1">Play the computer</h1>
            <p className="text-sm" style={{ color: "#8f8a9c" }}>
              Works offline. Ask for a hint any time on your turn.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#8f8a9c" }}>DIFFICULTY</p>
            <div className="flex flex-col gap-2">
              {BOT_TIER_ORDER.map((key) => {
                const t = BOT_TIERS[key];
                const active = tier === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTier(key)}
                    className="rounded-lg px-3 py-2.5 text-left transition flex items-center justify-between gap-3"
                    style={{
                      background: active ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? "var(--cx-accent)" : "#23232c"}`,
                    }}
                  >
                    <span>
                      <span className="text-sm font-semibold">{t.name}</span>
                      <span className="block text-xs mt-0.5" style={{ color: "#8f8a9c" }}>{TIER_BLURB[key]}</span>
                    </span>
                    <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--cx-accent-light)" }}>
                      {tierEloLabel(t)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] mt-3" style={{ color: "#5c5968" }}>
              Approximate strength, measured on Stockfish&apos;s own scale — not an official rating.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#8f8a9c" }}>PLAY AS</p>
            <div className="grid grid-cols-3 gap-2">
              {(["white", "random", "black"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColorChoice(c)}
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
            <input
              type="checkbox"
              checked={countInStats}
              onChange={(e) => toggleCount(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Count bot games toward my win/loss stats
              <span className="block text-xs mt-0.5" style={{ color: "#8f8a9c" }}>
                Off by default. Bot results are always tracked separately and labeled as bot games either way.
              </span>
            </span>
          </label>

          <button
            onClick={startGame}
            className="w-full px-4 py-3 rounded-full text-sm font-semibold transition"
            style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
          >
            Start game
          </button>

          <Link href="/play" className="text-xs text-center hover:underline" style={{ color: "#8f8a9c" }}>
            ← Play a friend instead
          </Link>
        </div>
      </div>
    </div>
  );
}