import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — skip auth entirely
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/invite"];
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/billing/plans");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Skip if env vars aren't set (build time / initial deploy)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check for kid session cookie
    const hasKidSession = request.cookies.has("epb_kid_session");

    if (!user && !hasKidSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Protect admin routes
    if (pathname.startsWith("/admin") && !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    // If auth check fails, let the request through
    // Individual pages/API routes will handle auth themselves
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
