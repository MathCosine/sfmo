import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * The site is a static build, so it ships only the anon key — which is
 * designed to be public. Everything sensitive is behind row level security
 * and SECURITY DEFINER functions (see supabase/schema.sql).
 *
 * When the keys are absent the site still builds and renders; the
 * registration form and staff portal explain that the backend is not
 * connected yet rather than throwing.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Narrows the nullable client, with a message worth showing a user. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'The registration database is not connected yet. Please email us and we will sort it out.',
    );
  }
  return supabase;
}

/** Postgres RAISE messages arrive nested; surface something human. */
export function readErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    for (const key of ['message', 'details', 'hint', 'error_description']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  return fallback;
}
