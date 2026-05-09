import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { profileMatchesRole } from "@/lib/roles";
import type { Profile, UserRole } from "@/lib/types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

async function createMissingStudentProfile(
  user: User,
  supabase: SupabaseClient
): Promise<Profile | null> {
  const fullName =
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ?? null;

  const insertPayload = {
    id: user.id,
    full_name: fullName,
    role: "student" as const,
  };

  const tryInsert = async (client: SupabaseClient) => {
    const { data } = await client
      .from("profiles")
      .insert(insertPayload)
      .select("*")
      .maybeSingle();
    if (data) return data as Profile;
    const { data: row } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return (row as Profile) ?? null;
  };

  const fromAnon = await tryInsert(supabase);
  if (fromAnon) return fromAnon;

  try {
    return await tryInsert(createServiceClient());
  } catch {
    return null;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  profile: Profile;
}

/**
 * Returns the authenticated user + profile or `null` if signed out.
 * Use in Server Components / Route Handlers.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Auth session exists but no profile row (trigger failed, partial signup, or DB reset).
  // Without this, RSC can redirect to /login while middleware sees a JWT user.
  if (!profile) {
    profile = await createMissingStudentProfile(user, supabase);
  }

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    profile,
  };
}

/**
 * Enforces an authenticated session, optionally with a specific role.
 * Redirects to /login otherwise.
 */
export async function requireUser(role?: UserRole): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (role && !profileMatchesRole(user.profile.role, role)) {
    redirect(role === "admin" ? "/dashboard" : "/admin/dashboard");
  }
  return user;
}
