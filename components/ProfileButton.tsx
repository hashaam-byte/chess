"use client";

import { useState } from "react";
import AvatarIcon from "./AvatarIcon";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { getProfile, saveProfile, blankProfile, type Profile } from "@/lib/profile";

export default function ProfileButton() {
  const [profile, setProfile] = useState<Profile | null>(() => getProfile());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Profile>(() => getProfile() ?? blankProfile());

  function openEditor() {
    setProfile(getProfile()); // pick up any stats recorded since this button last rendered
    setDraft(getProfile() ?? blankProfile());
    setOpen(true);
  }

  function handleSave() {
    const trimmed = draft.name.trim();
    if (!trimmed) return;
    const next = { ...draft, name: trimmed };
    saveProfile(next);
    setProfile(next);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={openEditor}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-colors hover:bg-white/5"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <AvatarIcon avatarId={profile?.avatarId} size={26} />
        <span className="text-[13px] font-medium" style={{ color: profile ? "#F5F3F7" : "#8f8a9c" }}>
          {profile?.name || "Set up profile"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7,7,10,0.8)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-2xl p-6"
            style={{ maxWidth: 420, background: "#111116", border: "1px solid #23232c" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif font-semibold text-lg mb-1" style={{ color: "#F5F3F7" }}>
              Your profile
            </h2>
            <p className="text-xs mb-5" style={{ color: "#8f8a9c" }}>
              Stored on this device until you change or clear it — no account needed.
            </p>

            {profile && profile.stats.gamesPlayed > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-5">
                <StatCell label="Played" value={profile.stats.gamesPlayed} />
                <StatCell label="W / L / D" value={`${profile.stats.wins}/${profile.stats.losses}/${profile.stats.draws}`} small />
                <StatCell
                  label="Streak"
                  value={profile.stats.currentStreak === 0 ? "—" : `${profile.stats.currentStreak > 0 ? "+" : ""}${profile.stats.currentStreak}`}
                  accent={profile.stats.currentStreak > 0}
                  warn={profile.stats.currentStreak < 0}
                />
                <StatCell label="Best streak" value={profile.stats.bestWinStreak} />
              </div>
            )}

            <label className="block text-xs font-medium mb-1.5" style={{ color: "#c8c6d0" }}>
              Display name
            </label>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Alex"
              maxLength={24}
              className="w-full mb-5 px-3 py-2 rounded-lg text-sm"
              style={{ background: "#07070A", border: "1px solid #23232c", color: "#F5F3F7" }}
            />

            <label className="block text-xs font-medium mb-2" style={{ color: "#c8c6d0" }}>
              Avatar
            </label>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setDraft({ ...draft, avatarId: preset.id })}
                  className="rounded-full p-0.5 transition-transform hover:scale-110"
                  style={{
                    boxShadow: draft.avatarId === preset.id ? "0 0 0 2px #111116, 0 0 0 4px var(--cx-accent)" : "none",
                  }}
                  aria-label={`Choose ${preset.piece} avatar`}
                >
                  <AvatarIcon avatarId={preset.id} size={38} />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-medium px-3 py-2"
                style={{ color: "#8f8a9c" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!draft.name.trim()}
                className="px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCell({
  label,
  value,
  small,
  accent,
  warn,
}: {
  label: string;
  value: string | number;
  small?: boolean;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg py-2 px-1 text-center" style={{ background: "#07070A", border: "1px solid #1a1a1f" }}>
      <div
        className={small ? "text-xs font-semibold" : "text-sm font-semibold"}
        style={{ color: accent ? "var(--cx-accent-light)" : warn ? "#F43F5E" : "#F5F3F7" }}
      >
        {value}
      </div>
      <div className="text-[9px] mt-0.5" style={{ color: "#5c5968" }}>
        {label}
      </div>
    </div>
  );
}
