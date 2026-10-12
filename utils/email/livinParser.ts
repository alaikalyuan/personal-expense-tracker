import type { CategoryKey } from "@/utils/i18n/dictionaries";

export interface ParsedLivinTransaction {
  isValid: boolean;
  merchantName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm:ss
  referenceId: string;
  suggestedCategory: CategoryKey;
  confidence: "high" | "medium" | "low";
  rawSnippet?: string;
}

const INDONESIAN_MONTHS: Record<string, string> = {
  jan: "01",
  januari: "01",
  feb: "02",
  peb: "02",
  februari: "02",
  mar: "03",
  maret: "03",
  apr: "04",
  april: "04",
  mei: "05",
  may: "05",
  jun: "06",
  juni: "06",
  jul: "07",
  juli: "07",
  agu: "08",
  agt: "08",
  agustus: "08",
  aug: "08",
  sep: "09",
  september: "09",
  okt: "10",
  oct: "10",
  oktober: "10",
  nop: "11",
  nov: "11",
  november: "11",
  des: "12",
  dec: "12",
  desember: "12",
};

/**
 * Strip HTML tags while preserving line breaks for structured text parsing.
 */
export function stripHtmlToText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/tr>|<\/p>|<\/div>|<br\s*\/?>/gi, "\n")
    .replace(/<\/td>\s*<td[^>]*>/gi, "\n")
    .replace(/<\/td>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/**
 * Infer category from merchant name using known Indonesian keywords.
 */
export function inferCategoryFromMerchant(merchant: string): CategoryKey {
  const lower = merchant.toLowerCase();

  // Food & Dining keywords
  if (
    /\b(teh|kopi|coffee|cafe|kafe|resto|restaurant|warung|warteg|kantin|bakso|mie|nasi|ayam|burger|pizza|sushi|boba|snack|roti|bakery|dapur|kitchen|makan|food|beverage|drink|tea|cup|juice|jus|gelato|ice cream|martabak|sate|soto|gofood|grabfood|shopeefood)\b/i.test(
      lower
    ) ||
    /camellia|starbucks|kenangan|jiwa|fore|tomoro|kfc|mcdonald|jco|hokben|solaria|chatime|mixue/i.test(
      lower
    )
  ) {
    return "Food & Dining";
  }

  // Transportation
  if (
    /\b(spbu|pertamina|shell|bp|bensin|parkir|parking|tol|toll|etoll|gojek|grab|maxim|indrive|kereta|kai|krl|mrt|lrt|transjakarta|ojol|taksi|taxi)\b/i.test(
      lower
    )
  ) {
    return "Transportation";
  }

  // Utilities
  if (/\b(pln|listrik|pdam|wifi|indihome|biznet|telkomsel|indosat|xl|tri|smartfren|pulsa)\b/i.test(lower)) {
    return "Utilities";
  }

  // Academics
  if (/\b(kampus|universitas|sekolah|buku|gramedia|stationery|fotocopy|print)\b/i.test(lower)) {
    return "Academics";
  }

  // Entertainment
  if (/\b(cinema|xxi|cgv|cinepolis|bioskop|game|steam|playstation|karaoke|billiard)\b/i.test(lower)) {
    return "Entertainment";
  }

  // Default for QRIS retail payments
  return "Food & Dining";
}

/**
 * Parse date strings like "12 Okt 2026", "12 Oktober 2026", "12-10-2026", etc. into YYYY-MM-DD
 */
export function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // Pattern 1: "12 Okt 2026" or "12 Oktober 2026"
  const textMonthMatch = clean.match(/(\d{1,2})\s+([a-zA-Z]{3,9})\s+(\d{4})/i);
  if (textMonthMatch) {
    const day = textMonthMatch[1].padStart(2, "0");
    const monthKey = textMonthMatch[2].toLowerCase();
    const month = INDONESIAN_MONTHS[monthKey];
    const year = textMonthMatch[3];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Pattern 2: "12/10/2026" or "12-10-2026" (DD/MM/YYYY)
  const dmyMatch = clean.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern 3: YYYY-MM-DD
  const ymdMatch = clean.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return ymdMatch[0];
  }

  return null;
}

/**
 * Parse Indonesian currency amounts, e.g. "Rp 5.000,00", "Rp 50.000", "5.000,00", "IDR 25000"
 */
export function parseAmountString(amountStr: string): number | null {
  if (!amountStr) return null;
  const clean = amountStr.trim();

  // Extract numeric portion with separators
  const match = clean.match(/(?:Rp|IDR)?\s*([\d.,]+)/i);
  if (!match) return null;

  let numStr = match[1];

  // If ends with ,XX (Indonesian decimal cents like ,00)
  if (/,\d{1,2}$/.test(numStr)) {
    numStr = numStr.replace(/,\d{1,2}$/, "");
  }

  // Strip all dots (thousand separators)
  const cleanedDigits = numStr.replace(/\./g, "").replace(/,/g, "");
  const parsed = parseInt(cleanedDigits, 10);

  return isNaN(parsed) || parsed < 0 ? null : parsed;
}

/**
 * Primary Parser for Livin' by Mandiri QRIS email confirmations.
 */
export function parseLivinEmail(rawInput: string): ParsedLivinTransaction {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      isValid: false,
      merchantName: "",
      amount: 0,
      date: "",
      referenceId: "",
      suggestedCategory: "Others",
      confidence: "low",
    };
  }

  // Strip HTML if input contains tags
  const text = rawInput.includes("<") && rawInput.includes(">") ? stripHtmlToText(rawInput) : rawInput;

  let merchantName = "";
  let amount: number | null = null;
  let date: string | null = null;
  let time: string | undefined = undefined;
  let referenceId = "";

  // 1. Merchant / Penerima extraction
  // Livin template layout:
  // "Penerima\nTEH CAMELLIA\nSurabaya (Kota) - ID"
  // or "Penerima : TEH CAMELLIA"
  // or "Penerima\nKOPI KENANGAN"
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(?:Penerima|Nama Merchant|Merchant)\s*[:]?\s*(.*)$/i.test(line)) {
      const inlineRest = line.replace(/^(?:Penerima|Nama Merchant|Merchant)\s*[:]?\s*/i, "").trim();
      if (inlineRest) {
        merchantName = inlineRest;
        break;
      } else if (i + 1 < lines.length) {
        // Next line is the merchant name
        merchantName = lines[i + 1];
        break;
      }
    }
  }

  // Fallback merchant search if empty
  if (!merchantName) {
    const fallbackMatch = text.match(/(?:transaksi Anda dengan QR(?:\s*:\s*|\s+ke\s+)?|ke\s+merchant\s+)([A-Z0-9\s&'.]+)/i);
    if (fallbackMatch) {
      merchantName = fallbackMatch[1].trim();
    }
  }

  // Clean merchant name from city suffixes or location lines like "Surabaya (Kota) - ID"
  if (merchantName) {
    merchantName = merchantName
      .replace(/\s*-\s*[A-Z]{2}$/, "")
      .replace(/\s+\(Kota\).*$/i, "")
      .trim();
  }

  // Fallback merchant search if empty
  if (!merchantName) {
    const fallbackMatch = text.match(/(?:transaksi Anda dengan QR(?:\s*:\s*|\s+ke\s+)?|ke\s+merchant\s+)([A-Z0-9\s&'.]+)/i);
    if (fallbackMatch) {
      merchantName = fallbackMatch[1].trim();
    }
  }

  // Clean merchant name from city suffixes like "Surabaya (Kota)"
  if (merchantName) {
    merchantName = merchantName.replace(/\s+\(Kota\).*$/i, "").trim();
  }

  // 2. Amount / Nominal extraction
  // Livin template layout: "Nominal Transaksi\nRp 5.000,00" or "Nominal Transaksi : Rp 5.000,00"
  const nominalMatch = text.match(/(?:Nominal Transaksi|Total Transaksi|Nominal|Total Pembayaran)\s*[:\n]?\s*(?:Rp|IDR)?\s*([\d.,]+)/i);
  if (nominalMatch) {
    amount = parseAmountString(nominalMatch[0]);
  }

  if (amount === null) {
    // General fallback for currency pattern
    const generalRpMatch = text.match(/Rp\s*([\d.]+)(?:,\d{2})?/i);
    if (generalRpMatch) {
      amount = parseAmountString(generalRpMatch[0]);
    }
  }

  // 3. Date extraction
  // Livin template layout: "Tanggal\n12 Okt 2026" or "Tanggal : 12 Okt 2026"
  const tanggalMatch = text.match(/Tanggal\s*[:\n]?\s*(\d{1,2}\s+[a-zA-Z]{3,9}\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (tanggalMatch) {
    date = parseDateString(tanggalMatch[1]);
  }

  // 4. Time extraction
  // Livin template layout: "Jam\n12:02:55 WIB" or "Jam : 12:02:55 WIB"
  const jamMatch = text.match(/Jam\s*[:\n]?\s*(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*WIB|\s*WITA|\s*WIT)?/i);
  if (jamMatch) {
    time = jamMatch[1];
  }

  // 5. Reference Number extraction
  const refMatch = text.match(/(?:No\.?\s*Referensi|No\.?\s*Transaksi|ID\s*Transaksi|RRN|Ref(?:erence)?(?:\s*No)?)\s*[:\n]?\s*([A-Za-z0-9_-]+)/i);
  if (refMatch) {
    referenceId = refMatch[1].trim();
  } else if (merchantName && amount && date) {
    // Generate deterministic hash as fallback reference ID for deduplication
    const cleanSlug = merchantName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
    const timeSlug = (time || "000000").replace(/[^0-9]/g, "");
    referenceId = `LIVIN-${date.replace(/-/g, "")}-${timeSlug}-${amount}-${cleanSlug}`;
  }

  // Fallback to today's date if not extracted
  if (!date) {
    const today = new Date();
    date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  const isValid = Boolean(merchantName && amount !== null && amount > 0);
  const suggestedCategory = merchantName ? inferCategoryFromMerchant(merchantName) : "Food & Dining";

  return {
    isValid,
    merchantName: merchantName || "QRIS Mandiri",
    amount: amount || 0,
    date,
    time,
    referenceId,
    suggestedCategory,
    confidence: isValid && tanggalMatch && merchantName ? "high" : isValid ? "medium" : "low",
    rawSnippet: text.slice(0, 300),
  };
}
