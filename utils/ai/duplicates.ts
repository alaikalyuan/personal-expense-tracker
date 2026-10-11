import { parseISO, differenceInCalendarDays } from "date-fns";

export interface ExpenseLite {
  id: string;
  name: string;
  amount: number;
  spent_at: string;
  category?: string;
}

export interface CandidateExpense {
  name: string;
  amount: number;
  spentAt: string;
  category?: string;
}

export interface DuplicateMatch {
  existing: ExpenseLite;
  reason: "exact" | "likely";
  details: string;
}

/**
 * Normalizes item names for token similarity comparison.
 * e.g. "KOPI KENANGAN - MALL" -> ["kopi", "kenangan", "mall"]
 */
function tokenize(text: string): Set<string> {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
  const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
  return new Set(tokens);
}

/**
 * Calculates Jaccard token overlap between two strings (0.0 to 1.0).
 */
function tokenSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks whether candidate expenses match existing transactions.
 * Returns an array of matches corresponding index-for-index with candidates.
 */
export function findDuplicates(
  candidates: CandidateExpense[],
  existingExpenses: ExpenseLite[]
): (DuplicateMatch | null)[] {
  // Track claimed existing IDs so multiple identical candidates don't both falsely claim one single existing expense
  const claimedExistingIds = new Set<string>();

  return candidates.map((candidate) => {
    const candAmt = Math.round(candidate.amount);
    if (candAmt <= 0) return null;

    let bestMatch: DuplicateMatch | null = null;

    for (const existing of existingExpenses) {
      if (claimedExistingIds.has(existing.id)) continue;

      const existAmt = Math.round(existing.amount);
      const isSameAmount = Math.abs(candAmt - existAmt) <= Math.max(1, candAmt * 0.01);
      if (!isSameAmount) continue;

      // Date difference
      let daysDiff = 999;
      try {
        const d1 = parseISO(candidate.spentAt);
        const d2 = parseISO(existing.spent_at);
        daysDiff = Math.abs(differenceInCalendarDays(d1, d2));
      } catch {
        daysDiff = candidate.spentAt === existing.spent_at ? 0 : 999;
      }

      const sim = tokenSimilarity(candidate.name, existing.name);

      // Exact criteria: same amount, same date, similar name
      if (daysDiff === 0 && (sim >= 0.4 || candidate.name.toLowerCase() === existing.name.toLowerCase())) {
        bestMatch = {
          existing,
          reason: "exact",
          details: `Transaksi serupa "${existing.name}" (Rp ${existAmt.toLocaleString()}) sudah ada di tanggal yang sama.`,
        };
        break;
      }

      // Exact date & same amount (even if merchant name variation, e.g. "GrabFood" vs "Gojek Food")
      if (daysDiff === 0) {
        bestMatch = {
          existing,
          reason: "likely",
          details: `Nominal sama (Rp ${existAmt.toLocaleString()}) ditemukan pada hari ini: "${existing.name}".`,
        };
        // Keep looking in case an exact name match exists
        continue;
      }

      // Date within +/- 1 day and token overlap (receipt timestamp lag)
      if (daysDiff <= 1 && sim >= 0.3) {
        if (!bestMatch) {
          bestMatch = {
            existing,
            reason: "likely",
            details: `Transaksi serupa "${existing.name}" (Rp ${existAmt.toLocaleString()}) ditemukan pada ${existing.spent_at}.`,
          };
        }
      }
    }

    if (bestMatch) {
      claimedExistingIds.add(bestMatch.existing.id);
    }

    return bestMatch;
  });
}
