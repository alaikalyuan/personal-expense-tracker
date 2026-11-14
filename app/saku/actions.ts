"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getTodayString } from "@/utils/date";
import {
  getUserSettings,
  getWallets,
  getWalletBalanceForCheck,
  Wallet,
  FEATURE_MULTI_SAKU_ENABLED,
} from "@/utils/wallets/server";
import { formatRupiahInput, parseRupiahAmount } from "@/utils/money";
import type { ParseMoneyOptions } from "@/utils/money";

/** A rupiah amount sent by a client, validated with the same parser as the money fields. */
function readRupiahAmount(input: unknown, opts?: ParseMoneyOptions): number {
  const parsed = parseRupiahAmount(input, opts);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

/** An optional budget field: empty or 0 means "no budget". */
function readOptionalBudget(input: FormDataEntryValue | null): number | null {
  if (input === null || input === "") return null;
  const value = readRupiahAmount(input, { allowZero: true });
  return value > 0 ? value : null;
}

export async function getActiveWallets(): Promise<Wallet[]> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  return getWallets(supabase, user.id);
}

export async function setMultiSakuEnabled(enabled: boolean) {
  if (enabled && !FEATURE_MULTI_SAKU_ENABLED) {
    throw new Error("Multi-Saku feature is currently paused.");
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // Update in user_settings table
  const { error: upsertError } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      multi_saku_enabled: enabled,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  // Store preference in cookie for fast synchronous server-component reading
  cookieStore.set("MULTI_SAKU_ENABLED", String(enabled), {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  revalidatePath("/saku");
  revalidatePath("/savings");
}

export async function setSelectedSaku(walletId: string) {
  const cookieStore = await cookies();
  cookieStore.set("SELECTED_SAKU", walletId, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/saku");
}

export async function createWallet(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const settings = await getUserSettings(supabase, user.id);

  const name = (formData.get("name") as string)?.trim();
  const kind = (formData.get("kind") as "spending" | "stash") || "spending";
  const emoji = (formData.get("emoji") as string)?.trim() || (kind === "spending" ? "👛" : "🏦");
  const color = (formData.get("color") as string)?.trim() || (kind === "spending" ? "#10b981" : "#0d9488");
  const trackBalance = formData.get("track_balance") === "true" || kind === "stash";
  const openingBalance = readRupiahAmount(formData.get("opening_balance") || "", { allowEmpty: true, allowZero: true });
  const weeklyBudget = readOptionalBudget(formData.get("weekly_budget"));
  const monthlyBudget = readOptionalBudget(formData.get("monthly_budget"));

  if (!name) {
    throw new Error("Wallet name is required");
  }

  const newWalletId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  // Insert wallet row
  const { error: insertError } = await supabase.from("wallets").insert({
    id: newWalletId,
    user_id: user.id,
    kind,
    name,
    emoji,
    color,
    currency: settings.base_currency,
    is_primary: false,
    track_balance: trackBalance,
    opening_balance: 0,
    weekly_budget: kind === "spending" ? weeklyBudget : null,
    monthly_budget: kind === "spending" ? monthlyBudget : null,
    sort_order: 10,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  // If an opening balance was specified, log as transaction for auditability
  if (openingBalance > 0 && trackBalance) {
    const { error: txError } = await supabase.from("wallet_transactions").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      type: "adjustment",
      amount: openingBalance,
      currency: settings.base_currency,
      to_wallet_id: newWalletId,
      note: "Saldo awal saku",
      occurred_on: getTodayString(),
    });

    if (txError) {
      console.error("Error creating initial balance transaction:", txError);
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
}

export async function updateWallet(formData: FormData) {
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
  const emoji = (formData.get("emoji") as string)?.trim();
  const color = (formData.get("color") as string)?.trim();
  const trackBalance = formData.get("track_balance") === "true";

  const weeklyBudget = readOptionalBudget(formData.get("weekly_budget"));
  const monthlyBudget = readOptionalBudget(formData.get("monthly_budget"));

  if (!id || !name) {
    throw new Error("Invalid wallet details");
  }

  const updateData: Record<string, unknown> = {
    name,
    updated_at: new Date().toISOString(),
  };

  if (emoji) updateData.emoji = emoji;
  if (color) updateData.color = color;
  if (formData.has("track_balance")) updateData.track_balance = trackBalance;
  if (formData.has("weekly_budget")) updateData.weekly_budget = weeklyBudget;
  if (formData.has("monthly_budget")) updateData.monthly_budget = monthlyBudget;

  const { error: updateError } = await supabase
    .from("wallets")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
}

export async function setWalletBudget(
  walletId: string,
  cadence: "week" | "month",
  amount: number | null
) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const budgetVal = amount !== null && !isNaN(amount) && amount > 0 ? amount : null;
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (cadence === "week") {
    updateData.weekly_budget = budgetVal;
  } else {
    updateData.monthly_budget = budgetVal;
  }

  const { data: updated, error: updateError } = await supabase
    .from("wallets")
    .update(updateData)
    .eq("id", walletId)
    .eq("user_id", user.id)
    .select("is_primary")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
  revalidatePath(`/saku/${walletId}`);
  revalidatePath("/compare");
}

export async function archiveWallet(walletId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // Check if primary
  const { data: wallet } = await supabase
    .from("wallets")
    .select("is_primary")
    .eq("id", walletId)
    .eq("user_id", user.id)
    .single();

  if (wallet?.is_primary) {
    throw new Error("Primary wallet cannot be archived");
  }

  const { error: archiveError } = await supabase
    .from("wallets")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", walletId)
    .eq("user_id", user.id);

  if (archiveError) {
    throw new Error(archiveError.message);
  }

  // If selected_saku cookie was pointing to this wallet, reset to 'all'
  const currentSelected = cookieStore.get("SELECTED_SAKU")?.value;
  if (currentSelected === walletId) {
    cookieStore.set("SELECTED_SAKU", "all", {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
}

export async function unarchiveWallet(walletId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { error: unarchiveError } = await supabase
    .from("wallets")
    .update({ archived_at: null })
    .eq("id", walletId)
    .eq("user_id", user.id);

  if (unarchiveError) {
    throw new Error(unarchiveError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
}

export async function transferBetweenWallets(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const fromWalletId = formData.get("from_wallet_id") as string;
  const toWalletId = formData.get("to_wallet_id") as string;
  const note = (formData.get("note") as string)?.trim() || "Transfer antar saku";
  const date = (formData.get("date") as string)?.trim() || getTodayString();

  if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
    throw new Error("Source and destination sakus must be different");
  }

  const amount = readRupiahAmount(formData.get("amount"));

  // A stash, or any saku that tracks its balance, can't send more than it holds.
  const source = await getWalletBalanceForCheck(supabase, user.id, fromWalletId);
  if (source.kind === "stash" || source.trackBalance) {
    const available = Math.max(0, source.currentBalance);
    readRupiahAmount(amount, {
      max: available,
      maxError: `Saldo saku asal tidak cukup. Saldo tersedia Rp ${formatRupiahInput(available)}.`,
    });
  }

  const { error: txError } = await supabase.from("wallet_transactions").insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    type: "transfer",
    amount,
    currency: "IDR",
    from_wallet_id: fromWalletId,
    to_wallet_id: toWalletId,
    note,
    occurred_on: date,
  });

  if (txError) {
    throw new Error(txError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
  revalidatePath("/savings");
}

export async function recordWalletIncome(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const walletId = formData.get("wallet_id") as string;
  const note = (formData.get("note") as string)?.trim() || "Pemasukan";
  const date = (formData.get("date") as string)?.trim() || getTodayString();

  if (!walletId) {
    throw new Error("Target saku is required");
  }

  const amount = readRupiahAmount(formData.get("amount"));

  const settings = await getUserSettings(supabase, user.id);

  const { error: txError } = await supabase.from("wallet_transactions").insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    type: "income",
    amount,
    currency: settings.base_currency,
    to_wallet_id: walletId,
    note,
    occurred_on: date,
  });

  if (txError) {
    throw new Error(txError.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/saku");
  revalidatePath("/savings");
}
