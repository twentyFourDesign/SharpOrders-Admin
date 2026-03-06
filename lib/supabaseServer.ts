import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key.
 * Bypasses RLS — use only in backend API routes, never expose to the client.
 *
 * In production we also want Vercel builds to succeed even if the env vars
 * are missing or misconfigured, so we avoid throwing at module-evaluation
 * time. Individual routes should still guard and return 500 if uploads
 * are not configured.
 *
 * Required env:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "[supabaseAdmin] Supabase env vars missing; storage uploads will not work until NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
  );
}

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : (null as any);
