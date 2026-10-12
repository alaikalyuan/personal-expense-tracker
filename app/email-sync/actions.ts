"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getPrimaryWallets } from "@/utils/wallets/server";
import { parseLivinEmail, type ParsedLivinTransaction } from "@/utils/email/livinParser";
import crypto from "crypto";

export interface EmailSyncSettings {
  enabled: boolean;
  token: string;
  mode: "auto" | "review";
  targetWalletId: string | null;
  targetWalletName?: string;
  spendingWallets: Array<{ id: string; name: string; emoji: string; is_primary: boolean }>;
  pendingCount: number;
  lastVerificationCode?: string | null;
}

export interface PendingEmailTransaction {
  id: string;
  source: string;
  sender?: string | null;
  subject?: string | null;
  merchant_name: string;
  amount: number;
  currency: string;
  transaction_date: string;
  transaction_time?: string | null;
  reference_id?: string | null;
  suggested_category: string;
  target_wallet_id?: string | null;
  target_wallet_name?: string;
  status: "pending" | "approved" | "dismissed" | "auto_logged";
  created_at: string;
}

/**
 * Fetch current user's email sync settings and available spending wallets.
 */
export async function getEmailSyncSettings(): Promise<EmailSyncSettings | null> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // 1. Fetch user_settings
  let { data: settings } = await supabase
    .from("user_settings")
    .select("email_sync_enabled, email_sync_token, email_sync_mode, email_sync_wallet_id, last_email_verification_code")
    .eq("user_id", user.id)
    .maybeSingle();

  // Ensure record and token exist
  if (!settings || !settings.email_sync_token) {
    const newToken = crypto.randomBytes(16).toString("hex");
    const { data: updated } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        email_sync_enabled: true,
        email_sync_token: newToken,
        email_sync_mode: "review",
      })
      .select("email_sync_enabled, email_sync_token, email_sync_mode, email_sync_wallet_id, last_email_verification_code")
      .single();
    settings = updated;
  }

  // 2. Fetch spending wallets
  const { data: walletsData } = await supabase
    .from("wallets")
    .select("id, name, emoji, is_primary")
    .eq("user_id", user.id)
    .eq("kind", "spending")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  const spendingWallets = walletsData || [];

  // Find target wallet name if set
  const selectedWallet = spendingWallets.find((w) => w.id === settings?.email_sync_wallet_id);

  // 3. Count pending transactions
  const { count } = await supabase
    .from("email_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending");

  return {
    enabled: settings?.email_sync_enabled ?? true,
    token: settings?.email_sync_token || "",
    mode: (settings?.email_sync_mode as "auto" | "review") || "review",
    targetWalletId: settings?.email_sync_wallet_id || null,
    targetWalletName: selectedWallet?.name,
    spendingWallets,
    pendingCount: count || 0,
    lastVerificationCode: settings?.last_email_verification_code || null,
  };
}

/**
 * Update email sync settings (Mode: auto vs review, Target wallet).
 */
export async function updateEmailSyncSettings(params: {
  enabled?: boolean;
  mode?: "auto" | "review";
  targetWalletId?: string | null;
}) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Unauthorized");

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.enabled !== undefined) updatePayload.email_sync_enabled = params.enabled;
  if (params.mode !== undefined) updatePayload.email_sync_mode = params.mode;
  if (params.targetWalletId !== undefined) {
    updatePayload.email_sync_wallet_id =
      params.targetWalletId === "primary" || !params.targetWalletId ? null : params.targetWalletId;
  }

  const { error: updateError } = await supabase
    .from("user_settings")
    .update(updatePayload)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Regenerate private email sync token.
 */
export async function regenerateEmailSyncToken(): Promise<string> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Unauthorized");

  const newToken = crypto.randomBytes(16).toString("hex");

  const { error: updateError } = await supabase
    .from("user_settings")
    .update({
      email_sync_token: newToken,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/", "layout");
  return newToken;
}

/**
 * Fetch pending email transactions for dashboard review.
 */
export async function getPendingEmailTransactions(): Promise<PendingEmailTransaction[]> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return [];

  const { data, error: txError } = await supabase
    .from("email_transactions")
    .select(`
      id,
      source,
      sender,
      subject,
      merchant_name,
      amount,
      currency,
      transaction_date,
      transaction_time,
      reference_id,
      suggested_category,
      target_wallet_id,
      status,
      created_at
    `)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (txError || !data) return [];

  return data as PendingEmailTransaction[];
}

/**
 * Approve a pending transaction (logs to expenses and marks approved).
 */
export async function approveEmailTransaction(
  transactionId: string,
  overrides?: {
    name?: string;
    amount?: number;
    category?: string;
    walletId?: string | null;
    spentAt?: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Unauthorized");

  // 1. Fetch pending transaction
  const { data: tx, error: fetchError } = await supabase
    .from("email_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !tx) throw new Error("Transaction not found");
  if (tx.status !== "pending") throw new Error("Transaction is not pending");

  // 2. Resolve wallet id
  let finalWalletId = overrides?.walletId ?? tx.target_wallet_id;
  if (!finalWalletId || finalWalletId === "primary") {
    const { spendingWallet } = await getPrimaryWallets(supabase, user.id, user.user_metadata);
    finalWalletId = spendingWallet?.id && spendingWallet.id !== "fallback-spending" ? spendingWallet.id : null;
  }

  const finalName = overrides?.name?.trim() || tx.merchant_name;
  const finalAmount = Number(overrides?.amount ?? tx.amount);
  const finalCategory = overrides?.category || tx.suggested_category || "Food & Dining";
  const finalSpentAt = overrides?.spentAt || tx.transaction_date;

  // 3. Insert into public.expenses
  const { data: newExpense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      name: finalName,
      amount: finalAmount,
      category: finalCategory,
      spent_at: finalSpentAt,
      wallet_id: finalWalletId,
      note: "QRIS Livin by Mandiri",
    })
    .select("id")
    .single();

  if (expenseError) throw new Error(expenseError.message);

  // 4. Update email_transactions status
  const { error: updateError } = await supabase
    .from("email_transactions")
    .update({
      status: "approved",
      logged_expense_id: newExpense.id,
      target_wallet_id: finalWalletId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  if (updateError) console.error("Failed to update email_transaction status:", updateError);

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/saku");
  if (finalWalletId) {
    revalidatePath(`/saku/${finalWalletId}`);
  }

  return { success: true, expenseId: newExpense.id };
}

/**
 * Dismiss a pending transaction without adding it to expenses.
 */
export async function dismissEmailTransaction(transactionId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Unauthorized");

  const { error: updateError } = await supabase
    .from("email_transactions")
    .update({
      status: "dismissed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/");
  return { success: true };
}

/**
 * Parse pasted email text directly from the UI and process according to user settings.
 */
export async function parseAndProcessPastedEmail(
  rawText: string
): Promise<{ success: boolean; result?: ParsedLivinTransaction; message?: string; mode?: string }> {
  const parsed = parseLivinEmail(rawText);
  if (!parsed.isValid) {
    return {
      success: false,
      message: "Tidak dapat menemukan data transaksi QRIS yang valid dari teks email ini.",
    };
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Silakan masuk terlebih dahulu." };
  }

  // Fetch user settings
  const { data: settings } = await supabase
    .from("user_settings")
    .select("email_sync_mode, email_sync_wallet_id, email_sync_token")
    .eq("user_id", user.id)
    .maybeSingle();

  const mode = settings?.email_sync_mode || "review";
  const token = settings?.email_sync_token;

  if (!token) {
    return { success: false, message: "Pengaturan sync email belum terkonfigurasi." };
  }

  // Ingest via database RPC
  const { data: ingestRes, error: ingestError } = await supabase.rpc("ingest_email_transaction", {
    p_token: token,
    p_merchant: parsed.merchantName,
    p_amount: parsed.amount,
    p_date: parsed.date,
    p_time: parsed.time ? parsed.time.slice(0, 8) : null,
    p_ref: parsed.referenceId,
    p_category: parsed.suggestedCategory,
    p_sender: "manual_paste",
    p_subject: "Tempel Bukti Transaksi Livin",
    p_snippet: parsed.rawSnippet || null,
  });

  if (ingestError) {
    return { success: false, message: ingestError.message };
  }

  if (ingestRes && !ingestRes.success) {
    return { success: false, message: ingestRes.message || "Gagal memproses transaksi." };
  }

  revalidatePath("/");
  revalidatePath("/saku");

  return {
    success: true,
    result: parsed,
    mode,
    message:
      mode === "auto"
        ? `Transaksi Rp ${parsed.amount.toLocaleString("id-ID")} di ${parsed.merchantName} berhasil dicatat!`
        : `Transaksi ${parsed.merchantName} telah masuk ke daftar antrean tinjauan.`,
  };
}
