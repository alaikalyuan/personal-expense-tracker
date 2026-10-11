import { SupabaseClient, User } from "@supabase/supabase-js";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDate,
  subMonths,
  setDate,
} from "date-fns";
import { getNowInTimezone } from "@/utils/date";
import { resolveBudgets } from "@/utils/budget";
import { getWalletBalances, getSavingsGoals, getPrimaryWallets } from "@/utils/wallets/server";
import { calculateExemptTotals } from "@/utils/exemptions";

export interface BuildSnapshotOptions {
  selectedSakuId?: string | null;
  path?: string | null;
  locale?: string;
}

export interface FinancialSnapshot {
  systemPromptContext: string;
  wallets: Array<{ id: string; name: string; kind: string; balance: number }>;
  goals: Array<{ id: string; name: string; target: number; allocated: number; percent: number }>;
  weeklyBudget: number;
  monthlyBudget: number;
  totalSpentWeek: number;
  totalSpentMonth: number;
  regularSpentMonth: number;
  exemptSpentMonth: number;
  priorMtdSpend: number;
  baseCurrency: string;
}

export async function buildFinancialSnapshot(
  supabase: SupabaseClient,
  user: User,
  options: BuildSnapshotOptions = {}
): Promise<FinancialSnapshot> {
  const now = getNowInTimezone();
  const currentDay = getDate(now);
  const totalDaysInMonth = getDaysInMonth(now);
  const daysRemainingInMonth = Math.max(0, totalDaysInMonth - currentDay);

  const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
  const startOfMonthDate = startOfMonth(now);
  const endOfMonthDate = endOfMonth(now);

  const startOfWeekStr = format(startOfWeekDate, "yyyy-MM-dd");
  const startOfMonthStr = format(startOfMonthDate, "yyyy-MM-dd");
  const endOfMonthStr = format(endOfMonthDate, "yyyy-MM-dd");

  // Prior month MTD boundaries for comparative pacing
  const lastMonthDate = subMonths(now, 1);
  const startOfLastMonth = startOfMonth(lastMonthDate);
  const daysInLastMonth = getDaysInMonth(lastMonthDate);
  const priorMtdEndDay = Math.min(currentDay, daysInLastMonth);
  const priorMtdEndDate = setDate(startOfLastMonth, priorMtdEndDay);
  const startOfLastMonthStr = format(startOfLastMonth, "yyyy-MM-dd");
  const priorMtdEndStr = format(priorMtdEndDate, "yyyy-MM-dd");

  // Fetch all core domain entities in parallel
  const [
    wallets,
    userSettingsRes,
    goals,
    monthExpensesRes,
    priorMtdRes,
    recentExpensesRes,
    subscriptionsRes,
    splitBillsRes,
  ] = await Promise.all([
    getWalletBalances(supabase, user.id),
    supabase
      .from("user_settings")
      .select("multi_saku_enabled, base_currency")
      .eq("user_id", user.id)
      .maybeSingle(),
    getSavingsGoals(supabase, user.id, user.user_metadata),
    supabase
      .from("expenses")
      .select("id, name, amount, category, spent_at, note, wallet_id")
      .eq("user_id", user.id)
      .gte("spent_at", startOfMonthStr)
      .lte("spent_at", endOfMonthStr),
    supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte("spent_at", startOfLastMonthStr)
      .lte("spent_at", priorMtdEndStr),
    supabase
      .from("expenses")
      .select("id, name, amount, category, spent_at, note, wallet_id")
      .eq("user_id", user.id)
      .order("spent_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("subscriptions")
      .select("id, name, price, billing_cycle, category, status, next_renewal_date")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("split_bills")
      .select("id, title, status, category, split_participants(name, is_paid)")
      .eq("creator_id", user.id)
      .eq("status", "active")
      .limit(5),
  ]);

  const multiSakuEnabled = Boolean(userSettingsRes.data?.multi_saku_enabled);
  const baseCurrency = userSettingsRes.data?.base_currency || "IDR";
  const selectedSakuId = options.selectedSakuId || "all";

  // Resolve budgets using unified logic
  let fallbackWallet = null;
  if (!multiSakuEnabled || selectedSakuId === "all") {
    const { spendingWallet } = await getPrimaryWallets(supabase, user.id, user.user_metadata);
    fallbackWallet = spendingWallet;
  }

  const { weeklyBudget, monthlyBudget } = resolveBudgets({
    user,
    wallets,
    fallbackWallet,
    multiSakuEnabled,
    selectedSakuId,
    totalDaysInMonth,
  });

  const monthExpenses = monthExpensesRes.data || [];
  const priorMtdExpenses = priorMtdRes.data || [];
  const recentExpenses = recentExpensesRes.data || [];
  const subscriptions = subscriptionsRes.data || [];
  const activeSplitBills = splitBillsRes.data || [];

  const priorMtdSpend = priorMtdExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Calculate week and month totals + regular vs exempt
  let totalSpentMonth = 0;
  let totalSpentWeek = 0;
  const categoryTotals: Record<string, number> = {};

  for (const exp of monthExpenses) {
    const amt = Number(exp.amount) || 0;
    totalSpentMonth += amt;
    const spentDate = exp.spent_at ? exp.spent_at.split("T")[0] : "";
    if (spentDate >= startOfWeekStr) {
      totalSpentWeek += amt;
    }
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
  }

  const { regularTotal: regularSpentMonth, exemptTotal: exemptSpentMonth } =
    calculateExemptTotals(monthExpenses);

  // Map wallets for lookup & text summary
  const walletMap = new Map<string, string>();
  const walletsSummary = wallets
    .map((w) => {
      walletMap.set(w.id, w.name);
      return `- ${w.name} [ID: ${w.id}] (${w.kind}): Saldo ${Number(w.current_balance).toLocaleString()} ${w.currency}${
        w.weekly_budget ? `, Budget mg: ${Number(w.weekly_budget).toLocaleString()}` : ""
      }${w.monthly_budget ? `, Budget bln: ${Number(w.monthly_budget).toLocaleString()}` : ""}`;
    })
    .join("\n");

  // Goals summary
  const goalsSummary =
    goals.length > 0
      ? goals
          .map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.allocatedAmount / g.targetAmount) * 100) : 0;
            return `- ${g.emoji || "🎯"} ${g.name} [ID: ${g.id}]: Terkumpul ${g.allocatedAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()} ${baseCurrency} (${pct}%)`;
          })
          .join("\n")
      : "Belum ada target tabungan.";

  // Subscriptions summary
  const totalSubMonthly = subscriptions.reduce((acc, sub) => {
    const p = Number(sub.price) || 0;
    if (sub.billing_cycle === "monthly") return acc + p;
    if (sub.billing_cycle === "yearly") return acc + Math.round(p / 12);
    if (sub.billing_cycle === "weekly") return acc + Math.round(p * 4.33);
    return acc + p;
  }, 0);

  const subSummary =
    subscriptions.length > 0
      ? subscriptions
          .map((s) => `- ${s.name}: ${Number(s.price).toLocaleString()} / ${s.billing_cycle} (Jatuh tempo: ${s.next_renewal_date})`)
          .join("\n")
      : "Tidak ada langganan aktif.";

  // Split bills summary
  const splitSummary =
    activeSplitBills.length > 0
      ? activeSplitBills
          .map((b) => {
            const participants = Array.isArray(b.split_participants) ? b.split_participants : [];
            const unpaid = participants.filter((p: { is_paid: boolean }) => !p.is_paid).map((p: { name: string }) => p.name);
            return `- ${b.title}: ${unpaid.length > 0 ? `Belum lunas (${unpaid.join(", ")})` : "Semua sudah bayar"}`;
          })
          .join("\n")
      : "Tidak ada patungan aktif yang tertunda.";

  // Category summary sorted by spend
  const categorySummary = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const pct = totalSpentMonth > 0 ? Math.round((amt / totalSpentMonth) * 100) : 0;
      return `- ${cat}: ${amt.toLocaleString()} ${baseCurrency} (${pct}%)`;
    })
    .join("\n");

  // Recent transactions with IDs for quick modification actions
  const recentTxSummary = recentExpenses
    .map((e) => {
      const sakuName = e.wallet_id ? walletMap.get(e.wallet_id) || "Saku" : "Default";
      return `- [ID: ${e.id}] ${e.spent_at}: ${e.name} [${e.category}] -> ${Number(e.amount).toLocaleString()} (${sakuName})${
        e.note ? ` note: "${e.note}"` : ""
      }`;
    })
    .join("\n");

  // Active view context
  const activeSakuName =
    selectedSakuId !== "all" && walletMap.has(selectedSakuId)
      ? walletMap.get(selectedSakuId)
      : "Semua Saku (Gabungan)";

  const systemPromptContext = `RINGKASAN KEUANGAN PENGGUNA TERKINI:
- Tanggal Hari Ini: ${format(now, "yyyy-MM-dd")} (Hari ke-${currentDay} dari ${totalDaysInMonth} hari bulan ini)
- Sisa Hari Bulan Ini: ${daysRemainingInMonth} hari
- Mata Uang Utama: ${baseCurrency}
- Lokasi Tampilan Pengguna Saat Ini: ${options.path || "/"}
- Saku Aktif yang Sedang Dilihat: ${activeSakuName} (ID: ${selectedSakuId})
- Mode Multi-Saku: ${multiSakuEnabled ? "Aktif" : "Non-aktif (Single Saku)"}

ANGGARAN & PENGELUARAN SAAT INI:
- Anggaran Bulanan: ${monthlyBudget.toLocaleString()} ${baseCurrency}
- Total Pengeluaran Bulan Ini (MTD): ${totalSpentMonth.toLocaleString()} ${baseCurrency} (${
    monthlyBudget > 0 ? Math.round((totalSpentMonth / monthlyBudget) * 100) : 0
  }% anggaran bulanan)
  * Operasional/Rutin: ${regularSpentMonth.toLocaleString()} ${baseCurrency}
  * Pengecualian (One-Off/Splurge): ${exemptSpentMonth.toLocaleString()} ${baseCurrency}
- Pengeluaran MTD Bulan Lalu: ${priorMtdSpend.toLocaleString()} ${baseCurrency} (${
    priorMtdSpend > 0
      ? `${totalSpentMonth > priorMtdSpend ? "+" : ""}${Math.round(
          ((totalSpentMonth - priorMtdSpend) / priorMtdSpend) * 100
        )}% dibanding periode sama bulan lalu`
      : "N/A"
  })
- Anggaran Mingguan: ${weeklyBudget.toLocaleString()} ${baseCurrency}
- Total Pengeluaran Minggu Ini: ${totalSpentWeek.toLocaleString()} ${baseCurrency} (${
    weeklyBudget > 0 ? Math.round((totalSpentWeek / weeklyBudget) * 100) : 0
  }% anggaran mingguan)

DAFTAR SAKU / DOMPET:
${walletsSummary || "Tidak ada dompet tercatat."}

TARGET TABUNGAN (SAVINGS GOALS):
${goalsSummary}

KOMITMEN LANGGANAN AKTIF:
- Total Beban Bulanan: ${totalSubMonthly.toLocaleString()} ${baseCurrency}/bulan
${subSummary}

TAGIHAN PATUNGAN AKTIF (SPLIT BILLS):
${splitSummary}

PENGELUARAN PER KATEGORI BULAN INI:
${categorySummary || "Belum ada pengeluaran bulan ini."}

15 TRANSAKSI TERAKHIR (LENGKAP DENGAN ID TRANSAKSI):
${recentTxSummary || "Belum ada riwayat transaksi."}`;

  return {
    systemPromptContext,
    wallets: wallets.map((w) => ({
      id: w.id,
      name: w.name,
      kind: w.kind,
      balance: w.current_balance,
    })),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      target: g.targetAmount,
      allocated: g.allocatedAmount,
      percent: g.targetAmount > 0 ? Math.round((g.allocatedAmount / g.targetAmount) * 100) : 0,
    })),
    weeklyBudget,
    monthlyBudget,
    totalSpentWeek,
    totalSpentMonth,
    regularSpentMonth,
    exemptSpentMonth,
    priorMtdSpend,
    baseCurrency,
  };
}
