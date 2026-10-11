"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import {
  addExpensesBatch,
  updateExpense,
  deleteExpense,
  toggleExpenseExemption,
  setWeeklyBudget,
  setMonthlyBudget,
  createSavingsGoal,
  allocateSavingsToGoal,
  withdrawSavingsFromGoal,
  sweepSurplusToSavings,
} from "@/app/actions";
import { setWalletBudget } from "@/app/saku/actions";
import { AiActionName } from "@/utils/ai/tools";
import { getDailyAiUsage, resetDailyAiUsage, DAILY_AI_LIMIT } from "@/utils/ai/rateLimit";

export interface ExecuteAiActionPayload {
  action: AiActionName;
  args: Record<string, unknown>;
}

export interface ExecuteAiActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function executeAiAction(
  payload: ExecuteAiActionPayload
): Promise<ExecuteAiActionResult> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized. Sesi pengguna telah kedaluwarsa." };
  }

  try {
    const { action, args } = payload;

    switch (action) {
      case "log_expenses": {
        const rawItems = Array.isArray(args.expenses) ? args.expenses : [];
        if (rawItems.length === 0) {
          return { success: false, error: "Daftar pengeluaran kosong." };
        }
        await addExpensesBatch(
          rawItems.map((item: any) => ({
            name: item.name,
            amount: Number(item.amount),
            category: item.category,
            spentAt: item.spent_at,
            note: item.note,
            walletId: item.wallet_id,
          }))
        );
        return {
          success: true,
          message: `Berhasil mencatat ${rawItems.length} transaksi pengeluaran.`,
        };
      }

      case "update_expense": {
        const expenseId = String(args.expense_id || "").trim();
        if (!expenseId) return { success: false, error: "ID Transaksi tidak valid." };

        // Read current row to construct FormData for existing updateExpense
        const { data: curr } = await supabase
          .from("expenses")
          .select("*")
          .eq("id", expenseId)
          .eq("user_id", user.id)
          .single();

        if (!curr) return { success: false, error: "Transaksi tidak ditemukan." };

        const fd = new FormData();
        fd.append("id", expenseId);
        fd.append("name", String(args.name || curr.name));
        fd.append("amount", String(args.amount !== undefined ? args.amount : curr.amount));
        fd.append("category", String(args.category || curr.category));
        fd.append("spent_at", String(args.spent_at || curr.spent_at));
        fd.append("note", String(args.note !== undefined ? args.note : curr.note || ""));
        if (args.wallet_id || curr.wallet_id) {
          fd.append("wallet_id", String(args.wallet_id || curr.wallet_id));
        }

        await updateExpense(fd);
        return { success: true, message: `Transaksi "${args.name || curr.name}" berhasil diubah.` };
      }

      case "delete_expense": {
        const expenseId = String(args.expense_id || "").trim();
        if (!expenseId) return { success: false, error: "ID Transaksi tidak valid." };
        await deleteExpense(expenseId);
        return { success: true, message: "Transaksi berhasil dihapus." };
      }

      case "set_expense_exempt": {
        const expenseId = String(args.expense_id || "").trim();
        const isExempt = Boolean(args.is_exempt);
        if (!expenseId) return { success: false, error: "ID Transaksi tidak valid." };
        await toggleExpenseExemption(expenseId, isExempt);
        return {
          success: true,
          message: isExempt
            ? "Transaksi telah ditandai sebagai pengeluaran one-off (dikecualikan)."
            : "Tanda pengecualian telah dicabut.",
        };
      }

      case "set_budget": {
        const cadence = args.cadence === "month" ? "month" : "week";
        const amount = Number(args.amount);
        const walletId = typeof args.wallet_id === "string" ? args.wallet_id : null;

        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Nominal anggaran tidak valid." };
        }

        if (walletId) {
          await setWalletBudget(walletId, cadence, amount);
        } else {
          const fd = new FormData();
          fd.append("budget", String(amount));
          if (cadence === "week") {
            await setWeeklyBudget(fd);
          } else {
            await setMonthlyBudget(fd);
          }
        }

        return {
          success: true,
          message: `Anggaran ${cadence === "week" ? "mingguan" : "bulanan"} berhasil diubah menjadi Rp ${amount.toLocaleString()}.`,
        };
      }

      case "create_savings_goal": {
        const name = String(args.name || "").trim();
        const targetAmount = Number(args.target_amount);
        const emoji = String(args.emoji || "🎯").trim();

        if (!name || isNaN(targetAmount) || targetAmount <= 0) {
          return { success: false, error: "Data target tabungan tidak valid." };
        }

        const fd = new FormData();
        fd.append("name", name);
        fd.append("target_amount", String(targetAmount));
        fd.append("emoji", emoji);

        await createSavingsGoal(fd);
        return { success: true, message: `Target tabungan "${emoji} ${name}" berhasil dibuat.` };
      }

      case "allocate_savings_to_goal": {
        const goalId = String(args.goal_id || "").trim();
        const amount = Number(args.amount);
        if (!goalId || isNaN(amount) || amount <= 0) {
          return { success: false, error: "Nominal alokasi tidak valid." };
        }
        await allocateSavingsToGoal(goalId, amount);
        return { success: true, message: `Berhasil mengalokasikan Rp ${amount.toLocaleString()} ke target tabungan.` };
      }

      case "withdraw_savings_from_goal": {
        const goalId = String(args.goal_id || "").trim();
        const amount = Number(args.amount);
        if (!goalId || isNaN(amount) || amount <= 0) {
          return { success: false, error: "Nominal penarikan tidak valid." };
        }
        await withdrawSavingsFromGoal(goalId, amount);
        return { success: true, message: `Berhasil menarik Rp ${amount.toLocaleString()} dari target tabungan.` };
      }

      case "sweep_surplus_to_savings": {
        const amount = Number(args.amount);
        const targetGoalId = typeof args.target_goal_id === "string" ? args.target_goal_id : undefined;
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Nominal surplus tidak valid." };
        }
        await sweepSurplusToSavings(amount, targetGoalId);
        return { success: true, message: `Berhasil menyapu Rp ${amount.toLocaleString()} ke tabungan.` };
      }

    default:
        return { success: false, error: `Aksi tidak dikenal: ${action}` };
    }
  } catch (err: any) {
    console.error("executeAiAction error:", err);
    return { success: false, error: err.message || "Gagal mengeksekusi aksi." };
  }
}

export async function getDailyAiUsageAction(): Promise<{
  count: number;
  limit: number;
  remaining: number;
}> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0, limit: DAILY_AI_LIMIT, remaining: DAILY_AI_LIMIT };
  }

  const result = getDailyAiUsage(user);
  return {
    count: result.count,
    limit: result.limit,
    remaining: result.remaining,
  };
}

export async function resetDailyAiUsageAction(): Promise<{
  success: boolean;
  count: number;
  limit: number;
  remaining: number;
  error?: string;
}> {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      count: 0,
      limit: DAILY_AI_LIMIT,
      remaining: DAILY_AI_LIMIT,
      error: "Unauthorized",
    };
  }

  const result = await resetDailyAiUsage(supabase, user);
  return {
    success: true,
    count: result.count,
    limit: result.limit,
    remaining: result.remaining,
  };
}
