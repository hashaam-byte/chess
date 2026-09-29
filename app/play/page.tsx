"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import GameBoard from "@/components/GameBoard";
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

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div
          className="w-full rounded-2xl p-6 sm:p-8 flex flex-col gap-8"
          style={{ maxWidth: 480, background: "#111116", border: "1px solid #23232c" }}
        >
          <div>
            <h1 className="font-serif text-xl mb-1">New game</h1>
            <p className="text-sm" style={{ color: "#8f8a9c" }}>Set the time control and pick your side.</p>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#8f8a9c" }}>TIME CONTROL</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.keys(TIME_PRESETS) as (keyof typeof TIME_PRESETS)[]).map((key) => {
                const preset = TIME_PRESETS[key];
                const active = selection === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelection(key)}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-left transition"
                    style={{
                      background: active ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? "var(--cx-accent)" : "#23232c"}`,
                    }}
                  >
                    {PRESET_LABELS[key]}
                    <div className="text-xs font-normal mt-0.5" style={{ color: "#8f8a9c" }}>
                      {preset.minutes}+{preset.increment}
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setSelection("custom")}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-left transition"
                style={{
                  background: selection === "custom" ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selection === "custom" ? "var(--cx-accent)" : "#23232c"}`,
                }}
              >
                Custom
              </button>
              <button
                onClick={() => setSelection("untimed")}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-left transition"
                style={{
                  background: selection === "untimed" ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selection === "untimed" ? "var(--cx-accent)" : "#23232c"}`,
                }}
              >
                Untimed
              </button>
            </div>

            {selection === "custom" && (
              <div className="flex gap-3 mt-2">
                <label className="flex-1 text-xs" style={{ color: "#8f8a9c" }}>
                  Minutes
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #23232c", color: "#F5F3F7" }}
                  />
                </label>
                <label className="flex-1 text-xs" style={{ color: "#8f8a9c" }}>
                  Increment (sec)
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={customIncrement}
                    onChange={(e) => setCustomIncrement(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #23232c", color: "#F5F3F7" }}
                  />
                </label>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: "#8f8a9c" }}>PLAY AS</p>
            <div className="grid grid-cols-3 gap-2">
              {(["white", "random", "black"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold capitalize transition"
                  style={{
                    background: color === c ? "rgba(139,92,246,0.14)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${color === c ? "var(--cx-accent)" : "#23232c"}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full px-4 py-3 rounded-full text-sm font-semibold transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
          >
            {creating ? "Setting up…" : "Create game"}
          </button>

          <a href="/play/bot" className="text-xs text-center hover:underline" style={{ color: "#8f8a9c" }}>
            Or play the computer →
          </a>
        </div>
      </div>
    </div>
  );
}