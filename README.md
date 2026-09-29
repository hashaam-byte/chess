# CHESS//X

CHESS//X is a modern chess playground for people who want to play, watch, and compete without a heavy account-first experience.

The app includes:

- Live games created from shareable links.
- Local two-player games with clocks, color selection, and draw or resign actions.
- Playable bot opponents ranging from Pawn to Obsidian King.
- Tournaments with brackets, signups, matches, and rankings.
- Live game watching and game review with Stockfish analysis.
- Custom player identities, avatars, accent colors, and light or dark themes.

## Stack

- Next.js 16 App Router and React 19
- TypeScript
- Tailwind CSS 4
- Supabase for live games, players, and tournament data
- `chess.js` for legal chess state and move validation
- Stockfish 18 for browser-side analysis

## Run Locally

Use Node.js and pnpm, then install dependencies:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Available scripts:

```bash
pnpm dev       # Start the development server
pnpm lint      # Run ESLint
pnpm build     # Create a production build
pnpm start     # Serve the production build
```

## Supabase Setup

The app works without Supabase, but live multiplayer, watchers, player rankings, and tournaments need a configured project.

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the SQL files in the Supabase SQL editor:

1. `supabase/schema.sql` for live games and realtime updates.
2. `supabase/tournament_schema.sql` for tournaments and signups.

The client falls back to local behavior when those variables are absent, so the UI can still be explored during development.

## Project Map

| Path | Purpose |
| --- | --- |
| `app/` | Routes for play, watch, rankings, tournaments, and legal pages |
| `components/` | Shared board, navigation, avatars, clocks, review, and theme UI |
| `lib/` | Chess state, bot logic, Elo, Supabase access, profiles, and tournament helpers |
| `public/pieces/stockfish/` | Browser-loaded Stockfish engine files |
| `supabase/` | Database schema and realtime configuration |

The home page hero is assembled by `components/HeroKing.tsx`, rendered from `app/page.tsx`, and styled in `app/globals.css`. It uses the committed `public/images/hero-king.webp` asset and keeps the king, glow, board floor, and shadow in separate layers so the vertical motion reads clearly.

## Deploy

Build the app with `pnpm build` and deploy it to a Next.js-compatible host such as Vercel. Add the two Supabase environment variables to the host before enabling live play.
