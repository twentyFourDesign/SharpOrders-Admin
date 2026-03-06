import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key.
 * Bypasses RLS — use only in backend API routes, never expose to the client.
 * Set SUPABASE_SERVICE_ROLE_KEY in .env (from Supabase Dashboard → Project Settings → API).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey ?? "", {
  auth: { persistSession: false },
});
