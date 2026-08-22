export type BracketMatch = {
  id: string;
  round: number; // 0-indexed
  slot: number; // position within the round
  playerA: string | null;
  playerB: string | null;
  winner: string | null;
  /** true when this match was decided by a bye rather than an actual game */
  bye: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  players: string[]; // seeded order, index 0 = seed 1 (highest rated)
  rounds: BracketMatch[][];
  createdAt: number;
};

/** Standard single-elimination seeding order (e.g. size 8 -> [1,8,4,5,2,7,3,6]). */
function seedOrder(size: number): number[] {
  let order = [1, 2];
  let current = 2;
  while (current < size) {
    const total = current * 2;
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed, total + 1 - seed);
    }
    order = next;
    current = total;
  }
  return order;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function createTournament(name: string, seededPlayers: string[]): Tournament {
  const bracketSize = nextPowerOfTwo(Math.max(2, seededPlayers.length));
  const order = seedOrder(bracketSize);
  const nameForSeed = (seed: number) => seededPlayers[seed - 1] ?? null;

  const roundCount = Math.log2(bracketSize);
  const rounds: BracketMatch[][] = Array.from({ length: roundCount }, () => []);

  // Round 0: pair up the seeded slots. A null opponent is a bye — the other
  // player advances automatically.
  for (let i = 0; i < bracketSize / 2; i++) {
    const playerA = nameForSeed(order[i * 2]);
    const playerB = nameForSeed(order[i * 2 + 1]);
    const bye = playerA === null || playerB === null;
    const winner = bye ? playerA ?? playerB : null;
    rounds[0].push({ id: `r0-m${i}`, round: 0, slot: i, playerA, playerB, winner, bye });
  }

  // Remaining rounds start empty; propagateWinners fills in anything decided by byes.
  for (let r = 1; r < roundCount; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r + 1);
    for (let i = 0; i < matchesInRound; i++) {
      rounds[r].push({ id: `r${r}-m${i}`, round: r, slot: i, playerA: null, playerB: null, winner: null, bye: false });
    }
  }

  return propagateWinners({
    id: crypto.randomUUID(),
    name,
    players: seededPlayers,
    rounds,
    createdAt: Date.now(),
  });
}

/** Pushes every decided winner into its slot in the next round. Pure — returns a new Tournament. */
function propagateWinners(t: Tournament): Tournament {
  const rounds = t.rounds.map((r) => r.map((m) => ({ ...m })));

  for (let r = 0; r < rounds.length - 1; r++) {
    for (let i = 0; i < rounds[r].length; i++) {
      const match = rounds[r][i];
      if (!match.winner) continue;
      const nextMatch = rounds[r + 1][Math.floor(i / 2)];
      if (i % 2 === 0) nextMatch.playerA = match.winner;
      else nextMatch.playerB = match.winner;
    }
  }

  // A newly-filled slot might itself complete a bye further along the bracket
  // (e.g. a walkover feeding into another walkover) — settle those too.
  for (let r = 1; r < rounds.length; r++) {
    for (const match of rounds[r]) {
      if (match.winner) continue;
      const oneSideEmpty = (match.playerA === null) !== (match.playerB === null);
      const bothAssigned = match.playerA !== null && match.playerB !== null;
      if (!bothAssigned && oneSideEmpty && roundIsFinal(rounds, r)) {
        // Only auto-resolve as a bye if the round below is fully decided
        // (both feeder matches finished) and one feeder produced no player,
        // which shouldn't normally happen with power-of-two brackets but is
        // handled defensively.
        match.bye = true;
        match.winner = match.playerA ?? match.playerB;
      }
    }
  }

  return { ...t, rounds };
}

function roundIsFinal(rounds: BracketMatch[][], r: number): boolean {
  const prev = rounds[r - 1];
  return prev.every((m) => m.winner !== null);
}

export function recordMatchResult(t: Tournament, round: number, slot: number, winner: string): Tournament {
  const rounds = t.rounds.map((r) => r.map((m) => ({ ...m })));
  const match = rounds[round].find((m) => m.slot === slot);
  if (!match) return t;
  match.winner = winner;
  return propagateWinners({ ...t, rounds });
}

export function getChampion(t: Tournament): string | null {
  const final = t.rounds[t.rounds.length - 1]?.[0];
  return final?.winner ?? null;
}

export function isComplete(t: Tournament): boolean {
  return getChampion(t) !== null;
}
