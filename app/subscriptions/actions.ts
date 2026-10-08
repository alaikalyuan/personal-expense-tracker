"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { format, parseISO } from "date-fns";
import { getTodayString } from "@/utils/date";
import {
  CreateSubscriptionPayload,
  SubscriptionStatus,
  computeNextRenewalDate,
} from "./types";
import { createSplitBill } from "@/app/split/actions";

export async function createSubscription(payload: CreateSubscriptionPayload) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  if (user.is_anonymous) {
    throw new Error("Hanya akun terdaftar yang dapat melacak langganan. Silakan daftar atau masuk.");
  }

  if (!payload.name?.trim()) {
    throw new Error("Nama langganan harus diisi.");
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      name: payload.name.trim(),
      price: Math.max(0, Number(payload.price) || 0),
      billing_cycle: payload.billingCycle || "monthly",
      next_renewal_date: payload.nextRenewalDate || getTodayString(),
      payment_platform: payload.paymentPlatform || "Google Play",
      category: payload.category || "Entertainment",
      notes: payload.notes?.trim() || null,
      status: "active",
      reminder_days_before: Number(payload.reminderDaysBefore) || 2,
      is_split: Boolean(payload.isSplit),
      pay_from_wallet_id: payload.payFromWalletId || null,
      split_config: payload.splitConfig || {
        split_mode: "equal",
        friends: [],
        auto_create_split_bill: true,
        auto_log_to_expenses: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Gagal menyimpan langganan: ${error?.message || "Unknown error"}`);
  }

  revalidatePath("/subscriptions");
  revalidatePath("/split");
  revalidatePath("/");

  return { success: true, subscriptionId: data.id };
}

export async function updateSubscription(
  id: string,
  payload: Partial<CreateSubscriptionPayload> & { status?: SubscriptionStatus }
) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    throw new Error("Unauthorized");
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.price !== undefined) updateData.price = Math.max(0, Number(payload.price) || 0);
  if (payload.billingCycle !== undefined) updateData.billing_cycle = payload.billingCycle;
  if (payload.nextRenewalDate !== undefined) updateData.next_renewal_date = payload.nextRenewalDate;
  if (payload.paymentPlatform !== undefined) updateData.payment_platform = payload.paymentPlatform;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.notes !== undefined) updateData.notes = payload.notes?.trim() || null;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.reminderDaysBefore !== undefined)
    updateData.reminder_days_before = Number(payload.reminderDaysBefore) || 2;
  if (payload.isSplit !== undefined) updateData.is_split = Boolean(payload.isSplit);
  if (payload.payFromWalletId !== undefined)
    updateData.pay_from_wallet_id = payload.payFromWalletId || null;
  if (payload.splitConfig !== undefined) updateData.split_config = payload.splitConfig;

  const { error } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Gagal memperbarui langganan: ${error.message}`);
  }

  revalidatePath("/subscriptions");
  revalidatePath("/split");
  revalidatePath("/");

  return { success: true };
}

export async function deleteSubscription(id: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Gagal menghapus langganan: ${error.message}`);
  }

  revalidatePath("/subscriptions");
  revalidatePath("/split");
  revalidatePath("/");

  return { success: true };
}

export async function toggleSubscriptionStatus(id: string, status: SubscriptionStatus) {
  return updateSubscription(id, { status });
}

export async function createSplitBillFromSubscription(subscriptionId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    throw new Error("Unauthorized");
  }

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single();

  if (error || !sub) {
    throw new Error("Langganan tidak ditemukan");
  }

  const splitConfig = sub.split_config || {};
  const friends: Array<{ name: string; share?: number }> = splitConfig.friends || [];

  if (friends.length === 0) {
    throw new Error("Langganan ini belum memiliki daftar teman patungan.");
  }

  const creatorName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Saya";

  // Build participants
  const participants = [
    { name: creatorName, isCreator: true },
    ...friends.map((f) => ({ name: f.name.trim() || "Teman", isCreator: false })),
  ];

  // Month and Year label
  const renewalDateObj = parseISO(sub.next_renewal_date);
  const monthYearLabel = format(renewalDateObj, "MMM yyyy");
  const billTitle = `Patungan ${sub.name} (${monthYearLabel})`;

  // Total items: 1 item assigned to everyone
  const items = [
    {
      name: sub.name,
      price: Number(sub.price) || 0,
      quantity: 1,
      assignedParticipantIndices: participants.map((_, i) => i),
    },
  ];

  const defaultPayment = user.user_metadata?.default_split_payment || {};

  // Create Split Bill using existing verified logic
  const splitRes = await createSplitBill({
    title: billTitle,
    splitMode: "equal",
    taxPercentage: 0,
    servicePercentage: 0,
    discountAmount: 0,
    extraFee: 0,
    roundingStep: 100,
    paymentInfo: defaultPayment,
    category: sub.category || "Entertainment",
    autoLogToTracker: splitConfig.auto_log_to_expenses !== false,
    walletId: sub.pay_from_wallet_id || undefined,
    participants,
    items,
  });

  const nextRenewalDate = computeNextRenewalDate(sub.next_renewal_date, sub.billing_cycle);

  // Update subscription record with last split bill and advanced renewal date
  await supabase
    .from("subscriptions")
    .update({
      last_split_bill_id: splitRes.billId,
      last_processed_date: sub.next_renewal_date,
      next_renewal_date: nextRenewalDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  revalidatePath("/subscriptions");
  revalidatePath("/split");
  revalidatePath(`/split/${splitRes.billId}`);
  revalidatePath("/");

  return { success: true, billId: splitRes.billId, nextRenewalDate };
}

export async function processSubscriptionRenewals(targetUserId?: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activeUserId = targetUserId || user?.id;
  if (!activeUserId) {
    return { processedCount: 0 };
  }

  const todayStr = getTodayString();

  // Find active subscriptions that have reached or passed their renewal date
  let query = supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .lte("next_renewal_date", todayStr);

  if (activeUserId) {
    query = query.eq("user_id", activeUserId);
  }

  const { data: dueSubs, error } = await query;
  if (error || !dueSubs || dueSubs.length === 0) {
    return { processedCount: 0 };
  }

  let processedCount = 0;

  for (const sub of dueSubs) {
    // Avoid double processing the same date
    if (sub.last_processed_date === sub.next_renewal_date) {
      continue;
    }

    if (sub.is_split && sub.split_config?.auto_create_split_bill) {
      try {
        await createSplitBillFromSubscription(sub.id);
        processedCount++;
      } catch (err) {
        console.error(`Failed to auto-create split bill for subscription ${sub.id}:`, err);
      }
    } else {
      // Auto-log expense for non-split subscriptions if auto_log_to_expenses is true (default true)
      if (Number(sub.price) > 0 && sub.split_config?.auto_log_to_expenses !== false) {
        try {
          await supabase.from("expenses").insert({
            user_id: sub.user_id,
            category: sub.category || "Entertainment",
            name: `Langganan: ${sub.name}`,
            note: `[Perpanjangan Otomatis] Pembayaran via ${sub.payment_platform || "Langganan"}`,
            amount: Number(sub.price) || 0,
            spent_at: sub.next_renewal_date,
            wallet_id: sub.pay_from_wallet_id || null,
          });
        } catch (expErr) {
          console.error(`Failed to auto-log renewal expense for subscription ${sub.id}:`, expErr);
        }
      }

      // Just advance renewal date for non-split or non-auto-split subscriptions
      const nextDate = computeNextRenewalDate(sub.next_renewal_date, sub.billing_cycle);
      await supabase
        .from("subscriptions")
        .update({
          next_renewal_date: nextDate,
          last_processed_date: sub.next_renewal_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
      processedCount++;
    }
  }

  if (processedCount > 0) {
    revalidatePath("/subscriptions");
    revalidatePath("/split");
    revalidatePath("/");
  }

  return { processedCount };
}

export async function updateNotificationSettings(settings: {
  daily_reminder_enabled?: boolean;
  daily_reminder_time?: string;
  motivational_quotes_enabled?: boolean;
  subscription_reminders_enabled?: boolean;
  split_bill_reminders_enabled?: boolean;
}) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const existingSettings = user.user_metadata?.notification_settings || {};
  const newSettings = {
    ...existingSettings,
    ...settings,
  };

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      notification_settings: newSettings,
    },
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/");
  return { success: true, settings: newSettings };
}
