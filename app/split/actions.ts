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
  walletId?: string | null;
  category?: string;
  participants: Array<{
    id?: string;
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

export type UpdateSplitBillPayload = CreateSplitBillPayload;

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
            wallet_id: payload.walletId || null,
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

export async function updateSplitBill(billId: string, payload: UpdateSplitBillPayload) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.is_anonymous) {
    throw new Error("Unauthorized. Please log in.");
  }

  if (!payload.title?.trim()) {
    throw new Error("Nama tagihan harus diisi.");
  }

  if (!payload.participants || payload.participants.length === 0) {
    throw new Error("Minimal harus ada 1 peserta.");
  }

  // 1. Verify ownership and fetch existing bill + participants
  const { data: existingBill, error: fetchError } = await supabase
    .from("split_bills")
    .select("id, creator_id, logged_expense_id, status")
    .eq("id", billId)
    .eq("creator_id", user.id)
    .single();

  if (fetchError || !existingBill) {
    throw new Error("Tagihan tidak ditemukan atau Anda tidak memiliki akses untuk mengubahnya.");
  }

  const { data: existingParticipants } = await supabase
    .from("split_participants")
    .select("id, name, is_creator, is_paid, paid_at")
    .eq("bill_id", billId);

  const existingPartMap = new Map(
    (existingParticipants || []).map((p) => [p.id, p])
  );

  // 2. Sync Participants (preserve existing IDs and paid statuses where matched)
  const keptExistingIds = new Set<string>();
  const resolvedParticipants: Array<{
    id: string;
    name: string;
    is_creator: boolean;
    is_paid: boolean;
    paid_at: string | null;
  }> = [];

  for (const p of payload.participants) {
    const trimmedName = p.name.trim() || "Peserta";
    let matchedExisting = p.id ? existingPartMap.get(p.id) : undefined;

    if (!matchedExisting) {
      // Fallback match by creator flag or case-insensitive name if not already claimed
      matchedExisting = (existingParticipants || []).find(
        (ep) =>
          !keptExistingIds.has(ep.id) &&
          ((Boolean(p.isCreator) && ep.is_creator) ||
            (!p.isCreator && !ep.is_creator && ep.name.trim().toLowerCase() === trimmedName.toLowerCase()))
      );
    }

    if (matchedExisting) {
      keptExistingIds.add(matchedExisting.id);
      const { error: updPartErr } = await supabase
        .from("split_participants")
        .update({
          name: trimmedName,
          is_creator: Boolean(p.isCreator),
        })
        .eq("id", matchedExisting.id)
        .eq("bill_id", billId);

      if (updPartErr) {
        throw new Error(`Gagal memperbarui peserta: ${updPartErr.message}`);
      }

      resolvedParticipants.push({
        id: matchedExisting.id,
        name: trimmedName,
        is_creator: Boolean(p.isCreator),
        is_paid: matchedExisting.is_paid,
        paid_at: matchedExisting.paid_at || null,
      });
    } else {
      const isCreator = Boolean(p.isCreator);
      const { data: insertedPart, error: insPartErr } = await supabase
        .from("split_participants")
        .insert({
          bill_id: billId,
          name: trimmedName,
          is_creator: isCreator,
          is_paid: isCreator,
          paid_at: isCreator ? new Date().toISOString() : null,
        })
        .select("id, name, is_creator, is_paid, paid_at")
        .single();

      if (insPartErr || !insertedPart) {
        throw new Error(`Gagal menambahkan peserta baru: ${insPartErr?.message || "Unknown error"}`);
      }

      resolvedParticipants.push({
        id: insertedPart.id,
        name: insertedPart.name,
        is_creator: insertedPart.is_creator,
        is_paid: insertedPart.is_paid,
        paid_at: insertedPart.paid_at || null,
      });
    }
  }

  // Delete removed participants
  const removedParticipantIds = (existingParticipants || [])
    .map((p) => p.id)
    .filter((id) => !keptExistingIds.has(id));

  if (removedParticipantIds.length > 0) {
    const { error: delPartErr } = await supabase
      .from("split_participants")
      .delete()
      .in("id", removedParticipantIds)
      .eq("bill_id", billId);

    if (delPartErr) {
      throw new Error(`Gagal menghapus peserta lama: ${delPartErr.message}`);
    }
  }

  // 3. Replace Split Items with updated participant UUID mappings
  const { error: delItemsErr } = await supabase
    .from("split_items")
    .delete()
    .eq("bill_id", billId);

  if (delItemsErr) {
    throw new Error(`Gagal memperbarui daftar menu: ${delItemsErr.message}`);
  }

  const itemsToInsert = payload.items.map((item) => {
    const assignedIds = (item.assignedParticipantIndices || [])
      .map((idx) => resolvedParticipants[idx]?.id)
      .filter(Boolean) as string[];

    return {
      bill_id: billId,
      name: item.name.trim() || "Item",
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(1, Number(item.quantity) || 1),
      assigned_participant_ids:
        assignedIds.length > 0 ? assignedIds : resolvedParticipants.map((p) => p.id),
    };
  });

  if (itemsToInsert.length > 0) {
    const { error: insItemsErr } = await supabase.from("split_items").insert(itemsToInsert);
    if (insItemsErr) {
      throw new Error(`Gagal menyimpan menu baru: ${insItemsErr.message}`);
    }
  }

  // 4. Update Split Bill Header
  const allSettled =
    resolvedParticipants.length > 0 && resolvedParticipants.every((p) => p.is_paid);

  const { error: updBillError } = await supabase
    .from("split_bills")
    .update({
      title: payload.title.trim(),
      split_mode: payload.splitMode || "itemized",
      tax_percentage: Number(payload.taxPercentage) || 0,
      service_percentage: Number(payload.servicePercentage) || 0,
      discount_amount: Number(payload.discountAmount) || 0,
      extra_fee: Number(payload.extraFee) || 0,
      rounding_step: Number(payload.roundingStep) || 100,
      payment_info: payload.paymentInfo || {},
      category: payload.category || "Food & Dining",
      status: allSettled ? "settled" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", billId)
    .eq("creator_id", user.id);

  if (updBillError) {
    throw new Error(`Gagal memperbarui tagihan: ${updBillError.message}`);
  }

  // 5. Optionally Save Default Payment Details to User Metadata
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

  // 6. Sync Creator's Net Share with Personal Expense Tracker
  try {
    const calcItems: SplitItemRecord[] = itemsToInsert.map((item, index) => ({
      id: `temp-${index}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      assigned_participant_ids: item.assigned_participant_ids,
    }));

    const calcParts: SplitParticipantRecord[] = resolvedParticipants.map((p) => ({
      id: p.id,
      bill_id: billId,
      name: p.name,
      is_creator: p.is_creator,
      is_paid: p.is_paid,
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
    const currency = await getCurrencyServer();

    if (payload.autoLogToTracker && creatorShare > 0) {
      const expensePayload = {
        category: payload.category || "Food & Dining",
        name: `Split: ${payload.title.trim()}`,
        note: `[Split Bill] Porsi pribadi dari total ${formatCurrencyServer(calculation.grandTotal, currency)}`,
        amount: creatorShare,
        ...(payload.walletId !== undefined ? { wallet_id: payload.walletId || null } : {}),
      };

      let linkedExpenseId = existingBill.logged_expense_id;

      if (linkedExpenseId) {
        const { data: updatedExp } = await supabase
          .from("expenses")
          .update(expensePayload)
          .eq("id", linkedExpenseId)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle();

        if (!updatedExp) {
          linkedExpenseId = null;
        }
      }

      if (!linkedExpenseId) {
        const { data: newExpense } = await supabase
          .from("expenses")
          .insert({
            user_id: user.id,
            ...expensePayload,
            spent_at: getTodayString(),
            wallet_id: payload.walletId || null,
          })
          .select("id")
          .single();

        if (newExpense?.id) {
          await supabase
            .from("split_bills")
            .update({ logged_expense_id: newExpense.id })
            .eq("id", billId);
        }
      }
    } else if (!payload.autoLogToTracker && existingBill.logged_expense_id) {
      await supabase
        .from("expenses")
        .delete()
        .eq("id", existingBill.logged_expense_id)
        .eq("user_id", user.id);

      await supabase
        .from("split_bills")
        .update({ logged_expense_id: null })
        .eq("id", billId);
    }
  } catch (trackerErr) {
    console.error("Failed to sync creator share to expenses:", trackerErr);
  }

  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/archive");
  revalidatePath("/split");
  revalidatePath(`/split/${billId}`);
  revalidatePath(`/split/${billId}/edit`);

  return { success: true, billId };
}
