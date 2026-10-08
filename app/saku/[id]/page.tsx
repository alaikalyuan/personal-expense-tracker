import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getNowInTimezone } from "@/utils/date";
import { startOfWeek, format } from "date-fns";
import {
  getWalletBalances,
  getSavingsGoals,
  getSavingsHistory,
} from "@/utils/wallets/server";
import ExpenseList, { ExpenseItem } from "@/app/ExpenseList";
import SavingsClient from "@/app/savings/SavingsClient";
import UserMenu from "@/app/UserMenu";

interface SakuDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SakuDetailPage(props: SakuDetailPageProps) {
  const { id } = await props.params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/guest?next=/saku/${id}`);
  }

  const isGuest = Boolean(user.is_anonymous);
  const wallets = await getWalletBalances(supabase, user.id);
  const wallet = wallets.find((w) => w.id === id);

  if (!wallet) {
    notFound();
  }

  // If it's a Stash wallet, redirect to or render the SavingsClient scoped to this stash
  if (wallet.kind === "stash") {
    if (wallet.is_primary) {
      redirect("/savings");
    }

    const goals = await getSavingsGoals(supabase, user.id, user.user_metadata);
    const history = await getSavingsHistory(supabase, user.id, wallet.id, user.user_metadata);
    const coreSavings = Number(wallet.current_balance || 0);

    const totalAllocatedToGoals = goals.reduce((sum, g) => sum + Number(g.allocatedAmount || 0), 0);
    const availableCoreSavings = Math.max(0, coreSavings - totalAllocatedToGoals);

    return (
      <SavingsClient
        weeklyBudget={0}
        completedWeeks={[]}
        goals={goals}
        coreSavings={coreSavings}
        availableCoreSavings={availableCoreSavings}
        totalAllocatedToGoals={totalAllocatedToGoals}
        unspentSurplusTotal={0}
        sweptSurplus={0}
        availableSurplus={0}
        ongoingSpend={0}
        ongoingProjectedSurplus={0}
        isGuest={isGuest}
        savingsHistory={history}
      />
    );
  }

  // It's a Spending wallet: render scoped view
  const now = getNowInTimezone();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekStartStr = format(thisWeekStart, "yyyy-MM-dd");

  const { data: rawExpenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("wallet_id", wallet.id)
    .order("spent_at", { ascending: false });

  const expenses: ExpenseItem[] = (rawExpenses || []).map((e) => ({
    id: e.id,
    name: e.name,
    amount: Number(e.amount),
    category: e.category,
    note: e.note,
    spent_at: e.spent_at,
    is_exempt: e.note?.includes("#exempt") || false,
    wallet_id: e.wallet_id,
  }));

  const thisWeekExpenses = expenses.filter((e) => e.spent_at >= thisWeekStartStr);
  const currentWeekSpend = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

  const weeklyBudget = Number(wallet.weekly_budget || 0);
  const monthlyBudget = Number(wallet.monthly_budget || 0);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 pb-32">
      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Top Header */}
        <header className="flex items-center justify-between">
          <Link
            href="/saku"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Semua Saku</span>
          </Link>

          <UserMenu isGuest={isGuest} multiSakuEnabled={true} />
        </header>

        {/* Saku Profile Hero Card */}
        <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 p-6 shadow-sm relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: wallet.color || "#10b981" }}
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs"
                style={{
                  backgroundColor: `${wallet.color || "#10b981"}20`,
                  border: `1px solid ${wallet.color || "#10b981"}40`,
                }}
              >
                {wallet.emoji || "👛"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {wallet.name}
                  </h1>
                  {wallet.is_primary && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Utama
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Saku Belanja
                </p>
              </div>
            </div>
          </div>

          {/* Budget stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Terpakai Minggu Ini
              </span>
              <div className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                Rp {currentWeekSpend.toLocaleString("id-ID")}
              </div>
              {weeklyBudget > 0 && (
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  dari limit Rp {weeklyBudget.toLocaleString("id-ID")}
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                Total Transaksi
              </span>
              <div className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
                {expenses.length} Catatan
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {monthlyBudget > 0 ? `Limit bln: Rp ${monthlyBudget.toLocaleString("id-ID")}` : "Tanpa limit bulanan"}
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Pengeluaran di Saku Ini
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              {expenses.length} item
            </span>
          </div>

          <ExpenseList
            expenses={expenses}
            weeklyBudget={weeklyBudget}
          />
        </section>
      </div>
    </div>
  );
}
