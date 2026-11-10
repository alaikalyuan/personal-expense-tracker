import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Legacy entry point kept for old links and bookmarks.
 * It no longer creates a guest session on GET (crawlers and link previewers
 * would create anonymous users). Guests are created by the "Continue" button
 * on the welcome screen at "/".
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\") ? rawNext : "/";

  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.redirect(new URL(next, origin));
  }

  const landing = new URL("/", origin);
  if (next !== "/") landing.searchParams.set("next", next);
  return NextResponse.redirect(landing);
}
