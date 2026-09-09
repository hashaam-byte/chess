"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { createTournament, listTournaments, type Tournament } from "@/lib/tournamentStore";

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

  return (
    <div className="dl-page min-h-screen flex flex-col items-center">
      <style>{`
        .dl-page { background: radial-gradient(ellipse 700px 420px at 50% -8%, color-mix(in srgb, var(--cx-accent) 10%, transparent), transparent 65%), #07070A; color: #F5F3F7; }
        .dl-input { background: #0c0c10; border: 1px solid #23232c; border-radius: 10px; padding: 10px 14px; color: #F5F3F7; font-size: 14px; width: 100%; }
        .dl-input:focus { outline: none; border-color: var(--cx-accent); }
        .dl-input::placeholder { color: #5c5968; }
        .dl-toggle { padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 150ms; }
      `}</style>

      <SiteNav />

      <div className="w-full flex flex-col items-center p-6 sm:p-10">
        <h1 className="font-serif font-semibold text-2xl sm:text-[28px] tracking-tight mb-2" style={{ maxWidth: 640, width: "100%" }}>
          Tournaments
        </h1>
        <p className="text-sm text-[#8f8a9c] mb-8" style={{ maxWidth: 640, width: "100%" }}>
          Open tournaments let anyone add their name. Closed ones only let pre-invited names join.
        </p>

        <div className="w-full grid gap-6" style={{ maxWidth: 640 }}>
          <form onSubmit={handleCreate} className="rounded-2xl p-5 sm:p-6 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid color-mix(in srgb, var(--cx-accent) 12%, transparent)" }}>
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

          {tournaments.length > 0 && (
            <div className="rounded-2xl p-5 sm:p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid color-mix(in srgb, var(--cx-accent) 12%, transparent)" }}>
              <h3 className="text-xs uppercase tracking-wider text-[#8f8a9c] mb-3">Upcoming &amp; running</h3>
              <div className="flex flex-col gap-2">
                {tournaments.map((t) => (
                  <Link key={t.id} href={`/tournament/${t.id}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#111116] transition">
                    <span className="text-sm text-[#c8c6d0]">{t.name}</span>
                    <span className="text-[11px] text-[#5c5968] capitalize">{t.status} · {t.visibility}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
