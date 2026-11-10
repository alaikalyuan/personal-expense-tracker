import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    (pathname.startsWith("/split/") && pathname !== "/split/new") ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons");

  const isAuthRoute = pathname.startsWith("/login");

  // Check if any Supabase auth cookie is present
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("-auth-token"));

  // Visitors without a session land on "/", which renders the welcome screen.
  // A guest session is only created when they choose "Continue" there, so
  // crawlers and link previewers never create anonymous users.
  const fullDestination = request.nextUrl.pathname + request.nextUrl.search;
  const redirectToLanding = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("next", fullDestination);
    return NextResponse.redirect(url);
  };

  // 1. Fast path for visitors without a session
  if (!hasAuthCookie) {
    if (pathname === "/" || isPublicRoute) {
      return NextResponse.next({ request });
    }
    return redirectToLanding();
  }

  // 2. Fast path for client-side navigation (RSC / prefetch):
  // When navigating between pages within the app, the destination Server Component
  // already calls `supabase.auth.getUser()` and handles authorization/redirection.
  // Skipping the external auth server round-trip in proxy saves 300-600ms on every link click.
  const isClientNavigation =
    request.headers.get("rsc") === "1" ||
    request.nextUrl.searchParams.has("_rsc") ||
    request.headers.has("next-router-prefetch");

  if (isClientNavigation && hasAuthCookie && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  // 3. Standard path for full document requests & auth verification:
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
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

  if (!user && !isPublicRoute && pathname !== "/") {
    return redirectToLanding();
  }

  // Only redirect permanent (non-guest) users away from /login
  const isAnonymous = user?.is_anonymous ?? false;
  if (user && !isAnonymous && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

