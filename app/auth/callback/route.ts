import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // 1. Capture any expenses created in current guest session before exchanging session
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let guestExpenses: Array<{
      category: string;
      name: string;
      note: string | null;
      amount: number;
      spent_at: string;
    }> = [];

    const isGuest = currentUser?.is_anonymous ?? false;
    const guestId = currentUser?.id;

    if (isGuest && guestId) {
      const { data } = await supabase
        .from("expenses")
        .select("category, name, note, amount, spent_at")
        .eq("user_id", guestId);
      if (data && data.length > 0) {
        guestExpenses = data;
      }
    }

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const newUserId = sessionData?.user?.id;
      let mergedCount = 0;
      if (guestExpenses.length > 0 && newUserId && newUserId !== guestId) {
        const rowsToInsert = guestExpenses.map((expense) => ({
          ...expense,
          user_id: newUserId,
        }));
        const { error: insertError } = await supabase.from("expenses").insert(rowsToInsert);
        if (!insertError) {
          mergedCount = guestExpenses.length;
        } else {
          console.error("Failed to merge guest expenses on Google login:", insertError);
        }
      }

      const targetPath = mergedCount > 0
        ? `${next}${next.includes("?") ? "&" : "?"}merged=${mergedCount}`
        : next;

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${targetPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${targetPath}`);
      } else {
        return NextResponse.redirect(`${origin}${targetPath}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate with Google`);
}

