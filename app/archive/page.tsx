import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ArrowLeft, Archive } from "lucide-react";
import UserMenu from "@/app/UserMenu";
import ArchiveWeekList, { ArchivedWeek } from "./ArchiveWeekList";
import { ExpenseItem } from "@/app/ExpenseList";
import { getNowInTimezone } from "@/utils/date";

export default async function ArchivePage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Current week boundary (Monday 00:00)
  const now = getNowInTimezone();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekStartStr = format(thisWeekStart, "yyyy-MM-dd");

  // Fetch all user expenses ordered by date descending
  const { data: allExpenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("spent_at", { ascending: false });

  // Group past expenses by week (strictly before the current active week)
  const weekMap = new Map<string, ExpenseItem[]>();

  (allExpenses || []).forEach((expense) => {
    const dateStr = expense.spent_at.includes("T")
      ? expense.spent_at.split("T")[0]
      : expense.spent_at;

    // Only include past weeks in the archive
    if (dateStr >= thisWeekStartStr) {
      return;
    }

    const expDate = parseISO(dateStr);
    const expWeekStart = startOfWeek(expDate, { weekStartsOn: 1 });
    const weekKey = format(expWeekStart, "yyyy-MM-dd");

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(expense);
  });

  // Build structured ArchivedWeek array sorted newest first
  const archivedWeeks: ArchivedWeek[] = Array.from(weekMap.entries())
    .map(([weekStartStr, expenses]) => {
      const startDate = parseISO(weekStartStr);
      const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const totalAmount = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );

      // Find top category
      const categoryCounts: Record<string, number> = {};
      expenses.forEach((e) => {
        categoryCounts[e.category] =
          (categoryCounts[e.category] || 0) + Number(e.amount);
      });
      const topCategory =
        Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "None";

      const label = `${format(startDate, "MMM d")} – ${format(
        endDate,
        "MMM d, yyyy"
      )}`;

      return {
        weekId: weekStartStr,
        startDateStr: weekStartStr,
        endDateStr,
        label,
        totalAmount,
        expenses,
        topCategory,
      };
    })
    .sort((a, b) => (a.startDateStr < b.startDateStr ? 1 : -1));

  // Historical overview metrics
  const totalArchivedSpend = archivedWeeks.reduce(
    (sum, w) => sum + w.totalAmount,
    0
  );
  const avgArchivedSpend =
    archivedWeeks.length > 0
      ? Math.round(totalArchivedSpend / archivedWeeks.length)
      : 0;
  const totalEntries = archivedWeeks.reduce(
    (sum, w) => sum + w.expenses.length,
    0
  );

  return (
    <main className="max-w-md mx-auto p-4 pb-48 flex flex-col gap-6 font-sans">
      {/* Top Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            aria-label="Back to tracker"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold tracking-tight text-lg flex items-center gap-1.5">
              <Archive className="w-4 h-4 text-amber-400" />
              Archive
            </h1>
            <p className="text-[11px] text-zinc-400">Past weeks spending history</p>
          </div>
        </div>

        <UserMenu />
      </div>

      {/* Historical Overview Banner */}
      {archivedWeeks.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-linear-to-b from-zinc-900 to-zinc-950 p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Historical Summary
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-zinc-400">Total Spent</p>
              <p className="mt-0.5 text-xs font-bold text-white truncate">
                Rp {totalArchivedSpend.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="border-l border-zinc-800/80 pl-2.5">
              <p className="text-[10px] text-zinc-400">Weekly Avg</p>
              <p className="mt-0.5 text-xs font-bold text-zinc-200 truncate">
                Rp {avgArchivedSpend.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="border-l border-zinc-800/80 pl-2.5">
              <p className="text-[10px] text-zinc-400">History</p>
              <p className="mt-0.5 text-xs font-bold text-zinc-200">
                {archivedWeeks.length} {archivedWeeks.length === 1 ? "week" : "weeks"}
              </p>
              <p className="text-[9px] text-zinc-500">{totalEntries} entries</p>
            </div>
          </div>
        </div>
      )}

      {/* Accordion List of Past Weeks */}
      <ArchiveWeekList weeks={archivedWeeks} />

      {/* Bottom spacer for clearance above floating navbar and gradient */}
      <div className="h-8 shrink-0" aria-hidden="true" />
    </main>
  );
}

