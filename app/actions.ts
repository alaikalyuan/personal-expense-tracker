"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!name) {
    throw new Error("Expense name is required");
  }

  await supabase.from("expenses").insert({
    user_id: user.id,
    category,
    name,
    note,
    amount,
    spent_at: spentAt,
  });

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

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!name) {
    throw new Error("Expense name is required");
  }

  await supabase
    .from("expenses")
    .update({
      category,
      name,
      note,
      amount,
      spent_at: spentAt,
    })
    .eq("id", id)
    .eq("user_id", user.id);

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

  await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

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