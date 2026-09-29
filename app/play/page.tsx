"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import Link from "next/link";
import GameBoard from "@/components/GameBoard";
import BotAvatar from "@/components/BotAvatar";
import { getProfile } from "@/lib/profile";
import { createLiveGame, getSupabaseConfigured, TIME_PRESETS, type CreateGameOptions, type Seat } from "@/lib/games";
import { claimSeat } from "@/lib/localIdentity";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const PRESET_LABELS: Record<keyof typeof TIME_PRESETS, string> = {
  bullet: "Bullet",
  blitz: "Blitz",
  rapid: "Rapid",
  classical: "Classical",
};

type Selection = keyof typeof TIME_PRESETS | "custom" | "untimed";

const PRESET_BLURB: Record<keyof typeof TIME_PRESETS, string> = {
  bullet: "Lightning fast",
  blitz: "Quick and sharp",
  rapid: "Room to think",
  classical: "Slow and deep",
};

/** Ring showing how much time a control gives, on a 0–30 minute scale. */
function ClockRing({ minutes, label }: { minutes: number | null; label?: string }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const frac = minutes === null ? 1 : Math.max(0.06, Math.min(1, minutes / 30));
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="#23232c" strokeWidth="3" />
      <circle
        cx="20" cy="20" r={r} fill="none" stroke="var(--cx-accent-light)" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${circ * frac} ${circ}`} transform="rotate(-90 20 20)"
        strokeOpacity={minutes === null ? 0.35 : 1}
      />
      <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="#F5F3F7">
        {label ?? (minutes === null ? "∞" : minutes)}
      </text>
    </svg>
  );
}

function SideDot({ side }: { side: Seat | "random" }) {
  const fill = side === "white" ? "#F5F3F7" : side === "black" ? "#15151b" : "url(#cx-half)";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <defs>
        <linearGradient id="cx-half" x1="0" y1="0" x2="1" y2="0">
          <stop offset="50%" stopColor="#F5F3F7" />
          <stop offset="50%" stopColor="#15151b" />
        </linearGradient>
      </defs>
      <circle cx="14" cy="14" r="11" fill={fill} stroke="#5c5968" strokeWidth="1.5" />
    </svg>
  );
}

export default function PlayPage() {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>("blitz");
  const [customMinutes, setCustomMinutes] = useState(15);
  const [customIncrement, setCustomIncrement] = useState(10);
  const [color, setColor] = useState<Seat | "random">("random");
  const [creating, setCreating] = useState(false);
  const [fallbackLocal, setFallbackLocal] = useState(false);
  const [createError, setCreateError] = useState(false);

  async function handleCreate() {
    setCreating(true);
    const profile = getProfile();

    const options: CreateGameOptions =
      selection === "untimed"
        ? { color, timeMinutes: null, timeIncrement: 0 }
        : selection === "custom"
        ? { color, timeMinutes: customMinutes, timeIncrement: customIncrement }
        : { color, timeMinutes: TIME_PRESETS[selection].minutes, timeIncrement: TIME_PRESETS[selection].increment };

    const created = await createLiveGame(
      { name: profile?.name || "Player 1", avatarId: profile?.avatarId ?? "violet-king" },
      START_FEN,
      options
    );

    if (created) {
      claimSeat(created.id, created.seat);
      router.replace(`/play/${created.id}`);
      return;
    }

    setCreating(false);
    if (getSupabaseConfigured()) {
      // Supabase IS set up, so this wasn't a "no project connected" case —
      // something about the request itself was rejected (commonly: a
      // migration that adds a column this insert relies on hasn't been run
      // yet). Say so plainly instead of quietly starting local play, which
      // would hide a real, fixable problem.
      setCreateError(true);
    } else {
      setFallbackLocal(true);
    }
  }

  if (createError) {
    return (
      <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <SiteNav />
        <div className="w-full flex flex-col items-center p-6 sm:p-10">
          <div
            className="w-full rounded-2xl p-6 text-sm"
            style={{ maxWidth: 480, background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.3)", color: "#F5F3F7" }}
          >
            <p className="font-semibold mb-2" style={{ color: "#F43F5E" }}>Couldn&apos;t create the game.</p>
            <p style={{ color: "#c9c5d1" }}>
              Supabase is connected, but the request was rejected. Open the browser console for the exact error —
              the most common cause is <code>migration_time_controls.sql</code> not having been run against this
              project yet.
            </p>
            <button
              onClick={() => setCreateError(false)}
              className="mt-4 text-xs px-4 py-1.5 rounded-full border"
              style={{ color: "#8f8a9c", borderColor: "#23232c" }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fallbackLocal) {
    return (
      <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <SiteNav />
        <div className="w-full flex flex-col items-center p-6 sm:p-10">
          <p className="text-xs mb-6 text-center max-w-sm" style={{ color: "#5c5968" }}>
            No Supabase project connected, so this is local pass-and-play only — see .env.local.example to enable
            real multiplayer and Watch.
          </p>
          <div
            className="w-full rounded-2xl p-5 sm:p-8 flex flex-col items-center"
            style={{ maxWidth: 640, background: "rgba(255,255,255,0.02)", border: "1px solid #23232c" }}
          >
            <GameBoard whiteLabel={getProfile()?.name || "Player 1"} blackLabel="Player 2" />
          </div>
        </div>
      </div>
    );
  }

  const presetKeys = Object.keys(TIME_PRESETS) as (keyof typeof TIME_PRESETS)[];
  const summaryTime =
    selection === "untimed" ? "No clock"
    : selection === "custom" ? `${customMinutes}+${customIncrement}`
    : `${PRESET_LABELS[selection]} · ${TIME_PRESETS[selection].minutes}+${TIME_PRESETS[selection].increment}`;

  const card = (active: boolean): React.CSSProperties => ({
    background: active ? "color-mix(in srgb, var(--cx-accent) 14%, #111116)" : "#111116",
    border: `1px solid ${active ? "var(--cx-accent)" : "#23232c"}`,
    outlineColor: "var(--cx-accent-light)",
  });

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <style>{`
        .cx-opt { transition: transform 160ms, border-color 160ms, box-shadow 160ms; }
        .cx-opt:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -16px color-mix(in srgb, var(--cx-accent) 70%, transparent); }
        .cx-opt:focus-visible { outline: 2px solid; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .cx-opt { transition: none; } .cx-opt:hover { transform: none; } }
      `}</style>
      <SiteNav />
      <div className="w-full max-w-5xl p-6 sm:p-10 grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <div className="flex flex-col gap-9">
          <div>
            <h1 className="font-serif font-semibold text-2xl sm:text-3xl mb-1">Start a game</h1>
            <p className="text-sm" style={{ color: "#8f8a9c" }}>
              Pick how long you get, choose your side, and share the link with a friend.
            </p>
          </div>

          <section>
            <h2 className="text-sm font-semibold mb-3">How long do you want to play?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presetKeys.map((key) => {
                const p = TIME_PRESETS[key];
                return (
                  <button key={key} onClick={() => setSelection(key)} aria-pressed={selection === key}
                    className="cx-opt rounded-xl p-4 text-left flex items-center gap-3" style={card(selection === key)}>
                    <ClockRing minutes={p.minutes} />
                    <span>
                      <span className="block text-sm font-semibold">{PRESET_LABELS[key]}</span>
                      <span className="block text-xs tabular-nums" style={{ color: "var(--cx-accent-light)" }}>{p.minutes}+{p.increment}</span>
                      <span className="block text-[11px]" style={{ color: "#8f8a9c" }}>{PRESET_BLURB[key]}</span>
                    </span>
                  </button>
                );
              })}
              <button onClick={() => setSelection("custom")} aria-pressed={selection === "custom"}
                className="cx-opt rounded-xl p-4 text-left flex items-center gap-3" style={card(selection === "custom")}>
                <ClockRing minutes={customMinutes} />
                <span>
                  <span className="block text-sm font-semibold">Custom</span>
                  <span className="block text-[11px]" style={{ color: "#8f8a9c" }}>Set your own clock</span>
                </span>
              </button>
              <button onClick={() => setSelection("untimed")} aria-pressed={selection === "untimed"}
                className="cx-opt rounded-xl p-4 text-left flex items-center gap-3" style={card(selection === "untimed")}>
                <ClockRing minutes={null} />
                <span>
                  <span className="block text-sm font-semibold">Untimed</span>
                  <span className="block text-[11px]" style={{ color: "#8f8a9c" }}>Take all the time you need</span>
                </span>
              </button>
            </div>

            {selection === "custom" && (
              <div className="flex gap-3 mt-3">
                <label className="flex-1 text-xs" style={{ color: "#8f8a9c" }}>
                  Minutes
                  <input type="number" min={1} max={180} value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #23232c", color: "#F5F3F7" }} />
                </label>
                <label className="flex-1 text-xs" style={{ color: "#8f8a9c" }}>
                  Increment (sec)
                  <input type="number" min={0} max={60} value={customIncrement}
                    onChange={(e) => setCustomIncrement(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #23232c", color: "#F5F3F7" }} />
                </label>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-3">Which side?</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["white", "random", "black"] as const).map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-pressed={color === c}
                  className="cx-opt rounded-xl p-4 flex flex-col items-center gap-2 text-sm font-semibold capitalize" style={card(color === c)}>
                  <SideDot side={c} />
                  {c}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ background: "#111116", border: "1px solid #23232c" }}>
            <div>
              <p className="text-xs mb-1" style={{ color: "#8f8a9c" }}>Your game</p>
              <p className="font-serif text-lg font-semibold">{summaryTime}</p>
              <p className="text-sm capitalize" style={{ color: "#c9c5d1" }}>
                {color === "random" ? "Random side" : `Playing ${color}`}
              </p>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-4 py-3 rounded-full text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))",
                color: "#0b0b0f",
                boxShadow: "0 12px 32px -12px color-mix(in srgb, var(--cx-accent) 60%, transparent)",
              }}
            >
              {creating ? "Setting up…" : "Create game"}
            </button>
          </div>

          <Link
            href="/play/bot"
            className="cx-opt rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "#111116", border: "1px solid #23232c" }}
          >
            <span className="flex -space-x-3">
              {(["pawn", "bishop", "queen", "obsidianKing"] as const).map((k) => (
                <span key={k} className="rounded-full" style={{ background: "#111116" }}>
                  <BotAvatar tier={k} size={40} />
                </span>
              ))}
            </span>
            <span>
              <span className="block text-sm font-semibold">Play the computer</span>
              <span className="block text-xs" style={{ color: "#8f8a9c" }}>Seven bots, no waiting</span>
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}