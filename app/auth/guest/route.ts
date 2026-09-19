import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";
  const cookieStore = await cookies();

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseOrigin = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

  // Redirect destination: append welcome=true query parameter so the welcome modal triggers (unless auth modal was requested)
  const redirectUrl = new URL(next, baseOrigin);
  if (!redirectUrl.searchParams.has("auth")) {
    redirectUrl.searchParams.set("welcome", "true");
  }

  const response = NextResponse.redirect(redirectUrl.toString());

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Ignore cookieStore error in route handler
            }
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if session already exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    return response;
  }

  // Attempt anonymous sign-in
  const { error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error("Supabase anonymous sign-in error:", error);
    // If anonymous sign-in is disabled in Supabase dashboard or errors, redirect to login
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        error.message || "Could not start guest mode. Please log in."
      )}`
    );
  }

  return response;
}

