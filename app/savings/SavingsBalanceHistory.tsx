"use client";

import { useState, useMemo } from "react";
import {
  History,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Target,
  Undo2,
  Search,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  Wallet,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { SavingsHistoryItem, deleteSavingsHistoryEntry } from "@/app/actions";

interface SavingsBalanceHistoryProps {
  history: SavingsHistoryItem[];
  coreSavings: number;
  onOpenAdjustmentModal: () => void;
}

export default function SavingsBalanceHistory({
  history,
  coreSavings,
  onOpenAdjustmentModal,
}: SavingsBalanceHistoryProps) {
  const { t, formatDate, formatCurrency } = useTranslation();

  const [activeFilter, setActiveFilter] = useState<"all" | "inflow" | "outflow" | "goals">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Totals calculations
  const { totalInflow, totalOutflow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    history.forEach((item) => {
      if (
        item.type === "manual_deposit" ||
        item.type === "surplus_sweep" ||
        item.type === "surplus_sweep_goal"
      ) {
        inflow += Number(item.amount || 0);
      } else if (item.type === "manual_withdraw") {
        outflow += Number(item.amount || 0);
      }
    });

    return { totalInflow: inflow, totalOutflow: outflow };
  }, [history]);

  // Filtered and searched list (newest first)
  const filteredHistory = useMemo(() => {
    let items = [...history];

    // Filter by type
    if (activeFilter === "inflow") {
      items = items.filter(
        (i) =>
          i.type === "manual_deposit" ||
          i.type === "surplus_sweep" ||
          i.type === "surplus_sweep_goal"
      );
    } else if (activeFilter === "outflow") {
      items = items.filter((i) => i.type === "manual_withdraw");
    } else if (activeFilter === "goals") {
      items = items.filter(
        (i) =>
          i.type === "goal_allocate" ||
          i.type === "goal_withdraw" ||
          i.type === "surplus_sweep_goal"
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          (i.note && i.note.toLowerCase().includes(q)) ||
          (i.goalName && i.goalName.toLowerCase().includes(q)) ||
          String(i.amount).includes(q)
      );
    }

    // Sort newest first
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [history, activeFilter, searchQuery]);

  // Chart data: chronological (oldest to newest)
  const chartPoints = useMemo(() => {
    if (history.length === 0) return [];
    const sortedChronological = [...history].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedChronological.map((item) => ({
      id: item.id,
      date: item.createdAt,
      balance: item.balanceAfter,
      amount: item.amount,
      type: item.type,
      note: item.note,
    }));
  }, [history]);

  // Chart coordinates
  const chartSvgData = useMemo(() => {
    if (chartPoints.length < 2) return null;

    const minBalance = Math.min(...chartPoints.map((p) => p.balance), 0);
    const maxBalance = Math.max(...chartPoints.map((p) => p.balance), coreSavings, 1000);
    const range = maxBalance - minBalance || 1;

    const width = 360;
    const height = 120;
    const paddingX = 20;
    const paddingY = 20;
    const innerW = width - paddingX * 2;
    const innerH = height - paddingY * 2;

    const points = chartPoints.map((p, idx) => {
      const x = paddingX + (idx / (chartPoints.length - 1)) * innerW;
      const y = paddingY + innerH - ((p.balance - minBalance) / range) * innerH;
      return { ...p, x, y };
    });

    const pathD = points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { points, pathD, areaD, width, height, minBalance, maxBalance };
  }, [chartPoints, coreSavings]);

  const handleDeleteEntry = async (item: SavingsHistoryItem) => {
    if (!confirm(t.savings.deleteHistoryConfirm)) return;

    try {
      setDeletingId(item.id);
      await deleteSavingsHistoryEntry(item.id);
    } finally {
      setDeletingId(null);
    }
  };

  const getTransactionConfig = (item: SavingsHistoryItem) => {
    switch (item.type) {
      case "manual_deposit":
        return {
          icon: <ArrowDownLeft className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />,
          bg: "bg-teal-100/70 dark:bg-teal-950/60 border-teal-200/60 dark:border-teal-800/60",
          textColor: "text-teal-700 dark:text-teal-300",
          badge: t.savings.typeDeposit,
          prefix: "+",
          amountColor: "text-teal-600 dark:text-teal-400 font-bold",
          defaultLabel: t.savings.typeDeposit,
        };
      case "manual_withdraw":
        return {
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
          bg: "bg-rose-100/70 dark:bg-rose-950/60 border-rose-200/60 dark:border-rose-800/60",
          textColor: "text-rose-700 dark:text-rose-300",
          badge: t.savings.typeWithdraw,
          prefix: "-",
          amountColor: "text-rose-600 dark:text-rose-400 font-bold",
          defaultLabel: t.savings.typeWithdraw,
        };
      case "surplus_sweep":
        return {
          icon: <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          bg: "bg-amber-100/70 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800/60",
          textColor: "text-amber-700 dark:text-amber-300",
          badge: t.savings.typeSurplus,
          prefix: "+",
          amountColor: "text-amber-600 dark:text-amber-400 font-bold",
          defaultLabel: t.savings.typeSurplus,
        };
      case "surplus_sweep_goal":
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          bg: "bg-amber-100/70 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800/60",
          textColor: "text-amber-700 dark:text-amber-300",
          badge: t.savings.typeSurplusGoal,
          prefix: "+",
          amountColor: "text-amber-600 dark:text-amber-400 font-bold",
          defaultLabel: t.savings.typeSurplusGoal,
        };
      case "goal_allocate":
        return {
          icon: <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          bg: "bg-indigo-100/70 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-800/60",
          textColor: "text-indigo-700 dark:text-indigo-300",
          badge: t.savings.typeGoalAllocate,
          prefix: "",
          amountColor: "text-indigo-600 dark:text-indigo-400 font-semibold",
          defaultLabel: t.savings.typeGoalAllocate,
        };
      case "goal_withdraw":
        return {
          icon: <Undo2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />,
          bg: "bg-violet-100/70 dark:bg-violet-950/60 border-violet-200/60 dark:border-violet-800/60",
          textColor: "text-violet-700 dark:text-violet-300",
          badge: t.savings.typeGoalWithdraw,
          prefix: "",
          amountColor: "text-violet-600 dark:text-violet-400 font-semibold",
          defaultLabel: t.savings.typeGoalWithdraw,
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />,
          bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
          textColor: "text-zinc-700 dark:text-zinc-300",
          badge: "Mutasi",
          prefix: "",
          amountColor: "text-zinc-800 dark:text-zinc-200 font-bold",
          defaultLabel: "Mutasi Saldo",
        };
    }
  };

  return (
    <div id="savings-history-section" className="flex flex-col gap-3 scroll-mt-6">
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{t.savings.balanceHistoryTitle}</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {history.length}
            </span>
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {t.savings.balanceHistorySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {history.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs ${
                showChart
                  ? "bg-teal-50 border border-teal-200 text-teal-700 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-300"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
              }`}
              title={t.savings.balanceTrendTitle}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t.savings.balanceTrendTitle}</span>
              {showChart ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAdjustmentModal}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.common.add}</span>
          </button>
        </div>
      </div>

      {/* Main History Container Card */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col gap-4">
        {/* Quick Summary Inflow / Outflow / Current Balance */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-2.5 dark:border-teal-900/30 dark:bg-teal-950/20">
            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3 text-teal-500" />
              {t.savings.totalInflow}
            </span>
            <p className="mt-0.5 text-xs font-bold text-teal-800 dark:text-teal-300 truncate">
              +{formatCurrency(totalInflow)}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-2.5 dark:border-rose-900/30 dark:bg-rose-950/20">
            <span className="text-[10px] font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-rose-500" />
              {t.savings.totalOutflow}
            </span>
            <p className="mt-0.5 text-xs font-bold text-rose-800 dark:text-rose-300 truncate">
              -{formatCurrency(totalOutflow)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-zinc-500" />
              {t.savings.currentBalance}
            </span>
            <p className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-white truncate">
              {formatCurrency(coreSavings)}
            </p>
          </div>
        </div>

        {/* Visual Balance Progression Chart (Collapsible / Expandable) */}
        {showChart && chartSvgData && (
          <div className="rounded-2xl border border-zinc-200/80 bg-linear-to-b from-teal-50/40 via-white to-zinc-50/30 p-3.5 dark:border-zinc-800 dark:bg-linear-to-b dark:from-teal-950/20 dark:via-zinc-900 dark:to-zinc-950 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              <span className="flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {t.savings.balanceTrendTitle}
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">
                {t.savings.balanceTrendSubtitle}
              </span>
            </div>

            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartSvgData.width} ${chartSvgData.height}`}
                className="w-full h-28 overflow-visible"
              >
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <path d={chartSvgData.areaD} fill="url(#balanceGrad)" />

                {/* Line Path */}
                <path
                  d={chartSvgData.pathD}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points on curve */}
                {chartSvgData.points.map((pt, i) => (
                  <g key={pt.id || i} className="group cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="fill-teal-600 stroke-2 stroke-white dark:stroke-zinc-900 transition-all group-hover:r-6"
                    />
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
              <span>
                {formatDate(chartPoints[0].date, "d MMM yyyy")}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {formatCurrency(chartPoints[chartPoints.length - 1].balance)}
              </span>
              <span>
                {formatDate(chartPoints[chartPoints.length - 1].date, "d MMM yyyy")}
              </span>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
            {(
              [
                { id: "all", label: t.savings.filterAll },
                { id: "inflow", label: t.savings.filterInflow },
                { id: "outflow", label: t.savings.filterOutflow },
                { id: "goals", label: t.savings.filterGoals },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex-1 py-1 px-2 text-[10px] font-semibold rounded-xl transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Filter */}
          {history.length > 3 && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.savings.searchHistoryPlaceholder}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-8 pr-7 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* History Transactions List */}
        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
            <History className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {searchQuery.trim() || activeFilter !== "all"
                ? t.savings.noMatchingHistory
                : t.savings.noHistoryTitle}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              {searchQuery.trim() || activeFilter !== "all"
                ? t.expenses.clearSearch
                : t.savings.noHistoryDesc}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-3 text-xs font-medium text-teal-600 hover:text-teal-700 underline cursor-pointer"
              >
                {t.expenses.clearSearch}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAdjustmentModal}
                className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.savings.addFirstEntry}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {filteredHistory.map((item) => {
              const cfg = getTransactionConfig(item);
              const isDeleting = deletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group transition-colors"
                >
                  {/* Left: Icon & Meta */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg}`}
                    >
                      {cfg.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.note || cfg.defaultLabel}
                        </span>
                        {item.goalName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium shrink-0 flex items-center gap-1">
                            <span>{item.goalEmoji || "🎯"}</span>
                            <span className="truncate max-w-[120px]">{item.goalName}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span>{formatDate(item.createdAt, "d MMM yyyy, HH:mm")}</span>
                        <span>•</span>
                        <span className={`font-medium ${cfg.textColor}`}>{cfg.badge}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Running Balance */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className={`text-xs ${cfg.amountColor}`}>
                        {cfg.prefix}{formatCurrency(Number(item.amount || 0))}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-medium">
                        {t.savings.runningBalance}: {formatCurrency(Number(item.balanceAfter || 0))}
                      </p>
                    </div>

                    {/* Delete button (with confirmation) */}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteEntry(item)}
                      title={t.savings.deleteHistoryButton}
                      aria-label={t.savings.deleteHistoryButton}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
