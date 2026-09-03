import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase client, or null if the project isn't
 * configured yet (no env vars set). Callers should handle the null case —
 * see lib/games.ts: it falls back to "no live games exist" rather than
 * throwing, so the app still runs before you've connected a real project.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!client) {
    client = createClient(url, key);
  }
  return client;
}
