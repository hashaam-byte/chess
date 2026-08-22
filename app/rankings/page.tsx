"use client";

import { useEffect, useRef, useState } from "react";
import SiteNav from "../../components/SiteNav";
import { listPlayers, uploadAvatar, type Player } from "../../lib/players";

export default function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    listPlayers().then((p) => {
      setPlayers(p);
      setLoading(false);
    });
  }, []);

  async function handleAvatarPick(name: string, file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    try {
      const url = await uploadAvatar(name, file);
      if (!url) {
        setUploadError("Avatar uploads need a connected Supabase project — see .env.local.example.");
        return;
      }
      setPlayers((prev) => prev.map((p) => (p.name === name ? { ...p, avatarUrl: url } : p)));
    } catch {
      setUploadError("Upload failed. Check the 'avatars' storage bucket exists and is public.");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div className="w-full" style={{ maxWidth: 640 }}>
          <h1 className="font-serif font-semibold text-[26px] sm:text-[30px] tracking-tight mb-2">Rankings</h1>
          <p className="text-sm mb-2" style={{ color: "#8f8a9c" }}>
            Elo ratings from recorded games. Click an avatar to upload a new one.
          </p>
          {uploadError && <p className="text-xs mb-6" style={{ color: "#F43F5E" }}>{uploadError}</p>}
          {!uploadError && <div className="mb-8" />}

          {loading ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
              <p className="text-sm" style={{ color: "#8f8a9c" }}>Loading…</p>
            </div>
          ) : players.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
              <p className="text-sm" style={{ color: "#8f8a9c" }}>
                No rated games yet. Ratings appear here once tournament matches are played.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#111116", border: "1px solid #23232c" }}>
              {players.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderBottom: i === players.length - 1 ? "none" : "1px solid #1a1a1f" }}
                >
                  <span
                    className="w-6 text-sm font-semibold tabular-nums"
                    style={{ color: i < 3 ? "var(--cx-accent-light)" : "#5c5968" }}
                  >
                    {i + 1}
                  </span>

                  <button
                    onClick={() => fileInputs.current[p.name]?.click()}
                    className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden group"
                    style={{ background: "linear-gradient(155deg, var(--cx-accent-light), var(--cx-accent-dark))", color: "#111116" }}
                    title="Upload avatar"
                  >
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, domain varies per project
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      p.name.slice(0, 1).toUpperCase()
                    )}
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </span>
                    <input
                      ref={(el) => { fileInputs.current[p.name] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatarPick(p.name, e.target.files?.[0])}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px]" style={{ color: "#5c5968" }}>
                      {p.games} game{p.games === 1 ? "" : "s"} · {p.wins}W {p.losses}L {p.draws}D
                    </div>
                  </div>
                  <span className="text-base font-semibold tabular-nums" style={{ color: "var(--cx-accent-light)" }}>
                    {p.rating}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
