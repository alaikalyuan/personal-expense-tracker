"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getTodayString } from "@/utils/date";
import { attachExemptTag } from "@/utils/exemptions";

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

  const { error: insertError } = await supabase.from("expenses").insert({
    user_id: user.id,
    category,
    name,
    note,
    amount,
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

  const { data: updatedRows, error: updateError } = await supabase
    .from("expenses")
    .update({
      category,
      name,
      note,
      amount,
      spent_at: spentAt,
    })
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

export interface WeekPatch {
  amount: number;
  patchedAt: string;
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

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const newGoal: SavingsGoal = {
    id: crypto.randomUUID(),
    name,
    targetAmount,
    allocatedAmount: 0,
    emoji,
    createdAt: new Date().toISOString(),
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

  const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
    ? user.user_metadata.savings_goals
    : [];

  const updatedGoals = existingGoals.filter((g) => g.id !== goalId);

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

  const updatedGoals = existingGoals.map((g) => {
    if (g.id === goalId) {
      return {
        ...g,
        allocatedAmount: Number(g.allocatedAmount || 0) + amount,
      };
    }
    return g;
  });

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

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Invalid adjustment amount");
  }

  const currentManual = Number(user.user_metadata?.savings_manual_deposit || 0);
  const updatedManual = type === "deposit" ? currentManual + amount : currentManual - amount;

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      savings_manual_deposit: updatedManual,
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

  const updateData: Record<string, unknown> = {
    savings_swept_surplus: updatedSwept,
    savings_manual_deposit: updatedManual,
  };

  if (targetGoalId) {
    const existingGoals: SavingsGoal[] = Array.isArray(user.user_metadata?.savings_goals)
      ? user.user_metadata.savings_goals
      : [];

    const updatedGoals = existingGoals.map((g) => {
      if (g.id === targetGoalId) {
        return {
          ...g,
          allocatedAmount: Number(g.allocatedAmount || 0) + amount,
        };
      }
      return g;
    });

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