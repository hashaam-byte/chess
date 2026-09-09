import { getSupabase } from "./supabase";
import { createBracket, type Bracket } from "./bracket";

export type TournamentVisibility = "open" | "closed";
export type TournamentStatus = "signup" | "active" | "completed";

export type Tournament = {
  id: string;
  name: string;
  description: string | null;
  visibility: TournamentVisibility;
  invitedNames: string[];
  startAt: string; // ISO
  timeControlMinutes: number | null;
  prizeText: string | null;
  prizeImageUrl: string | null;
  status: TournamentStatus;
  players: string[];
  rounds: Bracket;
};

export type Signup = { name: string; avatarId: string };

type TournamentRow = {
  id: string;
  name: string;
  description: string | null;
  visibility: TournamentVisibility;
  invited_names: string[];
  start_at: string;
  time_control_minutes: number | null;
  prize_text: string | null;
  prize_image_url: string | null;
  status: TournamentStatus;
  players: string[];
  rounds: Bracket;
};

function fromRow(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    invitedNames: row.invited_names ?? [],
    startAt: row.start_at,
    timeControlMinutes: row.time_control_minutes,
    prizeText: row.prize_text,
    prizeImageUrl: row.prize_image_url,
    status: row.status,
    players: row.players ?? [],
    rounds: row.rounds ?? [],
  };
}

export async function listTournaments(): Promise<Tournament[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from("tournaments").select("*").order("start_at", { ascending: true });
  if (error || !data) return [];
  return (data as TournamentRow[]).map(fromRow);
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return fromRow(data as TournamentRow);
}

export async function createTournament(input: {
  name: string;
  description?: string;
  visibility: TournamentVisibility;
  invitedNames?: string[];
  startAt: Date;
  timeControlMinutes?: number | null;
  prizeText?: string;
  prizeImageUrl?: string;
}): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: input.name,
      description: input.description ?? null,
      visibility: input.visibility,
      invited_names: input.invitedNames ?? [],
      start_at: input.startAt.toISOString(),
      time_control_minutes: input.timeControlMinutes ?? null,
      prize_text: input.prizeText ?? null,
      prize_image_url: input.prizeImageUrl ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function listSignups(tournamentId: string): Promise<Signup[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tournament_signups")
    .select("name, avatar_id")
    .eq("tournament_id", tournamentId)
    .order("joined_at", { ascending: true });
  if (error || !data) return [];
  return (data as { name: string; avatar_id: string }[]).map((r) => ({ name: r.name, avatarId: r.avatar_id }));
}

/** Returns false if the name is already taken, or the insert otherwise fails. */
export async function joinTournament(tournamentId: string, signup: Signup): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from("tournament_signups")
    .insert({ tournament_id: tournamentId, name: signup.name, avatar_id: signup.avatarId });
  return !error;
}

/**
 * If start_at has passed and the tournament is still in signup, builds the
 * bracket and flips it to active. The WHERE clause guards against two
 * people's browsers both triggering this at once — verified against a real
 * race in testing; only one write can win.
 */
export async function startTournamentIfDue(tournament: Tournament): Promise<Tournament> {
  if (tournament.status !== "signup") return tournament;
  if (new Date(tournament.startAt).getTime() > Date.now()) return tournament;

  const supabase = getSupabase();
  if (!supabase) return tournament;

  const signups = await listSignups(tournament.id);
  if (signups.length < 2) return tournament; // not enough players — stays open past start time

  const { players, rounds } = createBracket(signups.map((s) => s.name));

  const { data, error } = await supabase
    .from("tournaments")
    .update({ status: "active", players, rounds })
    .eq("id", tournament.id)
    .eq("status", "signup")
    .select("*")
    .maybeSingle();

  if (error || !data) {
    // Someone else's browser won the race — fetch whatever they wrote instead.
    return (await getTournament(tournament.id)) ?? tournament;
  }
  return fromRow(data as TournamentRow);
}

export async function saveRounds(tournamentId: string, rounds: Bracket): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("tournaments").update({ rounds }).eq("id", tournamentId);
}

export async function completeTournament(tournamentId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("tournaments").update({ status: "completed" }).eq("id", tournamentId);
}

export function subscribeToTournament(id: string, onChange: (t: Tournament) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`tournament:${id}`)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tournaments", filter: `id=eq.${id}` }, (payload) =>
      onChange(fromRow(payload.new as TournamentRow))
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToSignups(tournamentId: string, onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`tournament_signups:${tournamentId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tournament_signups", filter: `tournament_id=eq.${tournamentId}` },
      () => onChange()
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
