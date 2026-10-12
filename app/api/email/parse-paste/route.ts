import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { parseLivinEmail } from "@/utils/email/livinParser";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "INVALID_BODY", message: "Teks email diperlukan." }, { status: 400 });
    }

    const parsed = parseLivinEmail(text);

    return NextResponse.json({
      success: parsed.isValid,
      data: parsed,
    });
  } catch (err: unknown) {
    console.error("Error in parse-paste route:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err instanceof Error ? err.message : "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
