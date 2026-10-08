import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { startOfWeek, format } from "date-fns";
import { getNowInTimezone } from "@/utils/date";
import {
  getWalletBalances,
  getMultiSakuEnabledServer,
} from "@/utils/wallets/server";
import SakuHubClient from "./SakuHubClient";
import Link from "next/link";
import { Layers, Sparkles } from "lucide-react";
import { setMultiSakuEnabled } from "./actions";

export default async function SakuPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/guest?next=/saku");
  }

  const isGuest = Boolean(user.is_anonymous);
  const isMultiSakuEnabled = await getMultiSakuEnabledServer(cookieStore, supabase, user.id);

  // If user has not enabled multi-saku yet, show enablement gate
  if (!isMultiSakuEnabled) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4 pb-28">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
            <Layers className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Sistem Multi-Saku SakuTrack
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Pisahkan anggaran pengeluaran harian, jajan kopi, dana darurat, dan tabungan impian Anda dalam berbagai pos saku terpisah yang rapi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-left text-xs space-y-2 text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Pos pengeluaran dengan anggaran mingguan & bulanan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-teal-500 font-bold">✓</span>
              <span>Pos tabungan dengan target saldo terpisah</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span>Transfer instan & pantau total kekayaan</span>
            </div>
          </div>

          <form action={setMultiSakuEnabled.bind(null, true)}>
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>Aktifkan Multi-Saku Sekarang</span>
            </button>
          </form>

          <Link
            href="/savings"
            className="inline-block text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Kembali ke Halaman Tabungan
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all active wallet balances
  const wallets = await getWalletBalances(supabase, user.id);

  // Calculate current week spending per wallet
  const now = getNowInTimezone();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekStartStr = format(thisWeekStart, "yyyy-MM-dd");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("wallet_id, amount, spent_at")
    .eq("user_id", user.id)
    .gte("spent_at", thisWeekStartStr);

  const weeklySpendingMap: Record<string, number> = {};
  (expenses || []).forEach((e) => {
    if (e.wallet_id) {
      weeklySpendingMap[e.wallet_id] = (weeklySpendingMap[e.wallet_id] || 0) + Number(e.amount || 0);
    }
  });

  return (
    <SakuHubClient
      wallets={wallets}
      weeklySpendingMap={weeklySpendingMap}
      isGuest={isGuest}
    />
  );
}
