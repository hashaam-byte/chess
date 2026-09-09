export type BracketMatch = {
  id: string;
  round: number;
  slot: number;
  playerA: string | null;
  playerB: string | null;
  winner: string | null;
  bye: boolean;
  /** Set once two known players actually start this match — points at a live_games row. */
  gameId: string | null;
};

export type Bracket = BracketMatch[][];

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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Builds a fresh bracket from a list of player names, randomly shuffled before seeding. */
export function createBracket(playerNames: string[]): { players: string[]; rounds: Bracket } {
  const players = shuffle(playerNames);
  const bracketSize = nextPowerOfTwo(Math.max(2, players.length));
  const order = seedOrder(bracketSize);
  const nameForSeed = (seed: number) => players[seed - 1] ?? null;

  const roundCount = Math.log2(bracketSize);
  const rounds: Bracket = Array.from({ length: roundCount }, () => []);

  for (let i = 0; i < bracketSize / 2; i++) {
    const playerA = nameForSeed(order[i * 2]);
    const playerB = nameForSeed(order[i * 2 + 1]);
    const bye = playerA === null || playerB === null;
    const winner = bye ? playerA ?? playerB : null;
    rounds[0].push({ id: `r0-m${i}`, round: 0, slot: i, playerA, playerB, winner, bye, gameId: null });
  }

  for (let r = 1; r < roundCount; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r + 1);
    for (let i = 0; i < matchesInRound; i++) {
      rounds[r].push({ id: `r${r}-m${i}`, round: r, slot: i, playerA: null, playerB: null, winner: null, bye: false, gameId: null });
    }
  }

  return { players, rounds: propagateWinners(rounds) };
}

/** Pushes every decided winner into its slot in the next round. Pure — returns a new Bracket. */
function propagateWinners(rounds: Bracket): Bracket {
  const next = rounds.map((r) => r.map((m) => ({ ...m })));

  for (let r = 0; r < next.length - 1; r++) {
    for (let i = 0; i < next[r].length; i++) {
      const match = next[r][i];
      if (!match.winner) continue;
      const nextMatch = next[r + 1][Math.floor(i / 2)];
      if (i % 2 === 0) nextMatch.playerA = match.winner;
      else nextMatch.playerB = match.winner;
    }
  }

  return next;
}

export function recordMatchWinner(rounds: Bracket, matchId: string, winner: string): Bracket {
  const flat = rounds.flat();
  const match = flat.find((m) => m.id === matchId);
  if (!match) return rounds;

  const next = rounds.map((r) => r.map((m) => (m.id === matchId ? { ...m, winner } : { ...m })));
  return propagateWinners(next);
}

export function setMatchGameId(rounds: Bracket, matchId: string, gameId: string): Bracket {
  return rounds.map((r) => r.map((m) => (m.id === matchId ? { ...m, gameId } : m)));
}

export function findMatch(rounds: Bracket, matchId: string): BracketMatch | null {
  return rounds.flat().find((m) => m.id === matchId) ?? null;
}

export function getChampion(rounds: Bracket): string | null {
  const final = rounds[rounds.length - 1]?.[0];
  return final?.winner ?? null;
}

export function isComplete(rounds: Bracket): boolean {
  return getChampion(rounds) !== null;
}
