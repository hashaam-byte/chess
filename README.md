<div align="center">

# CHESS//X

**Play. Watch. Compete.**

Chess in the browser with no accounts and no waiting rooms. Send a link to a friend, take on a bot with a personality, or run a bracket for a prize.

<br />

<img src="docs/home.png" alt="CHESS//X home page: a black king floating above a glowing chessboard" width="880" />

</div>

<br />

## What you can do

**Play a friend.** Start a game and share the link (or a QR code). Your friend joins from the link, and there's nothing to sign up for.

**Play a bot.** Seven opponents, from Pawn to Obsidian King, each with its own face. Pick one, play, and see how you did.

**Watch live.** Every active game shows up on the Watch page. Click one to follow the board move by move as it's played.

**Run a tournament.** Open or invite-only, single elimination, with a start time, time control and prize. Brackets are seeded, byes are handled, and each match is a real game.

**Review your games.** After a game, Stockfish can walk through every move and labels it *Best*, *Excellent*, *Good*, *Inaccuracy*, *Mistake* or *Blunder*, and gives you an accuracy score.

**Climb the rankings.** Standard Elo, starting at 1200, with a podium for the top three.

**Make it yours.** Pick an avatar or upload a photo, and change the accent color of the entire site from the dot in the corner.

## The bots

Strength comes from Stockfish 18 running entirely in your browser. Nothing is sent to a server.

| Bot | Approx. strength | How it plays |
| --- | --- | --- |
| Pawn | ~800 | Shallow search, blunders often |
| Knight | ~950 | Shallow search, blunders sometimes |
| Bishop | ~1200 | Shallow search, blunders occasionally |
| Rook | ~1400 | Engine at a limited rating |
| Queen | ~1700 | Engine at a limited rating |
| King | ~2000 | Engine at a limited rating |
| Obsidian King | Max | Full strength |

Strengths were measured by playing the tiers against each other, so they are approximate. They are on Stockfish's own scale, not FIDE or chess.com ratings. The reasoning is documented in [`lib/bot.ts`](lib/bot.ts).

## Tech stack

| | |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Space Grotesk and Inter |
| Chess rules | [chess.js](https://github.com/jhlywa/chess.js) |
| Engine | [Stockfish 18](https://stockfishchess.org) (lite, single-threaded WASM), loaded on demand in a Web Worker |
| Multiplayer | [Supabase](https://supabase.com) (Postgres + Realtime + Storage) |

## Getting started

You need Node.js 20 or newer.

```bash
git clone https://github.com/hashaam-byte/chess.git
cd chess
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Offline mode

With no configuration, the app runs entirely in your browser:

| Works | Needs Supabase |
| --- | --- |
| Playing bots | Playing a friend over a link |
| Game review and analysis | Watching live games |
| Rankings (saved in local storage) | Tournaments |
| Themes and avatar presets | Uploading a photo avatar |

### Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL editor**, run these files in order:
   1. [`supabase/schema.sql`](supabase/schema.sql) for live games and realtime
   2. [`supabase/tournament_schema.sql`](supabase/tournament_schema.sql) for tournaments and signups
   3. [`supabase/player.sql`](supabase/player.sql) for rankings and the `avatars` bucket
3. Copy the environment template and fill in your project's URL and anon key (**Project Settings → API**):

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart `npm run dev`.

> **Heads up:** CHESS//X has no accounts, so the database policies are intentionally open. That's fine for friends and side projects. Tighten them before you put anything sensitive behind them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
app/
  page.tsx            Home
  play/               Create a game, join by link, play a bot
  watch/              Live games and spectator view
  tournament/         Tournament list, brackets, and match pages
  rankings/           Elo leaderboard
  pieces/             Piece gallery
components/
  HeroKing.tsx        The floating king on the home page
  GameBoard.tsx       Board, clocks, moves, resign, undo, eval bar, review
  Board.tsx           The board itself
  EvalBar.tsx         Evaluation bar
  GameReview.tsx      Post-game move analysis
lib/
  engine.ts           Stockfish worker wrapper
  bot.ts              Bot tiers and move selection
  bracket.ts          Single-elimination seeding and byes
  elo.ts              Rating maths
  games.ts            Live game persistence and realtime
  players.ts          Profiles and ratings (Supabase or local)
supabase/             SQL schemas
public/
  pieces/             Piece artwork
  stockfish/          Engine (WASM)
```

## How it works

**No accounts.** A player is a name, an avatar and a device key stored in the browser. Games and tournaments are joined by link.

**Live games.** Each game is one row in `live_games`. Moves are written to it and synced to spectators over Supabase Realtime. The page also pings the row while the tab is open, so a closed tab drops off the Watch page without needing a cron job.

**Tournaments.** Pairing happens at the start time, triggered by whichever browser opens the tournament page first after that moment. A guarded update means only one client can win the transition, even if several try at once. Every bracket match points at a normal live game, so tournament games get the same board, evaluation and review as any other.

**The home-page king.** It's a transparent cut-out that floats over a lit chessboard. The board, glow and rim light are all tinted with the accent color, so the scene re-colors when a player changes theme. The floor stays still, and the shadow tightens as the king rises.

## Deploying

The easiest route is [Vercel](https://vercel.com/new). Import the repo, add the two `NEXT_PUBLIC_SUPABASE_*` environment variables, and deploy.

## Credits

- Piece artwork is a recolored, restyled derivative of the **Merida** chess font by Armando Hernandez Marroquin, used under GPLv2+.
- The engine is **Stockfish**, used under GPLv3. Its license is in [`public/stockfish/LICENSE.txt`](public/stockfish/LICENSE.txt).