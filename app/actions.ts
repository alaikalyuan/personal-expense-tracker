"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getTodayString } from "@/utils/date";

export async function login(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/");
}

export async function signup(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
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
}