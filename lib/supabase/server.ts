import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Use inside Server Components, Route Handlers, and Server Actions.
 * Reads/writes the Supabase auth cookie via Next's `cookies()` helper.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — cookies are immutable there.
          // The middleware refreshes the session on every request, so this
          // is safe to ignore in this context.
        }
      },
    },
  });
}

/**
 * Privileged client using the service role key. Server-only.
 * Bypasses RLS — use sparingly and only when strictly necessary
 * (e.g. webhook handlers that act on behalf of the system).
 */
export function createServiceClient() {
  return createSupabaseClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
