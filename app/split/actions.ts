"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { getTodayString } from "@/utils/date";
import {
  calculateSplitBreakdown,
  SplitItemRecord,
  SplitParticipantRecord,
} from "@/utils/splitCalculator";
import { getCurrencyServer, formatCurrencyServer } from "@/utils/i18n/server";

export interface CreateSplitBillPayload {
  title: string;
  splitMode: "itemized" | "equal";
  taxPercentage: number;
  servicePercentage: number;
  discountAmount: number;
  extraFee: number;
  roundingStep: number;
  paymentInfo: {
    method?: string;
    account_number?: string;
    account_name?: string;
    note?: string;
  };
  saveAsDefaultPayment?: boolean;
  autoLogToTracker?: boolean;
  category?: string;
  participants: Array<{
    name: string;
    isCreator: boolean;
  }>;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    assignedParticipantIndices: number[]; // indices in participants array
  }>;
}

export async function createSplitBill(payload: CreateSplitBillPayload) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please log in.");
  }

  // Strict check: only registered (non-anonymous) accounts can create split bills
  if (user.is_anonymous) {
    throw new Error("Hanya akun terdaftar yang dapat membuat Split Bill. Silakan login atau buat akun.");
  }

  if (!payload.title?.trim()) {
    throw new Error("Nama tagihan harus diisi.");
  }

  if (!payload.participants || payload.participants.length === 0) {
    throw new Error("Minimal harus ada 1 peserta.");
  }

  // 1. Insert Split Bill Header
  const { data: bill, error: billError } = await supabase
    .from("split_bills")
    .insert({
      creator_id: user.id,
      title: payload.title.trim(),
      split_mode: payload.splitMode || "itemized",
      tax_percentage: Number(payload.taxPercentage) || 0,
      service_percentage: Number(payload.servicePercentage) || 0,
      discount_amount: Number(payload.discountAmount) || 0,
      extra_fee: Number(payload.extraFee) || 0,
      rounding_step: Number(payload.roundingStep) || 100,
      payment_info: payload.paymentInfo || {},
      category: payload.category || "Food & Dining",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (billError || !bill) {
    throw new Error(`Gagal membuat tagihan: ${billError?.message || "Unknown error"}`);
  }

  const billId = bill.id;

  // 2. Insert Participants
  const participantsToInsert = payload.participants.map((p) => ({
    bill_id: billId,
    name: p.name.trim(),
    is_creator: Boolean(p.isCreator),
    is_paid: Boolean(p.isCreator), // Creator is already marked as paid
    paid_at: p.isCreator ? new Date().toISOString() : null,
  }));

  const { data: insertedParticipants, error: partError } = await supabase
    .from("split_participants")
    .insert(participantsToInsert)
    .select("id, name, is_creator");

  if (partError || !insertedParticipants) {
    // Attempt rollback
    await supabase.from("split_bills").delete().eq("id", billId);
    throw new Error(`Gagal menyimpan peserta: ${partError?.message}`);
  }

  // 3. Insert Items (mapping participant indices to inserted UUIDs)
  const itemsToInsert = payload.items.map((item) => {
    const assignedIds = (item.assignedParticipantIndices || [])
      .map((idx) => insertedParticipants[idx]?.id)
      .filter(Boolean) as string[];

    return {
      bill_id: billId,
      name: item.name.trim() || "Item",
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
      assigned_participant_ids: assignedIds.length > 0 ? assignedIds : insertedParticipants.map((p) => p.id),
    };
  });

  if (itemsToInsert.length > 0) {
    const { error: itemsError } = await supabase.from("split_items").insert(itemsToInsert);
    if (itemsError) {
      console.error("Failed to insert split items:", itemsError);
    }
  }

  // 4. Optionally Save Default Payment Details to User Metadata
  if (payload.saveAsDefaultPayment && payload.paymentInfo) {
    try {
      await supabase.auth.updateUser({
        data: {
          default_split_payment: payload.paymentInfo,
        },
      });
    } catch (e) {
      console.warn("Failed to update user default payment info:", e);
    }
  }

  // 5. Optionally Auto-Log Creator's Net Share to Personal Tracker
  if (payload.autoLogToTracker) {
    try {
      // Calculate breakdown on server just to extract creator's share
      const calcItems: SplitItemRecord[] = itemsToInsert.map((item, index) => ({
        id: `temp-${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        assigned_participant_ids: item.assigned_participant_ids,
      }));

      const calcParts: SplitParticipantRecord[] = insertedParticipants.map((p) => ({
        id: p.id,
        bill_id: billId,
        name: p.name,
        is_creator: p.is_creator,
        is_paid: p.is_creator,
      }));

      const calculation = calculateSplitBreakdown(
        {
          split_mode: payload.splitMode,
          tax_percentage: payload.taxPercentage,
          service_percentage: payload.servicePercentage,
          discount_amount: payload.discountAmount,
          extra_fee: payload.extraFee,
          rounding_step: payload.roundingStep,
        },
        calcItems,
        calcParts
      );

      const creatorCalc = calculation.participants.find((p) => p.isCreator);
      const creatorShare = creatorCalc?.totalOwed || 0;

      if (creatorShare > 0) {
        const currency = await getCurrencyServer();
        const { data: expenseRecord } = await supabase
          .from("expenses")
          .insert({
            user_id: user.id,
            category: payload.category || "Food & Dining",
            name: `Split: ${payload.title.trim()}`,
            note: `[Split Bill] Porsi pribadi dari total ${formatCurrencyServer(calculation.grandTotal, currency)}`,
            amount: creatorShare,
            spent_at: getTodayString(),
          })
          .select("id")
          .single();

        if (expenseRecord?.id) {
          await supabase
            .from("split_bills")
            .update({ logged_expense_id: expenseRecord.id })
            .eq("id", billId);
        }
      }
    } catch (trackerErr) {
      console.error("Failed to auto-log creator share to expenses:", trackerErr);
    }
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/split");
  revalidatePath(`/split/${billId}`);

  return { success: true, billId };
}

export async function toggleParticipantPaid(billId: string, participantId: string, isPaid: boolean) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Update participant payment state
  const { error: partError } = await supabase
    .from("split_participants")
    .update({
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
    .eq("id", participantId)
    .eq("bill_id", billId);

  if (partError) {
    throw new Error(`Gagal mengubah status: ${partError.message}`);
  }

  // Touch split_bills.updated_at so client localStorage cache is automatically invalidated!
  await supabase
    .from("split_bills")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", billId);

  revalidatePath(`/split/${billId}`);
  revalidatePath("/split");
  return { success: true };
}

export async function deleteSplitBill(billId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    throw new Error("Unauthorized");
  }

  // Find if bill has an auto-logged expense
  const { data: bill } = await supabase
    .from("split_bills")
    .select("logged_expense_id")
    .eq("id", billId)
    .eq("creator_id", user.id)
    .single();

  const { error: delError } = await supabase
    .from("split_bills")
    .delete()
    .eq("id", billId)
    .eq("creator_id", user.id);

  if (delError) {
    throw new Error(`Gagal menghapus tagihan: ${delError.message}`);
  }

  // Optionally delete linked expense or keep it
  if (bill?.logged_expense_id) {
    await supabase.from("expenses").delete().eq("id", bill.logged_expense_id).eq("user_id", user.id);
  }

  revalidatePath("/");
  revalidatePath("/split");
  return { success: true };
}
