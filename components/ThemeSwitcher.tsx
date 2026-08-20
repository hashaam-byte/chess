"use client";

import { useState } from "react";
import { useTheme, ACCENT_PRESETS } from "./ThemeProvider";

export default function ThemeSwitcher() {
  const { theme, setPreset, setCustomAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div
          className="absolute bottom-14 right-0 rounded-2xl p-4 w-64"
          style={{
            background: "#111116",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 24px 48px -16px rgba(0,0,0,0.7)",
          }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: "#F5F3F7" }}>
            Accent color
          </p>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setPreset(p)}
                title={p.name}
                className="w-7 h-7 rounded-full flex-shrink-0 transition-transform hover:scale-110"
                style={{
                  background: p.accent,
                  boxShadow: theme.accent === p.accent ? `0 0 0 2px #111116, 0 0 0 4px ${p.accent}` : "none",
                }}
                aria-label={`Use ${p.name} accent`}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px]" style={{ color: "#8f8a9c" }}>
            Custom
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => setCustomAccent(e.target.value)}
              className="w-7 h-7 rounded-md border-0 bg-transparent cursor-pointer"
            />
            <span className="tabular-nums" style={{ color: "#c8c6d0" }}>
              {theme.accent}
            </span>
          </label>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change accent color"
        className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-105"
        style={{
          background: `linear-gradient(155deg, var(--cx-accent-light), var(--cx-accent-dark))`,
          boxShadow: "0 8px 24px -8px var(--cx-accent)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="#fff" />
          <circle cx="17.5" cy="10.5" r=".5" fill="#fff" />
          <circle cx="8.5" cy="7.5" r=".5" fill="#fff" />
          <circle cx="6.5" cy="12.5" r=".5" fill="#fff" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c1.9 0 3.6-1.7 3.6-3.6C21 6.7 17 2 12 2z" />
        </svg>
      </button>
    </div>
  );
}
