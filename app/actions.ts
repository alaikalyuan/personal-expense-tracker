"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getTodayString } from "@/utils/date";
import { attachExemptTag } from "@/utils/exemptions";
import { getPrimaryWallets } from "@/utils/wallets/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function login(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Capture any expenses created in current guest session before logging in
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

  // 2. Sign in to existing account
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // 3. If signed in successfully and we have guest expenses to merge, batch insert them
  const newUserId = authData?.user?.id;
  let mergedCount = 0;
  if (guestExpenses.length > 0 && newUserId && newUserId !== guestId) {
    const { spendingWallet } = await getPrimaryWallets(supabase, newUserId);
    const primaryWalletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
    const rowsToInsert = guestExpenses.map((expense) => ({
      ...expense,
      user_id: newUserId,
      wallet_id: primaryWalletId,
    }));
    const { error: insertError } = await supabase.from("expenses").insert(rowsToInsert);
    if (!insertError) {
      mergedCount = guestExpenses.length;
    } else {
      console.error("Failed to merge guest expenses on login:", insertError);
    }
  }

  revalidatePath("/", "layout");
  if (mergedCount > 0) {
    redirect(`/?merged=${mergedCount}`);
  }
  redirect("/");
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Capture any expenses created in current guest session before signing up
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

  const { data: authData, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  const newUserId = authData?.user?.id;
  let mergedCount = 0;
  if (guestExpenses.length > 0 && newUserId && newUserId !== guestId) {
    const { spendingWallet } = await getPrimaryWallets(supabase, newUserId);
    const primaryWalletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
    const rowsToInsert = guestExpenses.map((expense) => ({
      ...expense,
      user_id: newUserId,
      wallet_id: primaryWalletId,
    }));
    const { error: insertError } = await supabase.from("expenses").insert(rowsToInsert);
    if (!insertError) {
      mergedCount = guestExpenses.length;
    } else {
      console.error("Failed to merge guest expenses on signup:", insertError);
    }
  }

  revalidatePath("/", "layout");
  if (mergedCount > 0) {
    redirect(`/?merged=${mergedCount}`);
  }
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}

export async function continueAsGuest() {
  redirect("/auth/guest");
}

export async function upgradeGuestAccount(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { data: authData, error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const upgradedUserId = authData?.user?.id;
  if (upgradedUserId) {
    const { spendingWallet } = await getPrimaryWallets(supabase, upgradedUserId);
    const primaryWalletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
    if (primaryWalletId) {
      await supabase
        .from("expenses")
        .update({ wallet_id: primaryWalletId })
        .eq("user_id", upgradedUserId)
        .is("wallet_id", null);
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function modalLogin(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // 1. Capture any expenses created in current guest session before logging in
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

  // 2. Sign in to existing account
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  // 3. If signed in successfully and we have guest expenses to merge, batch insert them
  const newUserId = authData?.user?.id;
  let mergedCount = 0;
  if (guestExpenses.length > 0 && newUserId && newUserId !== guestId) {
    const { spendingWallet } = await getPrimaryWallets(supabase, newUserId);
    const primaryWalletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
    const rowsToInsert = guestExpenses.map((expense) => ({
      ...expense,
      user_id: newUserId,
      wallet_id: primaryWalletId,
    }));
    const { error: insertError } = await supabase.from("expenses").insert(rowsToInsert);
    if (!insertError) {
      mergedCount = guestExpenses.length;
    } else {
      console.error("Failed to merge guest expenses on modal login:", insertError);
    }
  }

  revalidatePath("/", "layout");
  return { success: true, mergedCount };
}

export async function addExpense(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const category = formData.get("category") as string;
  const name = (formData.get("name") as string)?.trim();
  const note = (formData.get("note") as string)?.trim() || null;
  const amount = Number(formData.get("amount"));
  const spentAt = formData.get("spent_at") as string;

  if (isNaN(amount) || amount < 0) {
    throw new Error("Amount must be greater than or equal to 0");
  }

  if (!name) {
    throw new Error("Expense name is required");
  }

  const isGuest = Boolean(user.is_anonymous);
  let walletId: string | null = null;
  if (!isGuest) {
    walletId = (formData.get("wallet_id") as string)?.trim() || null;
    if (!walletId || walletId === "all") {
      const { spendingWallet } = await getPrimaryWallets(supabase, user.id);
      walletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
    }
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    category,
    name,
    note,
    amount,
    spent_at: spentAt,
  };
  if (walletId) {
    insertData.wallet_id = walletId;
  }

  const { error: insertError } = await supabase.from("expenses").insert(insertData);

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/savings");
  revalidatePath("/saku");
  if (walletId) {
    revalidatePath(`/saku/${walletId}`);
  }
}

export interface AddExpenseBatchItem {
  name: string;
  amount: number;
  category: string;
  spentAt?: string;
  note?: string | null;
  walletId?: string | null;
}

export async function addExpensesBatch(items: AddExpenseBatchItem[]) {
  if (!items || items.length === 0) return [];

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const isGuest = Boolean(user.is_anonymous);
  let defaultWalletId: string | null = null;
  if (!isGuest) {
    const { spendingWallet } = await getPrimaryWallets(supabase, user.id);
    defaultWalletId =
      spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
  }

  const todayStr = getTodayString();
  const insertPayloads = items.map((item) => {
    const trimmedName = item.name?.trim();
    if (!trimmedName) throw new Error("Expense name is required for all items");
    const amt = Number(item.amount);
    if (isNaN(amt) || amt < 0) throw new Error("Amount must be greater than or equal to 0");

    let wId = isGuest ? null : (item.walletId?.trim() || null);
    if (!isGuest && (!wId || wId === "all")) {
      wId = defaultWalletId;
    }

    const row: Record<string, unknown> = {
      user_id: user.id,
      category: item.category || "Others",
      name: trimmedName,
      note: item.note?.trim() || null,
      amount: amt,
      spent_at: item.spentAt || todayStr,
    };
    if (wId) {
      row.wallet_id = wId;
    }
    return row;
  });

  const { data: inserted, error: insertError } = await supabase
    .from("expenses")
    .insert(insertPayloads)
    .select();

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/savings");
  revalidatePath("/saku");

  return inserted || [];
}

export async function logNoSpendDay(customDate?: string, locale: "id" | "en" = "id") {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const spentAt = customDate || getTodayString();
  const name = locale === "id" ? "Hari Tanpa Pengeluaran 🎉" : "No-Spend Day 🎉";
  const note = locale === "id" ? "Rp 0 pengeluaran. Hemat maksimal!" : "Rp 0 spent. Total save!";

  const { error: insertError } = await supabase.from("expenses").insert({
    user_id: user.id,
    category: "Others",
    name,
    note,
    amount: 0,
    spent_at: spentAt,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/savings");
}

export async function updateExpense(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const category = formData.get("category") as string;
  const name = (formData.get("name") as string)?.trim();
  const note = (formData.get("note") as string)?.trim() || null;
  const amount = Number(formData.get("amount"));
  const spentAt = formData.get("spent_at") as string;

  if (isNaN(amount) || amount < 0) {
    throw new Error("Amount must be greater than or equal to 0");
  }

  if (!name) {
    throw new Error("Expense name is required");
  }

  const rawWalletId = formData.get("wallet_id");
  const updatePayload: Record<string, unknown> = {
    category,
    name,
    note,
    amount,
    spent_at: spentAt,
  };
  if (rawWalletId !== null && rawWalletId !== undefined) {
    const val = String(rawWalletId).trim();
    if (val && val !== "all") {
      updatePayload.wallet_id = val;
    }
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("expenses")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error(
      "Failed to update expense: record not found or permission denied"
    );
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/savings");
  revalidatePath("/saku");
  const finalWalletId = updatedRows[0]?.wallet_id;
  if (finalWalletId) {
    revalidatePath(`/saku/${finalWalletId}`);
  }
}

export async function deleteExpense(id: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/savings");
}

export async function setWeeklyBudget(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const budget = Number(formData.get("budget"));
  if (isNaN(budget) || budget <= 0) {
    throw new Error("Invalid budget amount");
  }

  // Update primary wallet in wallets table
  const { error: updateError } = await supabase
    .from("wallets")
    .update({ weekly_budget: budget, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_primary", true);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/savings");
}

export async function setMonthlyBudget(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const budget = Number(formData.get("budget"));
  if (isNaN(budget) || budget <= 0) {
    throw new Error("Invalid budget amount");
  }

  // Update primary wallet in wallets table
  const { error: updateError } = await supabase
    .from("wallets")
    .update({ monthly_budget: budget, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_primary", true);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
}

export async function setDashboardCadence(cadence: "week" | "month") {
  const cookieStore = await cookies();
  cookieStore.set("dashboard_cadence", cadence, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}

export async function toggleExpenseExemption(id: string, isExempt: boolean) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("expenses")
    .select("note")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    throw new Error("Expense not found");
  }

  const updatedNote = attachExemptTag(existing.note, isExempt);

  const { error: updateError } = await supabase
    .from("expenses")
    .update({ note: updatedNote })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/savings");
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  allocatedAmount: number;
  emoji?: string;
  createdAt: string;
}

export type SavingsTransactionType =
  | "manual_deposit"
  | "manual_withdraw"
  | "surplus_sweep"
  | "surplus_sweep_goal"
  | "goal_allocate"
  | "goal_withdraw";

export interface SavingsHistoryItem {
  id: string;
  type: SavingsTransactionType;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
  goalId?: string;
  goalName?: string;
  goalEmoji?: string;
}

export interface WeekPatch {
  amount: number;
  patchedAt: string;
}

interface SimpleWalletRow {
  id: string;
  kind: string;
  is_primary: boolean;
}

async function getOrCreateUserWallets(supabase: SupabaseClient, userId: string) {
  try {
    const { data: wallets } = await supabase
      .from("wallets")
      .select("id, kind, is_primary")
      .eq("user_id", userId);

    const walletList = (wallets as unknown as SimpleWalletRow[]) || [];

    let spending =
      walletList.find((w) => w.is_primary && w.kind === "spending") ||
      walletList.find((w) => w.kind === "spending");
    let stash = walletList.find((w) => w.kind === "stash");

    if (!spending || !stash) {
      await supabase.rpc("ensure_default_wallets", { p_user_id: userId });
      const { data: refreshed } = await supabase
        .from("wallets")
        .select("id, kind, is_primary")
        .eq("user_id", userId);
      const refreshedList = (refreshed as unknown as SimpleWalletRow[]) || [];
      spending =
        refreshedList.find((w) => w.is_primary && w.kind === "spending") ||
        refreshedList.find((w) => w.kind === "spending");
      stash = refreshedList.find((w) => w.kind === "stash");
    }

    return {
      spendingWalletId: spending?.id || null,
      stashWalletId: stash?.id || null,
    };
  } catch (err) {
    console.error("getOrCreateUserWallets error:", err);
    return { spendingWalletId: null, stashWalletId: null };
  }
}

export async function createSavingsGoal(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const name = (formData.get("name") as string)?.trim();
  const targetAmount = Number(formData.get("target_amount"));
  const emoji = (formData.get("emoji") as string)?.trim() || "🎯";

  if (!name) {
    throw new Error("Goal name is required");
  }
  if (isNaN(targetAmount) || targetAmount <= 0) {
    throw new Error("Invalid target amount");
  }

  const newGoalId = crypto.randomUUID();
  const createdAtIso = new Date().toISOString();

  const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
  if (!stashWalletId) {
    throw new Error("Stash wallet not found");
  }

  const { error: insertError } = await supabase.from("savings_goals").insert({
    id: newGoalId,
    wallet_id: stashWalletId,
    user_id: user.id,
    name,
    emoji,
    target_amount: targetAmount,
    allocated_amount: 0,
    sort_order: 0,
    created_at: createdAtIso,
    updated_at: createdAtIso,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/savings");
}

export async function updateSavingsGoal(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const targetAmount = Number(formData.get("target_amount"));
  const emoji = (formData.get("emoji") as string)?.trim() || "🎯";

  if (!id || !name || isNaN(targetAmount) || targetAmount <= 0) {
    throw new Error("Invalid goal details");
  }

  const { error: updateError } = await supabase
    .from("savings_goals")
    .update({
      name,
      target_amount: targetAmount,
      emoji,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/savings");
}

export async function deleteSavingsGoal(goalId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // Check goal details for refund if allocated_amount > 0
  const { data: targetGoal } = await supabase
    .from("savings_goals")
    .select("name, emoji, allocated_amount, wallet_id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (targetGoal && Number(targetGoal.allocated_amount || 0) > 0) {
    const refundId = crypto.randomUUID();
    const refundNote = `Pengembalian dana dari penghapusan ${targetGoal.emoji || "🎯"} ${targetGoal.name}`;
    await supabase.from("wallet_transactions").insert({
      id: refundId,
      user_id: user.id,
      type: "goal_withdraw",
      amount: Number(targetGoal.allocated_amount),
      currency: "IDR",
      from_wallet_id: targetGoal.wallet_id,
      to_wallet_id: targetGoal.wallet_id,
      note: refundNote,
      occurred_on: getTodayString(),
    });
  }

  const { error: deleteError } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/savings");
}

export async function allocateSavingsToGoal(goalId: string, amount: number) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid allocation amount");
  }

  const { data: targetGoal } = await supabase
    .from("savings_goals")
    .select("name, emoji, allocated_amount, wallet_id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (!targetGoal) {
    throw new Error("Savings goal not found");
  }

  const newAllocated = Number(targetGoal.allocated_amount || 0) + amount;
  const { error: updateError } = await supabase
    .from("savings_goals")
    .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const txId = crypto.randomUUID();
  const note = `Alokasi dana ke ${targetGoal.emoji || "🎯"} ${targetGoal.name || "Target"}`;

  await supabase.from("wallet_transactions").insert({
    id: txId,
    user_id: user.id,
    type: "goal_allocate",
    amount,
    currency: "IDR",
    from_wallet_id: targetGoal.wallet_id,
    to_wallet_id: targetGoal.wallet_id,
    goal_id: goalId,
    note,
    occurred_on: getTodayString(),
  });

  revalidatePath("/savings");
}

export async function withdrawSavingsFromGoal(goalId: string, amount: number) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  const { data: targetGoal } = await supabase
    .from("savings_goals")
    .select("name, emoji, allocated_amount, wallet_id")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (!targetGoal) {
    throw new Error("Savings goal not found");
  }

  const current = Number(targetGoal.allocated_amount || 0);
  const newAllocated = Math.max(0, current - amount);

  const { error: updateError } = await supabase
    .from("savings_goals")
    .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const txId = crypto.randomUUID();
  const note = `Penarikan dana dari ${targetGoal.emoji || "🎯"} ${targetGoal.name || "Target"}`;

  await supabase.from("wallet_transactions").insert({
    id: txId,
    user_id: user.id,
    type: "goal_withdraw",
    amount,
    currency: "IDR",
    from_wallet_id: targetGoal.wallet_id,
    to_wallet_id: targetGoal.wallet_id,
    goal_id: goalId,
    note,
    occurred_on: getTodayString(),
  });

  revalidatePath("/savings");
}

export async function recordManualSavingsAdjustment(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const type = formData.get("type") as "deposit" | "withdraw";
  const amount = Number(formData.get("amount"));
  const note = (formData.get("note") as string)?.trim() || undefined;

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid adjustment amount");
  }

  const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
  if (!stashWalletId) {
    throw new Error("Stash wallet not found");
  }

  const txId = crypto.randomUUID();
  const txNote = note || (type === "deposit" ? "Setor ke Tabungan" : "Penarikan Tabungan");

  const { error: txError } = await supabase.from("wallet_transactions").insert({
    id: txId,
    user_id: user.id,
    type: "adjustment",
    amount,
    currency: "IDR",
    from_wallet_id: type === "withdraw" ? stashWalletId : null,
    to_wallet_id: type === "deposit" ? stashWalletId : null,
    note: txNote,
    occurred_on: getTodayString(),
  });

  if (txError) {
    throw new Error(txError.message);
  }

  revalidatePath("/savings");
}

export async function sweepSurplusToSavings(amount: number, targetGoalId?: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid sweep amount");
  }

  const { spendingWalletId, stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
  if (!stashWalletId) {
    throw new Error("Stash wallet not found");
  }

  let txNote = "Aliran sisa anggaran mingguan ke tabungan";
  if (targetGoalId) {
    const { data: goal } = await supabase
      .from("savings_goals")
      .select("name, emoji, allocated_amount")
      .eq("id", targetGoalId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (goal) {
      txNote = `Aliran sisa anggaran ke ${goal.emoji || "🎯"} ${goal.name}`;
      const newAllocated = Number(goal.allocated_amount || 0) + amount;
      await supabase
        .from("savings_goals")
        .update({
          allocated_amount: newAllocated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetGoalId)
        .eq("user_id", user.id);
    }
  }

  const txId = crypto.randomUUID();
  const { error: txError } = await supabase.from("wallet_transactions").insert({
    id: txId,
    user_id: user.id,
    type: "surplus_sweep",
    amount,
    currency: "IDR",
    from_wallet_id: spendingWalletId,
    to_wallet_id: stashWalletId,
    goal_id: targetGoalId || null,
    note: txNote,
    occurred_on: getTodayString(),
  });

  if (txError) {
    throw new Error(txError.message);
  }

  revalidatePath("/savings");
}

export async function deleteSavingsHistoryEntry(entryId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // Check transaction details first to reverse goal allocations if applicable
  const { data: entry } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, goal_id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!entry) {
    revalidatePath("/savings");
    return;
  }

  const entryAmount = Number(entry.amount || 0);

  // If entry affected a goal, reverse the goal allocation
  if (entry.goal_id) {
    const { data: targetGoal } = await supabase
      .from("savings_goals")
      .select("allocated_amount")
      .eq("id", entry.goal_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (targetGoal) {
      const current = Number(targetGoal.allocated_amount || 0);
      let newAllocated = current;
      if (entry.type === "surplus_sweep" || entry.type === "goal_allocate") {
        newAllocated = Math.max(0, current - entryAmount);
      } else if (entry.type === "goal_withdraw") {
        newAllocated = current + entryAmount;
      }

      await supabase
        .from("savings_goals")
        .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
        .eq("id", entry.goal_id)
        .eq("user_id", user.id);
    }
  }

  // Delete from wallet_transactions table
  const { error: deleteError } = await supabase
    .from("wallet_transactions")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/savings");
}