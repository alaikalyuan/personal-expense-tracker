import { CategoryKey, CATEGORY_KEYS } from "../i18n/dictionaries";

export type ExtractedKind =
  | "receipt"
  | "bank_transaction"
  | "transaction_list"
  | "unknown";

export interface ExtractedItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ExtractedTransaction {
  name: string;
  amount: number;
  date: string | null;
  direction: "out" | "in";
  category?: CategoryKey;
}

export interface ExtractedDocument {
  kind: ExtractedKind;
  merchant: string | null;
  date: string | null; // format YYYY-MM-DD
  currency: string | null;
  items: ExtractedItem[];
  subtotal: number | null;
  taxAmount: number | null;
  serviceAmount: number | null;
  discountAmount: number | null;
  total: number | null;
  transactions: ExtractedTransaction[];
  suggestedCategory: CategoryKey;
  confidence: "high" | "medium" | "low";
  notes?: string | null;
}

/**
 * Parses numeric values safely from strings or numbers, stripping Rp, commas, dots.
 * For Indonesian Rupiah amounts (like 25.000 or 25,000 without decimals), treats periods/commas properly.
 */
function parseCleanNumber(val: unknown): number | null {
  if (typeof val === "number") {
    return isNaN(val) ? null : Math.max(0, val);
  }
  if (typeof val !== "string") return null;

  const raw = val.trim();
  if (!raw) return null;

  // Strip currency prefixes and whitespace
  let clean = raw.replace(/^(?:rp\.?|idr|\$)\s*/i, "").trim();

  // If format is like 25.000 or 1.250.000 (thousand dot separators)
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(clean)) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(clean)) {
    // Format like 1,250,000.00 (standard US/en comma separators)
    clean = clean.replace(/,/g, "");
  } else {
    // Generic fallback: remove non-digits except single decimal point
    clean = clean.replace(/[^0-9.]/g, "");
  }

  const num = parseFloat(clean);
  return isNaN(num) ? null : Math.max(0, num);
}

function isValidDateString(str: unknown): str is string {
  if (typeof str !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(str.trim());
}

function normalizeCategory(cat: unknown): CategoryKey {
  if (typeof cat === "string") {
    const trimmed = cat.trim();
    if (CATEGORY_KEYS.includes(trimmed as CategoryKey)) {
      return trimmed as CategoryKey;
    }
    const lower = trimmed.toLowerCase();
    if (lower.includes("food") || lower.includes("makan") || lower.includes("resto") || lower.includes("cafe")) {
      return "Food & Dining";
    }
    if (lower.includes("trans") || lower.includes("bensin") || lower.includes("ojek") || lower.includes("parkir")) {
      return "Transportation";
    }
    if (lower.includes("util") || lower.includes("listrik") || lower.includes("air") || lower.includes("pulsa") || lower.includes("internet")) {
      return "Utilities";
    }
    if (lower.includes("acad") || lower.includes("kuliah") || lower.includes("buku") || lower.includes("kursus")) {
      return "Academics";
    }
    if (lower.includes("enter") || lower.includes("hiburan") || lower.includes("game") || lower.includes("bioskop") || lower.includes("nonton")) {
      return "Entertainment";
    }
  }
  return "Others";
}

/**
 * Normalizes raw structured data returned by vision LLM into a well-typed ExtractedDocument.
 * Performs sanity checks, fallback dates, and item reconciliation.
 */
export function normalizeExtraction(
  raw: unknown,
  fallbackDate?: string
): ExtractedDocument {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  let kind: ExtractedKind = "unknown";
  const rawKind = String(data.kind || "").toLowerCase();
  if (
    rawKind === "receipt" ||
    rawKind === "bank_transaction" ||
    rawKind === "transaction_list"
  ) {
    kind = rawKind;
  }

  const merchant = typeof data.merchant === "string" && data.merchant.trim() ? data.merchant.trim() : null;

  let date: string | null = null;
  if (isValidDateString(data.date)) {
    date = data.date.trim();
  } else if (typeof data.date === "string" && data.date.trim()) {
    // Attempt parsing ISO or dates like 2026/10/11 or 11/10/2026
    const cleanDateStr = data.date.trim().replace(/\//g, "-");
    const isoMatch = cleanDateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
  }
  if (!date && fallbackDate) {
    date = fallbackDate;
  }

  const currency = typeof data.currency === "string" && data.currency.trim() ? data.currency.trim().toUpperCase() : "IDR";

  // Items
  const items: ExtractedItem[] = [];
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      if (!it || typeof it !== "object") continue;
      const itemName = typeof it.name === "string" ? it.name.trim() : "";
      if (!itemName) continue;

      const qty = Math.max(1, Math.round(parseCleanNumber(it.quantity) || 1));
      const price = parseCleanNumber(it.unitPrice ?? it.price ?? it.amount) || 0;

      items.push({
        name: itemName,
        quantity: qty,
        unitPrice: price,
      });
    }
  }

  const subtotal = parseCleanNumber(data.subtotal);
  const taxAmount = parseCleanNumber(data.taxAmount ?? data.tax);
  const serviceAmount = parseCleanNumber(data.serviceAmount ?? data.serviceCharge ?? data.service);
  const discountAmount = parseCleanNumber(data.discountAmount ?? data.discount);
  let total = parseCleanNumber(data.total ?? data.grandTotal);

  // If total is missing on receipt but items exist, compute total
  if (total === null || total === 0) {
    if (items.length > 0) {
      const itemsSum = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      total = itemsSum + (taxAmount || 0) + (serviceAmount || 0) - (discountAmount || 0);
    }
  }

  // Transactions (for bank / e-wallet statements or transaction lists)
  const transactions: ExtractedTransaction[] = [];
  if (Array.isArray(data.transactions)) {
    for (const tx of data.transactions) {
      if (!tx || typeof tx !== "object") continue;
      const txName = typeof tx.name === "string" ? tx.name.trim() : typeof tx.description === "string" ? tx.description.trim() : "";
      const txAmount = parseCleanNumber(tx.amount);
      if (!txName || txAmount === null || txAmount <= 0) continue;

      const txDate = isValidDateString(tx.date) ? tx.date.trim() : date;
      const txDir: "out" | "in" =
        tx.direction === "in" || String(tx.type).toLowerCase() === "income" || String(tx.type).toLowerCase() === "cr"
          ? "in"
          : "out";

      transactions.push({
        name: txName,
        amount: txAmount,
        date: txDate,
        direction: txDir,
        category: tx.category ? normalizeCategory(tx.category) : undefined,
      });
    }
  }

  // If transactions are empty but this is a bank transaction, convert single total into transaction
  if (transactions.length === 0 && (kind === "bank_transaction" || (!items.length && total && total > 0))) {
    transactions.push({
      name: merchant || "Transfer / Pembayaran",
      amount: total || 0,
      date,
      direction: "out",
    });
  }

  // Determine kind if unknown
  if (kind === "unknown") {
    if (items.length > 0 || (taxAmount !== null || serviceAmount !== null)) {
      kind = "receipt";
    } else if (transactions.length > 1) {
      kind = "transaction_list";
    } else if (total && total > 0) {
      kind = "bank_transaction";
    }
  }

  const suggestedCategory = normalizeCategory(data.suggestedCategory || data.category);

  // Confidence check
  let confidence: "high" | "medium" | "low" = "high";
  if (kind === "receipt" && items.length > 0 && total && total > 0) {
    const sumItems = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const expected = sumItems + (taxAmount || 0) + (serviceAmount || 0) - (discountAmount || 0);
    // If difference is more than 5% or 5,000
    if (Math.abs(expected - total) > Math.max(5000, total * 0.05)) {
      confidence = "medium";
    }
  }
  if (!total && transactions.length === 0 && items.length === 0) {
    confidence = "low";
  }

  return {
    kind,
    merchant,
    date,
    currency,
    items,
    subtotal,
    taxAmount,
    serviceAmount,
    discountAmount,
    total,
    transactions,
    suggestedCategory,
    confidence,
    notes: typeof data.notes === "string" ? data.notes.trim() : null,
  };
}
