"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { CandidateExpense, DuplicateMatch, findDuplicates, ExpenseLite } from "@/utils/ai/duplicates";
import { subDays, addDays, parseISO, format } from "date-fns";

export async function checkDuplicatesAction(
  candidates: CandidateExpense[]
): Promise<(DuplicateMatch | null)[]> {
  if (!candidates || candidates.length === 0) return [];

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return candidates.map(() => null);
  }

  // Find overall min and max dates across candidates
  let minDate = candidates[0].spentAt;
  let maxDate = candidates[0].spentAt;

  for (const c of candidates) {
    if (c.spentAt < minDate) minDate = c.spentAt;
    if (c.spentAt > maxDate) maxDate = c.spentAt;
  }

  // Buffer by -2 days and +2 days
  let startDateStr = minDate;
  let endDateStr = maxDate;
  try {
    startDateStr = format(subDays(parseISO(minDate), 2), "yyyy-MM-dd");
    endDateStr = format(addDays(parseISO(maxDate), 2), "yyyy-MM-dd");
  } catch {
    // Keep raw
  }

  const { data: existingRows, error: fetchError } = await supabase
    .from("expenses")
    .select("id, name, amount, spent_at, category")
    .eq("user_id", user.id)
    .gte("spent_at", startDateStr)
    .lte("spent_at", endDateStr)
    .order("spent_at", { ascending: false })
    .limit(300);

  if (fetchError || !existingRows) {
    return candidates.map(() => null);
  }

  const existingExpenses: ExpenseLite[] = existingRows.map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount) || 0,
    spent_at: r.spent_at,
    category: r.category,
  }));

  return findDuplicates(candidates, existingExpenses);
}
