import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (NEXT_PUBLIC_* vars).
 * Prefer standard `NEXT_PUBLIC_SUPABASE_ANON_KEY`; publishable keys are also supported.
 * Never commit real keys — use `.env.local` and Vercel project env.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cached !== undefined) {
    return cached;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !anonKey) {
    cached = null;
    return null;
  }

  cached = createClient(url, anonKey);
  return cached;
}
