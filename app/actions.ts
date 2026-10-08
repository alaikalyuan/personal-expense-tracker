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
    const rowsToInsert = guestExpenses.map((expense) => ({
      ...expense,
      user_id: newUserId,
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
    const rowsToInsert = guestExpenses.map((expense) => ({
      ...expense,
      user_id: newUserId,
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

  const { error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
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
    const rowsToInsert = guestExpenses.map((expense) => ({
      ...expense,
      user_id: newUserId,
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

  let walletId = (formData.get("wallet_id") as string)?.trim() || null;
  if (!walletId || walletId === "all") {
    const { spendingWallet } = await getPrimaryWallets(supabase, user.id, user.user_metadata);
    walletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
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

  // Dual-write: update primary wallet in wallets table
  try {
    await supabase
      .from("wallets")
      .update({ weekly_budget: budget, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_primary", true);
  } catch (err) {
    console.error("Error updating weekly_budget in wallets:", err);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      weekly_budget: budget,
    },
  });

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

  // Dual-write: update primary wallet in wallets table
  try {
    await supabase
      .from("wallets")
      .update({ monthly_budget: budget, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_primary", true);
  } catch (err) {
    console.error("Error updating monthly_budget in wallets:", err);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      monthly_budget: budget,
    },
  });

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

  // Dual-write to savings_goals table
  try {
    const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
    if (stashWalletId) {
      await supabase.from("savings_goals").insert({
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
    }
  } catch (err) {
    console.error("Error inserting into savings_goals table:", err);
  }

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const newGoal: SavingsGoal = {
    id: newGoalId,
    name,
    targetAmount,
    allocatedAmount: 0,
    emoji,
    createdAt: createdAtIso,
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_goals: [...existingGoals, newGoal],
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
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

  // Dual-write to savings_goals table
  try {
    await supabase
      .from("savings_goals")
      .update({
        name,
        target_amount: targetAmount,
        emoji,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);
  } catch (err) {
    console.error("Error updating savings_goals table:", err);
  }

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const updatedGoals = existingGoals.map((g) =>
    g.id === id ? { ...g, name, targetAmount, emoji } : g
  );

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_goals: updatedGoals,
    },
  });

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

  // Dual-write to savings_goals table
  try {
    await supabase
      .from("savings_goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", user.id);
  } catch (err) {
    console.error("Error deleting from savings_goals table:", err);
  }

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const targetGoal = existingGoals.find((g) => g.id === goalId);
  const updatedGoals = existingGoals.filter((g) => g.id !== goalId);

  const updateData: Record<string, unknown> = {
    savings_goals: updatedGoals,
  };

  if (targetGoal && Number(targetGoal.allocatedAmount || 0) > 0) {
    const currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
    const existingHistory: SavingsHistoryItem[] = Array.isArray(user.user_metadata?.savings_history)
      ? user.user_metadata.savings_history
      : [];

    const refundId = crypto.randomUUID();
    const refundNote = `Pengembalian dana dari penghapusan ${targetGoal.emoji || "🎯"} ${targetGoal.name}`;

    try {
      const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
      if (stashWalletId) {
        await supabase.from("wallet_transactions").insert({
          id: refundId,
          user_id: user.id,
          type: "goal_withdraw",
          amount: Number(targetGoal.allocatedAmount),
          currency: "IDR",
          from_wallet_id: stashWalletId,
          to_wallet_id: stashWalletId,
          note: refundNote,
          occurred_on: getTodayString(),
        });
      }
    } catch (err) {
      console.error("Error inserting refund transaction:", err);
    }

    const newEntry: SavingsHistoryItem = {
      id: refundId,
      type: "goal_withdraw",
      amount: Number(targetGoal.allocatedAmount),
      balanceAfter: currentManual,
      note: refundNote,
      goalId,
      goalName: targetGoal.name,
      goalEmoji: targetGoal.emoji,
      createdAt: new Date().toISOString(),
    };

    updateData.savings_history = [newEntry, ...existingHistory].slice(0, 200);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: updateData,
  });

  if (updateError) {
    throw new Error(updateError.message);
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

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const targetGoal = existingGoals.find((g) => g.id === goalId);
  const updatedGoals = existingGoals.map((g) => {
    if (g.id === goalId) {
      return {
        ...g,
        allocatedAmount: Number(g.allocatedAmount || 0) + amount,
      };
    }
    return g;
  });

  const txId = crypto.randomUUID();
  const note = `Alokasi dana ke ${targetGoal?.emoji || "🎯"} ${targetGoal?.name || "Target"}`;

  // Dual-write to database
  try {
    const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
    if (stashWalletId) {
      const newAllocated = Number(targetGoal?.allocatedAmount || 0) + amount;
      await supabase
        .from("savings_goals")
        .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
        .eq("id", goalId)
        .eq("user_id", user.id);

      await supabase.from("wallet_transactions").insert({
        id: txId,
        user_id: user.id,
        type: "goal_allocate",
        amount,
        currency: "IDR",
        from_wallet_id: stashWalletId,
        to_wallet_id: stashWalletId,
        goal_id: goalId,
        note,
        occurred_on: getTodayString(),
      });
    }
  } catch (err) {
    console.error("Error dual-writing allocateSavingsToGoal:", err);
  }

  const currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
  const existingHistory: SavingsHistoryItem[] = Array.isArray(user.user_metadata?.savings_history)
    ? user.user_metadata.savings_history
    : [];

  const newEntry: SavingsHistoryItem = {
    id: txId,
    type: "goal_allocate",
    amount,
    balanceAfter: currentManual,
    note,
    goalId,
    goalName: targetGoal?.name,
    goalEmoji: targetGoal?.emoji,
    createdAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_goals: updatedGoals,
      savings_history: [newEntry, ...existingHistory].slice(0, 200),
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

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

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const targetGoal = existingGoals.find((g) => g.id === goalId);
  const updatedGoals = existingGoals.map((g) => {
    if (g.id === goalId) {
      const current = Number(g.allocatedAmount || 0);
      return {
        ...g,
        allocatedAmount: Math.max(0, current - amount),
      };
    }
    return g;
  });

  const txId = crypto.randomUUID();
  const note = `Penarikan dana dari ${targetGoal?.emoji || "🎯"} ${targetGoal?.name || "Target"}`;

  // Dual-write to database
  try {
    const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
    if (stashWalletId) {
      const current = Number(targetGoal?.allocatedAmount || 0);
      const newAllocated = Math.max(0, current - amount);
      await supabase
        .from("savings_goals")
        .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
        .eq("id", goalId)
        .eq("user_id", user.id);

      await supabase.from("wallet_transactions").insert({
        id: txId,
        user_id: user.id,
        type: "goal_withdraw",
        amount,
        currency: "IDR",
        from_wallet_id: stashWalletId,
        to_wallet_id: stashWalletId,
        goal_id: goalId,
        note,
        occurred_on: getTodayString(),
      });
    }
  } catch (err) {
    console.error("Error dual-writing withdrawSavingsFromGoal:", err);
  }

  const currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
  const existingHistory: SavingsHistoryItem[] = Array.isArray(user.user_metadata?.savings_history)
    ? user.user_metadata.savings_history
    : [];

  const newEntry: SavingsHistoryItem = {
    id: txId,
    type: "goal_withdraw",
    amount,
    balanceAfter: currentManual,
    note,
    goalId,
    goalName: targetGoal?.name,
    goalEmoji: targetGoal?.emoji,
    createdAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_goals: updatedGoals,
      savings_history: [newEntry, ...existingHistory].slice(0, 200),
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/savings");
}

export async function patchWeekWithSavings(weekId: string, amount: number) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  if (!weekId || isNaN(amount) || amount <= 0) {
    throw new Error("Invalid patch amount or week");
  }

  const existingPatches: Record<string, WeekPatch> =
    user.user_metadata?.savings_patches && typeof user.user_metadata.savings_patches === "object"
      ? user.user_metadata.savings_patches
      : {};

  const updatedPatches = {
    ...existingPatches,
    [weekId]: {
      amount,
      patchedAt: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_patches: updatedPatches,
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/savings");
  revalidatePath("/archive");
}

export async function unpatchWeek(weekId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const existingPatches: Record<string, WeekPatch> =
    user.user_metadata?.savings_patches && typeof user.user_metadata.savings_patches === "object"
      ? { ...user.user_metadata.savings_patches }
      : {};

  delete existingPatches[weekId];

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_patches: existingPatches,
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/savings");
  revalidatePath("/archive");
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

  const txId = crypto.randomUUID();
  const txNote = note || (type === "deposit" ? "Setor ke Tabungan" : "Penarikan Tabungan");

  // Dual-write to wallet_transactions table
  try {
    const { stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
    if (stashWalletId) {
      await supabase.from("wallet_transactions").insert({
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
    }
  } catch (err) {
    console.error("Error dual-writing recordManualSavingsAdjustment:", err);
  }

  const currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
  const updatedManual = type === "deposit" ? currentManual + amount : Math.max(0, currentManual - amount);

  const existingHistory: SavingsHistoryItem[] = Array.isArray(user.user_metadata?.savings_history)
    ? user.user_metadata.savings_history
    : [];

  const baseHistory: SavingsHistoryItem[] =
    existingHistory.length === 0 && currentManual > 0
      ? [
          {
            id: "initial-balance",
            type: "manual_deposit",
            amount: currentManual,
            balanceAfter: currentManual,
            note: "Saldo awal tercatat",
            createdAt: user.created_at || new Date().toISOString(),
          },
        ]
      : existingHistory;

  const newEntry: SavingsHistoryItem = {
    id: txId,
    type: type === "deposit" ? "manual_deposit" : "manual_withdraw",
    amount,
    balanceAfter: updatedManual,
    note: txNote,
    createdAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_manual_deposit: updatedManual,
      savings_history: [newEntry, ...baseHistory].slice(0, 200),
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
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

  const currentSwept = Number(user.user_metadata?.savings_swept_surplus || 0);
  const updatedSwept = currentSwept + amount;

  const currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
  const updatedManual = currentManual + amount;

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  let targetGoal: SavingsGoal | undefined;
  let updatedGoals = existingGoals;

  if (targetGoalId) {
    targetGoal = existingGoals.find((g) => g.id === targetGoalId);
    updatedGoals = existingGoals.map((g) => {
      if (g.id === targetGoalId) {
        return {
          ...g,
          allocatedAmount: Number(g.allocatedAmount || 0) + amount,
        };
      }
      return g;
    });
  }

  const txId = crypto.randomUUID();
  const txNote = targetGoal
    ? `Aliran sisa anggaran ke ${targetGoal.emoji || "🎯"} ${targetGoal.name}`
    : "Aliran sisa anggaran mingguan ke tabungan";

  // Dual-write to database
  try {
    const { spendingWalletId, stashWalletId } = await getOrCreateUserWallets(supabase, user.id);
    if (stashWalletId) {
      if (targetGoalId) {
        await supabase
          .from("savings_goals")
          .update({
            allocated_amount: Number(targetGoal?.allocatedAmount || 0) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetGoalId)
          .eq("user_id", user.id);
      }

      await supabase.from("wallet_transactions").insert({
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
    }
  } catch (err) {
    console.error("Error dual-writing sweepSurplusToSavings:", err);
  }

  const existingHistory: SavingsHistoryItem[] = Array.isArray(user.user_metadata?.savings_history)
    ? user.user_metadata.savings_history
    : [];

  const baseHistory: SavingsHistoryItem[] =
    existingHistory.length === 0 && currentManual > 0
      ? [
          {
            id: "initial-balance",
            type: "manual_deposit",
            amount: currentManual,
            balanceAfter: currentManual,
            note: "Saldo awal tercatat",
            createdAt: user.created_at || new Date().toISOString(),
          },
        ]
      : existingHistory;

  const newEntry: SavingsHistoryItem = {
    id: txId,
    type: targetGoalId ? "surplus_sweep_goal" : "surplus_sweep",
    amount,
    balanceAfter: updatedManual,
    note: txNote,
    goalId: targetGoal?.id,
    goalName: targetGoal?.name,
    goalEmoji: targetGoal?.emoji,
    createdAt: new Date().toISOString(),
  };

  const updateData: Record<string, unknown> = {
    savings_swept_surplus: updatedSwept,
    savings_manual_deposit: updatedManual,
    savings_history: [newEntry, ...baseHistory].slice(0, 200),
  };

  if (targetGoalId) {
    updateData.savings_goals = updatedGoals;
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: updateData,
  });

  if (updateError) {
    throw new Error(updateError.message);
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

  // Delete from wallet_transactions table
  try {
    await supabase
      .from("wallet_transactions")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);
  } catch (err) {
    console.error("Error deleting from wallet_transactions table:", err);
  }

  const existingHistory: SavingsHistoryItem[] = Array.isArray(user.user_metadata?.savings_history)
    ? user.user_metadata.savings_history
    : [];

  const entry = existingHistory.find((item) => item.id === entryId);
  if (!entry) {
    revalidatePath("/savings");
    return;
  }

  let currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
  let currentSwept = Number(user.user_metadata?.savings_swept_surplus || 0);
  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];
  let updatedGoals = existingGoals;

  // Revert the effect of the entry
  if (entry.type === "manual_deposit") {
    currentManual = Math.max(0, currentManual - entry.amount);
  } else if (entry.type === "manual_withdraw") {
    currentManual = currentManual + entry.amount;
  } else if (entry.type === "surplus_sweep") {
    currentManual = Math.max(0, currentManual - entry.amount);
    currentSwept = Math.max(0, currentSwept - entry.amount);
  } else if (entry.type === "surplus_sweep_goal") {
    currentManual = Math.max(0, currentManual - entry.amount);
    currentSwept = Math.max(0, currentSwept - entry.amount);
    if (entry.goalId) {
      updatedGoals = existingGoals.map((g) =>
        g.id === entry.goalId
          ? { ...g, allocatedAmount: Math.max(0, Number(g.allocatedAmount || 0) - entry.amount) }
          : g
      );
      try {
        const targetGoal = existingGoals.find((g) => g.id === entry.goalId);
        const newAllocated = Math.max(0, Number(targetGoal?.allocatedAmount || 0) - entry.amount);
        await supabase
          .from("savings_goals")
          .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
          .eq("id", entry.goalId)
          .eq("user_id", user.id);
      } catch (e) {
        console.error("Error updating goal on delete history:", e);
      }
    }
  } else if (entry.type === "goal_allocate") {
    if (entry.goalId) {
      updatedGoals = existingGoals.map((g) =>
        g.id === entry.goalId
          ? { ...g, allocatedAmount: Math.max(0, Number(g.allocatedAmount || 0) - entry.amount) }
          : g
      );
      try {
        const targetGoal = existingGoals.find((g) => g.id === entry.goalId);
        const newAllocated = Math.max(0, Number(targetGoal?.allocatedAmount || 0) - entry.amount);
        await supabase
          .from("savings_goals")
          .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
          .eq("id", entry.goalId)
          .eq("user_id", user.id);
      } catch (e) {
        console.error("Error updating goal on delete history:", e);
      }
    }
  } else if (entry.type === "goal_withdraw") {
    if (entry.goalId) {
      updatedGoals = existingGoals.map((g) =>
        g.id === entry.goalId
          ? { ...g, allocatedAmount: Number(g.allocatedAmount || 0) + entry.amount }
          : g
      );
      try {
        const targetGoal = existingGoals.find((g) => g.id === entry.goalId);
        const newAllocated = Number(targetGoal?.allocatedAmount || 0) + entry.amount;
        await supabase
          .from("savings_goals")
          .update({ allocated_amount: newAllocated, updated_at: new Date().toISOString() })
          .eq("id", entry.goalId)
          .eq("user_id", user.id);
      } catch (e) {
        console.error("Error updating goal on delete history:", e);
      }
    }
  }

  const updatedHistory = existingHistory.filter((item) => item.id !== entryId);

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_manual_deposit: currentManual,
      savings_swept_surplus: currentSwept,
      savings_goals: updatedGoals,
      savings_history: updatedHistory,
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/savings");
}