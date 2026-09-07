export const ONE_OFF_TAG = "[one-off]";

export interface ExpenseItemLike {
  id?: string;
  name: string;
  amount: number;
  category: string;
  note?: string | null;
  spent_at: string;
  is_exempt?: boolean | null;
}

const ANOMALY_KEYWORDS = [
  // Indonesian
  "pajak",
  "stnk",
  "bpkb",
  "servis",
  "service",
  "bengkel",
  "dokter",
  "obat",
  "rumah sakit",
  "hospital",
  "klinik",
  "tiket",
  "pesawat",
  "flight",
  "hotel",
  "penginapan",
  "villa",
  "kado",
  "hadiah",
  "gift",
  "kondangan",
  "nikahan",
  "wedding",
  "ukt",
  "spp",
  "kursus",
  "semester",
  "dp",
  "gadget",
  "hp",
  "laptop",
  "elektronik",
  "furnitur",
  "kasur",
  "renovasi",
  "splurge",
  "one-off",
  "tahunan",
  // English
  "tax",
  "repair",
  "dentist",
  "tuition",
  "annual",
  "insurance",
  "asuransi",
];

/**
 * Checks if an expense is marked as an exempt one-off splurge.
 */
export function isExpenseExempt(item: { is_exempt?: boolean | null; note?: string | null }): boolean {
  if (item.is_exempt === true) return true;
  if (!item.note) return false;
  const lower = item.note.toLowerCase();
  return (
    lower.includes(ONE_OFF_TAG) ||
    lower.includes("#one-off") ||
    lower.includes("[splurge]") ||
    lower.includes("#splurge")
  );
}

/**
 * Strips the [one-off] tag from user notes for clean display.
 */
export function cleanNote(note?: string | null): string {
  if (!note) return "";
  return note
    .replace(/\[one-off\]/gi, "")
    .replace(/#one-off/gi, "")
    .replace(/\[splurge\]/gi, "")
    .replace(/#splurge/gi, "")
    .trim();
}

/**
 * Adds or removes the [one-off] tag to/from the note.
 */
export function attachExemptTag(note?: string | null, isExempt: boolean = true): string {
  const cleaned = cleanNote(note);
  if (!isExempt) return cleaned;
  return cleaned ? `${cleaned} ${ONE_OFF_TAG}` : ONE_OFF_TAG;
}

/**
 * Detects if an expense being entered is a likely one-off anomaly.
 */
export function detectOneOffAnomaly(
  name: string,
  amount: number,
  weeklyBudget: number = 500000
): boolean {
  if (amount <= 0 && !name) return false;

  // 1. Check amount: >= 50% of weekly budget or >= 300,000 IDR
  const threshold = Math.min(Math.max(weeklyBudget * 0.5, 100000), 500000);
  const isLargeAmount = amount >= threshold || amount >= 300000;

  // 2. Check keywords in name
  const nameLower = (name || "").toLowerCase();
  const hasKeyword = ANOMALY_KEYWORDS.some((kw) => nameLower.includes(kw));

  return isLargeAmount || (hasKeyword && amount >= 50000);
}

/**
 * Separates regular operational expenses from exempt one-offs.
 */
export function calculateExemptTotals<T extends ExpenseItemLike>(expenses: T[]) {
  let totalSpend = 0;
  let regularTotal = 0;
  let exemptTotal = 0;
  let exemptCount = 0;
  const exemptExpenses: T[] = [];
  const regularExpenses: T[] = [];

  (expenses || []).forEach((item) => {
    const amt = Number(item.amount) || 0;
    totalSpend += amt;
    if (isExpenseExempt(item)) {
      exemptTotal += amt;
      exemptCount++;
      exemptExpenses.push(item);
    } else {
      regularTotal += amt;
      regularExpenses.push(item);
    }
  });

  return {
    totalSpend,
    regularTotal,
    exemptTotal,
    exemptCount,
    exemptExpenses,
    regularExpenses,
  };
}
