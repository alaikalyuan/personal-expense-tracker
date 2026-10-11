import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { checkAndIncrementAiUsage, PHOTO_AI_COST, DAILY_AI_LIMIT } from "@/utils/ai/rateLimit";
import { normalizeExtraction } from "@/utils/ai/vision";
import { getTodayString } from "@/utils/date";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Silakan masuk untuk menggunakan fitur pemindai gambar AI." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      image,
      hint = "any", // "receipt" | "split" | "any"
      apiKeyOverride,
      language = "id",
    } = body;

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "INVALID_IMAGE", message: "Data gambar tidak valid atau format tidak didukung." },
        { status: 400 }
      );
    }

    // Reject if excessively large (> 10MB base64)
    if (image.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "IMAGE_TOO_LARGE", message: "Ukuran gambar terlalu besar. Coba kompres atau unggah gambar yang lebih kecil." },
        { status: 400 }
      );
    }

    const isUsingOverride = Boolean(
      apiKeyOverride && typeof apiKeyOverride === "string" && apiKeyOverride.trim().length > 0
    );

    const apiKey = isUsingOverride
      ? apiKeyOverride.trim()
      : process.env.DEEPSEEK_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "DeepSeek API key belum dikonfigurasi. Atur DEEPSEEK_API_KEY di .env.local atau masukkan kunci pribadi di pengaturan AI.",
        },
        { status: 400 }
      );
    }

    // Rate Limit Check (photo upload costs PHOTO_AI_COST = 5 units, allows overflow if close to limit)
    let rateLimitResult: { allowed: boolean; remaining: number; limit: number; count: number } | null = null;
    if (!isUsingOverride) {
      rateLimitResult = await checkAndIncrementAiUsage(
        supabase,
        user,
        PHOTO_AI_COST,
        DAILY_AI_LIMIT,
        true // allow overflow if close to the limit!
      );
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: "DAILY_LIMIT_REACHED",
            message:
              language === "id"
                ? "Batas penggunaan gratis 20 kuota per hari telah tercapai. Masukkan DeepSeek API Key pribadi Anda di menu pengaturan kunci AI untuk melanjutkan tanpa batas."
                : "Daily free quota of 20 units reached. Please add your personal DeepSeek API key in AI settings to continue without limits.",
          },
          { status: 429 }
        );
      }
    }

    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const visionModel = process.env.DEEPSEEK_VISION_MODEL || "deepseek-flash";

    const systemPrompt = `You are an expert OCR financial receipt and statement parser.
Analyze the provided image (receipt, payment invoice, bank transfer screenshot, e-wallet proof like GoPay/OVO/ShopeePay/Dana/BCA/Mandiri, or transaction statement).
Extract the transaction details into STRICT JSON format.

JSON schema:
{
  "kind": "receipt" | "bank_transaction" | "transaction_list" | "unknown",
  "merchant": string or null, // Name of store, restaurant, payee, or billing entity
  "date": string or null, // Formatted as YYYY-MM-DD. Infer year if only DD/MM or Month DD is present.
  "currency": "IDR", // Default "IDR" unless clearly other (USD, EUR, SGD)
  "items": [ // For receipts or itemized invoices. Do NOT put tax/service/subtotal in items!
    { "name": string, "quantity": number, "unitPrice": number }
  ],
  "subtotal": number or null, // Total before taxes/fees/discounts
  "taxAmount": number or null, // PPN / PB1 / Tax amount in currency (e.g. 10% or 11%)
  "serviceAmount": number or null, // Service charge amount in currency
  "discountAmount": number or null, // Total promo or discount subtracted
  "total": number or null, // Final Grand Total paid
  "transactions": [ // For bank screenshots, mutasi rekening, or e-wallet transfers
    {
      "name": string, // Description or receiver
      "amount": number, // Positive number
      "date": string or null, // YYYY-MM-DD
      "direction": "out" | "in", // "out" for expense/debit/transfer keluar; "in" for income/credit
      "category": "Food & Dining" | "Transportation" | "Utilities" | "Academics" | "Entertainment" | "Others"
    }
  ],
  "suggestedCategory": "Food & Dining" | "Transportation" | "Utilities" | "Academics" | "Entertainment" | "Others",
  "notes": string or null
}

IMPORTANT INDONESIAN CONVENTIONS & RULES:
1. Rupiah amounts: "25.000" or "25,000" means 25000. Do not treat "." as decimal point when followed by 3 digits.
2. Separate pure purchased items from adjustments! "PPN 11%", "PB1 10%", "Tax", "Service 5%", "Diskon", "Rounding", "Kembalian" must go into taxAmount, serviceAmount, discountAmount, NOT in the items list.
3. If an item line shows quantity and price like "2 x 15.000 = 30.000", quantity=2 and unitPrice=15000.
4. If kind is a bank transfer or QRIS receipt (e.g. BCA Mobile, Livin, GoPay, ShopeePay), set kind to "bank_transaction" with the final transfer amount and payee as merchant.
5. If kind is "receipt", set suggestedCategory based on the items or merchant (e.g. restaurant/cafe -> "Food & Dining", supermarket groceries -> "Food & Dining" or "Utilities", SPBU/Pertamina -> "Transportation").
6. Respond ONLY with valid JSON. No conversational text, no markdown backticks.`;

    const userTextPrompt =
      hint === "split"
        ? "Extract all line items, quantities, prices, taxes, service charges, discounts, and total from this bill/receipt for split bill calculation."
        : hint === "receipt"
        ? "Extract the merchant name, date, items, subtotal, tax, and grand total from this receipt."
        : "Extract all financial receipt, payment, or screenshot transaction details into JSON.";

    const apiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [
          { type: "text", text: userTextPrompt },
          {
            type: "image_url",
            image_url: {
              url: image,
            },
          },
        ],
      },
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: visionModel,
        messages: apiMessages,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek Vision API error:", response.status, errText);
      return NextResponse.json(
        {
          error: "VISION_API_ERROR",
          message: `Layanan AI Vision mengembalikan error (${response.status}). Pastikan API Key mendukung vision atau periksa koneksi.`,
        },
        { status: 502 }
      );
    }

    const jsonRes = await response.json();
    const rawContent = jsonRes.choices?.[0]?.message?.content;

    let parsedRaw: unknown = {};
    try {
      parsedRaw = JSON.parse(rawContent);
    } catch {
      // Clean possible wrapper if any
      const cleaned = String(rawContent || "").replace(/```json/g, "").replace(/```/g, "").trim();
      parsedRaw = JSON.parse(cleaned);
    }

    const todayStr = getTodayString();
    const normalized = normalizeExtraction(parsedRaw, todayStr);

    return NextResponse.json({
      success: true,
      data: normalized,
      usage: rateLimitResult
        ? {
            count: rateLimitResult.count,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            isPersonalKey: false,
          }
        : { isPersonalKey: true },
    });
  } catch (err: unknown) {
    console.error("Error in /api/ai/extract:", err);
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: err instanceof Error ? err.message : "Terjadi kesalahan pada server saat memproses gambar.",
      },
      { status: 500 }
    );
  }
}
