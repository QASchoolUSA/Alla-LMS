import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = new Set(["/login", "/register", "/auth/callback"]);

/** Keep refreshed auth cookies when returning a redirect response. */
function forwardCookies(from: NextResponse, to: NextResponse) {
  for (const c of from.cookies.getAll()) {
    to.cookies.set(c.name, c.value, c);
  }
}

function isPublic(pathname: string): boolean {
  if (pathname === "/") return false;
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/mux/webhook")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always refresh the session cookie if Supabase is configured.
  // This keeps the user signed in across server transitions.
  let user = null;
  let response = NextResponse.next({ request });

  try {
    const result = await updateSession(request);
    user = result.user;
    response = result.response;
  } catch {
    // Supabase not yet configured — fall through with no user.
  }

  if (isPublic(pathname)) {
    // Do not redirect JWT-present users away from /login here. If `profiles` is missing,
    // RSC would send them to /login while this redirect sent them to /dashboard → 307 loop.
    return response;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const toLogin = NextResponse.redirect(loginUrl);
    forwardCookies(response, toLogin);
    return toLogin;
  }

  // Admin access is enforced in `app/(admin)/layout.tsx` via requireUser("admin").
  // Duplicate role checks here hit PostgREST from the Edge proxy and tended to diverge from
  // Server Component auth → users with role=admin kept getting redirected to /dashboard.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every request except:
     *  - _next/static, _next/image  (static assets)
     *  - any file with an extension (favicon, sitemap, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
