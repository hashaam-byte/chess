"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import AvatarIcon from "@/components/AvatarIcon";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { getProfile } from "@/lib/profile";
import { getChampion, type BracketMatch } from "@/lib/bracket";
import {
  getTournament,
  listSignups,
  joinTournament,
  startTournamentIfDue,
  subscribeToTournament,
  subscribeToSignups,
  type Tournament,
  type Signup,
} from "@/lib/tournamentStore";

export default function TournamentPage() {
  const params = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [joinName, setJoinName] = useState("");
  const [joinAvatar] = useState(() => getProfile()?.avatarId ?? AVATAR_PRESETS[0].id);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function refresh() {
    const t = await getTournament(params.id);
    if (!t) {
      setTournament(null);
      return;
    }
    const started = await startTournamentIfDue(t);
    setTournament(started);
    setSignups(await listSignups(params.id));
  }

  useEffect(() => {
    // Deferred to a microtask so the async refresh() call (and its
    // eventual setState calls) doesn't start synchronously inside the
    // effect body.
    queueMicrotask(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const unsubT = subscribeToTournament(params.id, (t) => setTournament(t));
    const unsubS = subscribeToSignups(params.id, () => listSignups(params.id).then(setSignups));
    return () => {
      unsubT();
      unsubS();
    };
  }, [params.id]);

  // Keep checking whether start time has passed while sitting on the signup screen.
  useEffect(() => {
    if (!tournament || tournament.status !== "signup") return;
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament?.status, params.id]);

  async function handleJoin(name: string) {
    setJoinError(null);
    const ok = await joinTournament(params.id, { name, avatarId: joinAvatar });
    if (ok) {
      setJoined(true);
      setSignups(await listSignups(params.id));
    } else {
      setJoinError("That name is already taken in this tournament.");
    }
  }

  if (tournament === undefined) return null;

  if (tournament === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07070A", color: "#F5F3F7" }}>
        <div className="text-center">
          <p className="text-sm mb-3" style={{ color: "#8f8a9c" }}>Tournament not found.</p>
          <Link href="/tournament" className="text-sm hover:underline" style={{ color: "var(--cx-accent)" }}>
            ← Back to tournaments
          </Link>
        </div>
      </div>
    );
  }

  const alreadyJoinedNames = new Set(signups.map((s) => s.name));
  const availableInvited = tournament.invitedNames.filter((n) => !alreadyJoinedNames.has(n));
  const champion = getChampion(tournament.rounds);

  return (
    <div className="min-h-screen" style={{ background: "#07070A", color: "#F5F3F7" }}>
      <SiteNav />
      <div className="px-6 sm:px-10 py-10 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <h1 className="font-serif font-semibold text-2xl sm:text-[28px] tracking-tight">{tournament.name}</h1>
          <span className="text-[11px] px-3 py-1 rounded-full capitalize" style={{ background: "rgba(255,255,255,0.05)", color: "#8f8a9c" }}>
            {tournament.status} · {tournament.visibility}
          </span>
        </div>
        <p className="text-sm mb-1" style={{ color: "#8f8a9c" }}>
          Starts {new Date(tournament.startAt).toLocaleString()}
          {tournament.timeControlMinutes && ` · ${tournament.timeControlMinutes} min per player, per game`}
        </p>
        {tournament.prizeText && (
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)", color: "var(--cx-accent-light)" }}>
            🏆 {tournament.prizeText}
          </div>
        )}

        {champion && (
          <div className="mt-6 px-5 py-3 rounded-2xl text-sm font-semibold" style={{ background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--cx-accent) 30%, transparent)", color: "var(--cx-accent)" }}>
            🏆 {champion} wins the tournament!
          </div>
        )}

        {tournament.status === "signup" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl p-5" style={{ background: "#111116", border: "1px solid #23232c" }}>
              <h2 className="text-sm font-semibold mb-3">{signups.length} joined so far</h2>
              {signups.length === 0 ? (
                <p className="text-xs" style={{ color: "#5c5968" }}>No one yet — be the first.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {signups.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <AvatarIcon avatarId={s.avatarId} size={24} />
                      <span className="text-sm">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#111116", border: "1px solid #23232c" }}>
              {joined ? (
                <p className="text-sm" style={{ color: "var(--cx-accent-light)" }}>
                  You&apos;re in! Come back when the tournament starts — pairings happen automatically.
                </p>
              ) : tournament.visibility === "closed" ? (
                <>
                  <h2 className="text-sm font-semibold mb-3">Which name is you?</h2>
                  {availableInvited.length === 0 ? (
                    <p className="text-xs" style={{ color: "#5c5968" }}>Everyone on the invite list has already joined.</p>
                  ) : (
                    <div className="flex flex-col gap-2 mb-3">
                      {availableInvited.map((n) => (
                        <button
                          key={n}
                          onClick={() => handleJoin(n)}
                          className="text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition"
                          style={{ border: "1px solid #23232c" }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-sm font-semibold mb-3">Join this tournament</h2>
                  <input
                    className="w-full mb-3 px-3 py-2 rounded-lg text-sm"
                    style={{ background: "#07070A", border: "1px solid #23232c", color: "#F5F3F7" }}
                    placeholder="Your name"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                  />
                  <button
                    onClick={() => joinName.trim() && handleJoin(joinName.trim())}
                    disabled={!joinName.trim()}
                    className="px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
                    style={{ background: "var(--cx-accent)", color: "#0b0b0f" }}
                  >
                    Join
                  </button>
                </>
              )}
              {joinError && <p className="text-xs mt-2" style={{ color: "#F43F5E" }}>{joinError}</p>}
            </div>
          </div>
        )}

        {tournament.status !== "signup" && (
          <div className="w-full overflow-x-auto mt-8">
            <div className="flex gap-8 pb-4" style={{ minWidth: tournament.rounds.length * 220 }}>
              {tournament.rounds.map((round, r) => (
                <div key={r} className="flex flex-col gap-4 justify-center" style={{ width: 200, flexShrink: 0 }}>
                  <div className="text-xs uppercase tracking-wider text-[#8f8a9c] text-center">
                    {r === tournament.rounds.length - 1 ? "Final" : `Round ${r + 1}`}
                  </div>
                  {round.map((match) => (
                    <MatchCard key={match.id} tournamentId={tournament.id} match={match} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ tournamentId, match }: { tournamentId: string; match: BracketMatch }) {
  const ready = match.playerA && match.playerB && !match.winner;
  return (
    <div className="rounded-xl p-3 text-sm" style={{ background: match.winner ? "color-mix(in srgb, var(--cx-accent) 5%, transparent)" : "rgba(255,255,255,0.02)", border: `1px solid ${match.winner ? "color-mix(in srgb, var(--cx-accent) 20%, transparent)" : "rgba(255,255,255,0.06)"}` }}>
      <div style={{ color: match.winner === match.playerA ? "var(--cx-accent)" : "#c8c6d0", fontWeight: match.winner === match.playerA ? 600 : 400 }}>{match.playerA ?? "TBD"}</div>
      <div className="my-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div style={{ color: match.winner === match.playerB ? "var(--cx-accent)" : "#c8c6d0", fontWeight: match.winner === match.playerB ? 600 : 400 }}>{match.playerB ?? "TBD"}</div>
      {match.bye && <div className="text-[10px] text-[#5c5968] mt-2">Bye — advances automatically</div>}
      {ready && (
        <Link
          href={`/tournament/${tournamentId}/match/${match.id}`}
          className="mt-2 block text-center w-full px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: "var(--cx-accent)", color: "#111116" }}
        >
          Play match
        </Link>
      )}
    </div>
  );
}
