import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseLivinEmail } from "@/utils/email/livinParser";
import { sendWebPushNotification } from "@/utils/pwa/webPushServer";
import { formatMoney } from "@/utils/money";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let queryToken = searchParams.get("token") || searchParams.get("key");

    const body = await req.json().catch(() => ({}));

    // Extract token from various possible locations
    let token = queryToken || body.token;
    const toAddress = body.to || body.recipient || "";
    if (!token && typeof toAddress === "string") {
      const tokenMatch = toAddress.match(/(?:qris|receipt|sync)[-_]([a-f0-9]{32})/i);
      if (tokenMatch) {
        token = tokenMatch[1];
      }
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "MISSING_TOKEN", message: "Inbound sync token is required." },
        { status: 400 }
      );
    }

    // Extract content
    const rawContent = body.text || body.html || body.content || body.body || "";
    const sender = body.from || body.sender || "noreply.livin@bankmandiri.co.id";
    const subject = body.subject || "Pembayaran Berhasil";

    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "EMPTY_PAYLOAD", message: "No email body text found in payload." },
        { status: 400 }
      );
    }

    // Check if this is a Gmail forwarding verification email
    const isGoogleVerification =
      sender.toLowerCase().includes("google.com") ||
      subject.toLowerCase().includes("confirmation") ||
      subject.toLowerCase().includes("konfirmasi") ||
      rawContent.toLowerCase().includes("confirmation code") ||
      rawContent.toLowerCase().includes("kode konfirmasi");

    if (isGoogleVerification) {
      const codeMatch = rawContent.match(/(?:confirmation code|kode konfirmasi)[:\s]+([0-9]{7,12})/i);
      if (codeMatch && codeMatch[1]) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("user_settings")
          .update({ last_email_verification_code: codeMatch[1] })
          .eq("email_sync_token", token);

        return NextResponse.json({
          success: true,
          is_verification: true,
          message: "Gmail forwarding verification code captured.",
          code: codeMatch[1],
        });
      }
    }

    // Parse email
    const parsed = parseLivinEmail(rawContent);
    if (!parsed.isValid) {
      return NextResponse.json(
        {
          error: "UNRECOGNIZED_FORMAT",
          message: "Email did not match recognized Livin QRIS transaction format.",
        },
        { status: 422 }
      );
    }

    // Ingest into Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: ingestRes, error: ingestError } = await supabase.rpc("ingest_email_transaction", {
      p_token: token,
      p_merchant: parsed.merchantName,
      p_amount: parsed.amount,
      p_date: parsed.date,
      p_time: parsed.time ? parsed.time.slice(0, 8) : null,
      p_ref: parsed.referenceId,
      p_category: parsed.suggestedCategory,
      p_sender: sender,
      p_subject: subject,
      p_snippet: parsed.rawSnippet || null,
    });

    if (ingestError) {
      console.error("Supabase ingest error:", ingestError);
      return NextResponse.json({ error: "INGEST_FAILED", message: ingestError.message }, { status: 500 });
    }

    if (ingestRes && !ingestRes.success) {
      return NextResponse.json({ error: ingestRes.error, message: ingestRes.message }, { status: 400 });
    }

    // Send push notification if configured
    const userId = ingestRes?.user_id;
    const mode = ingestRes?.mode;

    if (userId) {
      try {
        const { data: pushSubs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", userId);

        if (pushSubs && pushSubs.length > 0) {
          const formattedAmount = formatMoney(parsed.amount, "IDR");
          const title = mode === "auto" ? "QRIS Berhasil Dicatat 💳" : "Transaksi QRIS Terdeteksi 📩";
          const bodyText =
            mode === "auto"
              ? `${formattedAmount} di ${parsed.merchantName} otomatis dicatat ke Saku.`
              : `${formattedAmount} di ${parsed.merchantName}. Ketuk untuk meninjau.`;

          for (const sub of pushSubs) {
            sendWebPushNotification(sub, {
              title,
              body: bodyText,
              url: "/",
              tag: `email-qris-${parsed.referenceId}`,
            }).catch(() => {});
          }
        }
      } catch (pushErr) {
        console.error("Failed to send push notification for email sync:", pushErr);
      }
    }

    return NextResponse.json({
      success: true,
      mode: ingestRes?.mode,
      transaction_id: ingestRes?.transaction_id,
      merchant: parsed.merchantName,
      amount: parsed.amount,
      date: parsed.date,
    });
  } catch (err: unknown) {
    console.error("Unhandled error in inbound email route:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: err instanceof Error ? err.message : "Internal error." },
      { status: 500 }
    );
  }
}
