import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseLivinEmail } from "@/utils/email/livinParser";
import { sendWebPushNotification } from "@/utils/pwa/webPushServer";
import { formatMoney } from "@/utils/money";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

function decodeMimeAndHtml(raw: string): string {
  let combined = raw;

  // 1. Decode any base64 blocks inside MIME multipart
  const b64Regex = /Content-Transfer-Encoding:\s*base64\s*\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = b64Regex.exec(raw)) !== null) {
    try {
      const decoded = Buffer.from(match[1].replace(/\r?\n/g, ""), "base64").toString("utf-8");
      combined += "\n" + decoded;
    } catch {}
  }

  // 2. Decode Quoted-Printable
  let qpDecoded = combined.replace(/=\r?\n/g, "");
  qpDecoded = qpDecoded.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return hex;
    }
  });

  // 3. Clean HTML and entities
  return qpDecoded
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function extractGoogleVerification(raw: string): { code: string | null; url: string | null } {
  const clean = decodeMimeAndHtml(raw);

  let code: string | null = null;
  let url: string | null = null;

  // 1. Explicit code labels
  const labelMatch = clean.match(
    /(?:confirmation\s*code|kode\s*(?:konfirmasi|verifikasi)|verification\s*code)[^0-9a-zA-Z]{1,60}([0-9]{6,12})/i
  );
  if (labelMatch && labelMatch[1]) {
    code = labelMatch[1];
  }

  // 2. Google verification URL
  const urlMatch =
    raw.match(/(https:\/\/(?:mail|mail-settings)\.google\.com\/mail\/(?:vf|f)[^\s"'>\r\n]+)/i) ||
    clean.match(/(https:\/\/(?:mail|mail-settings)\.google\.com\/mail\/(?:vf|f)[^\s"'>\r\n]+)/i);

  if (urlMatch && urlMatch[1]) {
    url = urlMatch[1];
    if (!code) {
      const codeInUrl = url.match(/[?&](?:c|code|key)=([0-9]{6,12})/i);
      if (codeInUrl && codeInUrl[1]) {
        code = codeInUrl[1];
      }
    }
  }

  // 3. Standalone 7-10 digit numbers
  if (!code) {
    const standaloneMatch = clean.match(/(?:^|[\s:;>#<\[\(])([0-9]{7,10})(?:$|[\s<\]\)\.])/m);
    if (standaloneMatch && standaloneMatch[1]) {
      code = standaloneMatch[1];
    }
  }

  return { code, url };
}

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
      sender.toLowerCase().includes("googlemail.com") ||
      subject.toLowerCase().includes("confirmation") ||
      subject.toLowerCase().includes("konfirmasi") ||
      subject.toLowerCase().includes("forwarding") ||
      subject.toLowerCase().includes("penerusan") ||
      rawContent.toLowerCase().includes("confirmation code") ||
      rawContent.toLowerCase().includes("kode konfirmasi") ||
      rawContent.toLowerCase().includes("kode verifikasi") ||
      rawContent.toLowerCase().includes("verification code") ||
      rawContent.toLowerCase().includes("mail.google.com") ||
      rawContent.toLowerCase().includes("mail-settings.google.com");

    if (isGoogleVerification) {
      const { code, url } = extractGoogleVerification(rawContent);
      const verificationValue = code || url || "VERIFIED";

      // If a verification URL is found, attempt background fetch to auto-confirm with Google
      if (url) {
        fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }).catch(() => {});
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.rpc("save_email_verification_code", {
        p_token: token,
        p_code: verificationValue,
      });

      return NextResponse.json({
        success: true,
        is_verification: true,
        message: "Gmail forwarding verification captured.",
        code: verificationValue,
        url,
      });
    }

    // Parse email (try raw first, then decoded text)
    let parsed = parseLivinEmail(rawContent);
    if (!parsed.isValid) {
      const decodedContent = decodeMimeAndHtml(rawContent);
      parsed = parseLivinEmail(decodedContent);
    }

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
