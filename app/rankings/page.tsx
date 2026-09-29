"use client";

import { useEffect, useRef, useState } from "react";
import SiteNav from "../../components/SiteNav";
import PlayerAvatar from "../../components/PlayerAvatar";
import { getProfile } from "../../lib/profile";
import { listPlayers, uploadAvatar, type Player } from "../../lib/players";

const PODIUM = [
  { place: 2, height: 96, color: "#CBD5E1" },
  { place: 1, height: 132, color: "#FCD34D" },
  { place: 3, height: 76, color: "#FDBA74" },
];

export default function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    listPlayers().then((p) => {
      setMyName(getProfile()?.name ?? null);
      setPlayers(p);
      setLoading(false);
    });
  }, []);

  async function handleAvatarPick(file: File | undefined) {
    if (!file || !myName) return;
    setUploadError(null);
    try {
      const url = await uploadAvatar(myName, file);
      if (!url) {
        setUploadError("Avatar uploads need a connected Supabase project — see .env.local.example.");
        return;
      }
      setPlayers((prev) => prev.map((p) => (p.name === myName ? { ...p, avatarUrl: url } : p)));
    } catch {
      setUploadError("Upload failed. Check the 'avatars' storage bucket exists and is public.");
    }
  }

  const top3 = players.slice(0, 3);
  const rest = players.slice(top3.length >= 3 ? 3 : 0);
  const showPodium = top3.length === 3;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 800px 420px at 50% -6%, color-mix(in srgb, var(--cx-accent) 14%, transparent), transparent 65%), #07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarPick(e.target.files?.[0])} />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div className="w-full" style={{ maxWidth: 680 }}>
          <h1 className="font-serif font-semibold text-[26px] sm:text-[30px] tracking-tight mb-2">Rankings</h1>
          <p className="text-sm mb-8" style={{ color: "#8f8a9c" }}>
            Elo ratings from tournament matches. Everyone starts at 1200.
            {myName && <> Click your own avatar to upload a photo.</>}
          </p>
          {uploadError && <p className="text-xs mb-6" style={{ color: "#F43F5E" }}>{uploadError}</p>}

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
            <>
              {showPodium && (
                <div className="grid grid-cols-3 gap-3 items-end mb-8">
                  {[top3[1], top3[0], top3[2]].map((p, i) => {
                    const slot = PODIUM[i];
                    const mine = p.name === myName;
                    return (
                      <div key={p.name} className="flex flex-col items-center min-w-0">
                        <button
                          onClick={() => mine && fileInput.current?.click()}
                          disabled={!mine}
                          title={mine ? "Upload avatar" : undefined}
                          className="rounded-full p-1 mb-2 disabled:cursor-default"
                          style={{ boxShadow: `0 0 0 2px ${slot.color}` }}
                        >
                          <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} avatarId={p.avatarId} size={slot.place === 1 ? 64 : 52} />
                        </button>
                        <div className="text-sm font-medium truncate max-w-full">{p.name}</div>
                        <div className="text-xs tabular-nums mb-2" style={{ color: slot.color }}>{p.rating}</div>
                        <div
                          className="w-full rounded-t-xl flex items-start justify-center pt-2 font-serif font-bold text-2xl"
                          style={{ height: slot.height, background: `linear-gradient(180deg, color-mix(in srgb, ${slot.color} 22%, transparent), transparent)`, border: "1px solid #23232c", borderBottom: "none", color: slot.color }}
                        >
                          {slot.place}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {rest.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: "#111116", border: "1px solid #23232c" }}>
                  {rest.map((p, i) => {
                    const rank = (showPodium ? 3 : 0) + i + 1;
                    const mine = p.name === myName;
                    return (
                      <div
                        key={p.name}
                        className="flex items-center gap-4 px-5 py-4"
                        style={{ borderBottom: i === rest.length - 1 ? "none" : "1px solid #1a1a1f", background: mine ? "color-mix(in srgb, var(--cx-accent) 8%, transparent)" : undefined }}
                      >
                        <span className="w-6 text-sm font-semibold tabular-nums" style={{ color: "#5c5968" }}>{rank}</span>
                        <button
                          onClick={() => mine && fileInput.current?.click()}
                          disabled={!mine}
                          title={mine ? "Upload avatar" : undefined}
                          className="flex-shrink-0 disabled:cursor-default"
                        >
                          <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} avatarId={p.avatarId} size={36} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name}{mine && <span className="ml-2 text-[10px]" style={{ color: "var(--cx-accent-light)" }}>YOU</span>}</div>
                          <div className="text-[11px]" style={{ color: "#5c5968" }}>
                            {p.games} game{p.games === 1 ? "" : "s"} · {p.wins}W {p.losses}L {p.draws}D
                          </div>
                        </div>
                        <span className="text-base font-semibold tabular-nums" style={{ color: "var(--cx-accent-light)" }}>{p.rating}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}