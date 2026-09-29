"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { createTournament, listTournaments, type Tournament } from "@/lib/tournamentStore";

const COVERS = ["weekend-blitz", "rising-knights", "grand-arena", "night-of-kings"];

/** Faster time controls get the "blitz" art, longer ones the grander covers. */
function coverFor(t: Tournament): string {
  const m = t.timeControlMinutes ?? 10;
  const i = m <= 5 ? 0 : m <= 10 ? 1 : m <= 15 ? 2 : 3;
  return `/images/tournaments/${COVERS[i]}.webp`;
}

const STATUS_STYLE: Record<Tournament["status"], { label: string; color: string }> = {
  signup: { label: "Signups open", color: "#6EE7B7" },
  active: { label: "Live", color: "#F43F5E" },
  completed: { label: "Finished", color: "#8f8a9c" },
};

function formatStart(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function TournamentListPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"open" | "closed">("open");
  const [invitedNamesInput, setInvitedNamesInput] = useState("");
  const [startAt, setStartAt] = useState("");
  const [timeControl, setTimeControl] = useState("10");
  const [prizeText, setPrizeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    listTournaments().then(setTournaments);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the tournament a name.");
      return;
    }
    if (!startAt) {
      setError("Pick a start time.");
      return;
    }
    const start = new Date(startAt);
    if (isNaN(start.getTime())) {
      setError("That start time doesn't look right.");
      return;
    }

    const invitedNames =
      visibility === "closed"
        ? Array.from(new Set(invitedNamesInput.split("\n").map((n) => n.trim()).filter(Boolean)))
        : [];
    if (visibility === "closed" && invitedNames.length < 2) {
      setError("List at least 2 invited names for a closed tournament.");
      return;
    }

    setCreating(true);
    try {
      const id = await createTournament({
        name: name.trim(),
        visibility,
        invitedNames,
        startAt: start,
        timeControlMinutes: timeControl ? parseInt(timeControl, 10) : null,
        prizeText: prizeText.trim() || undefined,
      });
      if (!id) {
        setError("Couldn't create the tournament — check your connection and try again.");
        setCreating(false);
        return;
      }
      router.push(`/tournament/${id}`);
    } catch {
      setError("Couldn't create the tournament — check your connection and try again.");
      setCreating(false);
    }
  }

  const sorted = [...tournaments].sort((a, b) => {
    const rank = { active: 0, signup: 1, completed: 2 } as const;
    return rank[a.status] - rank[b.status] || new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
  });

  return (
    <div className="dl-page min-h-screen flex flex-col items-center">
      <style>{`
        .dl-page { background: radial-gradient(ellipse 700px 420px at 50% -8%, color-mix(in srgb, var(--cx-accent) 10%, transparent), transparent 65%), #07070A; color: #F5F3F7; }
        .dl-input { background: #0c0c10; border: 1px solid #23232c; border-radius: 10px; padding: 10px 14px; color: #F5F3F7; font-size: 14px; width: 100%; }
        .dl-input:focus { outline: none; border-color: var(--cx-accent); }
        .dl-input::placeholder { color: #5c5968; }
        .dl-toggle { padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 150ms; }
        .dl-tcard { transition: border-color 200ms, transform 200ms; }
        .dl-tcard:hover { border-color: color-mix(in srgb, var(--cx-accent) 45%, transparent) !important; transform: translateY(-2px); }
      `}</style>

      <SiteNav />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <div className="w-full flex items-end justify-between gap-4 mb-8" style={{ maxWidth: 1000 }}>
          <div>
            <h1 className="font-serif font-semibold text-2xl sm:text-[28px] tracking-tight mb-2">Tournaments</h1>
            <p className="text-sm text-[#8f8a9c]">
              Open tournaments let anyone add their name. Closed ones only let pre-invited names join.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0"
            style={{ background: showForm ? "#0c0c10" : "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: showForm ? "#8f8a9c" : "#0b0b0f", border: showForm ? "1px solid #23232c" : "none" }}
          >
            {showForm ? "Close" : "＋ New tournament"}
          </button>
        </div>

        <div className="w-full grid gap-8" style={{ maxWidth: 1000 }}>
          {showForm && (
            <form onSubmit={handleCreate} className="rounded-2xl p-5 sm:p-6 flex flex-col gap-3 mx-auto w-full" style={{ maxWidth: 640, background: "rgba(255,255,255,0.02)", border: "1px solid color-mix(in srgb, var(--cx-accent) 12%, transparent)" }}>
              <h2 className="font-serif font-semibold text-lg mb-1">New tournament</h2>

              <input className="dl-input" placeholder="Tournament name" value={name} onChange={(e) => setName(e.target.value)} />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility("open")}
                  className="dl-toggle"
                  style={{ background: visibility === "open" ? "var(--cx-accent)" : "#0c0c10", color: visibility === "open" ? "#0b0b0f" : "#8f8a9c", border: "1px solid #23232c" }}
                >
                  Open signup
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("closed")}
                  className="dl-toggle"
                  style={{ background: visibility === "closed" ? "var(--cx-accent)" : "#0c0c10", color: visibility === "closed" ? "#0b0b0f" : "#8f8a9c", border: "1px solid #23232c" }}
                >
                  Closed / invite-only
                </button>
              </div>

              {visibility === "closed" && (
                <textarea
                  className="dl-input"
                  placeholder={"Invited names, one per line\ne.g.\nAlice\nBob\nCarol\nDave"}
                  rows={5}
                  value={invitedNamesInput}
                  onChange={(e) => setInvitedNamesInput(e.target.value)}
                />
              )}

              <label className="text-xs font-medium mt-1" style={{ color: "#c8c6d0" }}>Start time</label>
              <input type="datetime-local" className="dl-input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />

              <label className="text-xs font-medium mt-1" style={{ color: "#c8c6d0" }}>Time per player, per game (minutes)</label>
              <input type="number" min="1" className="dl-input" value={timeControl} onChange={(e) => setTimeControl(e.target.value)} />

              <label className="text-xs font-medium mt-1" style={{ color: "#c8c6d0" }}>Prize (optional, shown as text for now)</label>
              <input className="dl-input" placeholder="e.g. $50 gift card, or bragging rights" value={prizeText} onChange={(e) => setPrizeText(e.target.value)} />

              {error && <p className="text-xs text-[#F43F5E]">{error}</p>}

              <button
                type="submit"
                disabled={creating}
                className="mt-2 px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--cx-accent-light), var(--cx-accent))", color: "#0b0b0f" }}
              >
                {creating ? "Creating…" : "Create tournament"}
              </button>
            </form>
          )}

          {sorted.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "#111116", border: "1px solid #23232c" }}>
              <p className="text-sm mb-4" style={{ color: "#8f8a9c" }}>No tournaments yet. Be the first to set one up.</p>
              <button onClick={() => setShowForm(true)} className="px-5 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--cx-accent)", color: "#0b0b0f" }}>
                ＋ New tournament
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((t) => {
                const st = STATUS_STYLE[t.status];
                return (
                  <Link key={t.id} href={`/tournament/${t.id}`} className="dl-tcard rounded-2xl overflow-hidden block" style={{ background: "#111116", border: "1px solid #23232c", color: "#F5F3F7" }}>
                    <div className="relative" style={{ height: 150 }}>
                      <Image src={coverFor(t)} alt="" fill sizes="(max-width: 640px) 100vw, 320px" style={{ objectFit: "cover" }} />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 35%, #111116)" }} />
                      <span className="absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(7,7,10,0.7)", color: st.color, backdropFilter: "blur(4px)" }}>
                        {st.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-5 pt-2">
                      <h3 className="font-serif font-semibold text-lg truncate">{t.name}</h3>
                      <p className="text-xs mt-1" style={{ color: "#8f8a9c" }}>{formatStart(t.startAt)}</p>
                      <div className="flex flex-wrap gap-2 mt-3 text-[11px]" style={{ color: "#c8c6d0" }}>
                        {t.timeControlMinutes && <span className="px-2 py-1 rounded-md" style={{ background: "#0c0c10", border: "1px solid #1a1a1f" }}>{t.timeControlMinutes} min</span>}
                        <span className="px-2 py-1 rounded-md capitalize" style={{ background: "#0c0c10", border: "1px solid #1a1a1f" }}>{t.visibility}</span>
                        <span className="px-2 py-1 rounded-md" style={{ background: "#0c0c10", border: "1px solid #1a1a1f" }}>{t.players.length} player{t.players.length === 1 ? "" : "s"}</span>
                      </div>
                      {t.prizeText && <p className="text-xs mt-3 truncate" style={{ color: "var(--cx-accent-light)" }}>🏆 {t.prizeText}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}