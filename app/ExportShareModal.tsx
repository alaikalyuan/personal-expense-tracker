"use client";

import { useState, useMemo } from "react";
import {
  X,
  Share2,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  Download,
  Calendar,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { ExpenseItem } from "./ExpenseList";
import { parseISO } from "date-fns";

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  weeklyBudget?: number;
  startDateStr?: string;
  endDateStr?: string;
}

export default function ExportShareModal({
  isOpen,
  onClose,
  expenses,
  weeklyBudget = 500000,
  startDateStr,
  endDateStr,
}: ExportShareModalProps) {
  const { t, locale, formatDate, getCategoryLabel, formatCurrency } = useTranslation();
  const [activeTab, setActiveTab] = useState<"whatsapp" | "csv">("whatsapp");
  const [copied, setCopied] = useState(false);

  // Compute summary stats for the recap
  const summary = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const budget = Number(weeklyBudget || 0);
    const remaining = budget - total;
    const isOver = remaining < 0;

    // Category aggregations
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((item) => {
      categoryTotals[item.category] =
        (categoryTotals[item.category] || 0) + Number(item.amount);
    });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        category: cat,
        label: getCategoryLabel(cat),
        amount: amt,
        percentage: total > 0 ? Math.round((amt / total) * 100) : 0,
      }));

    // Largest single spend
    const largestExpense =
      expenses.length > 0
        ? expenses.reduce((max, item) =>
            Number(item.amount) > Number(max.amount) ? item : max
          )
        : null;

    // Date range formatting
    let dateRangeText = "";
    if (startDateStr && endDateStr) {
      try {
        const start = parseISO(startDateStr);
        const end = parseISO(endDateStr);
        dateRangeText = `${formatDate(start, "d MMM")} – ${formatDate(
          end,
          "d MMM yyyy"
        )}`;
      } catch {
        dateRangeText = `${startDateStr} – ${endDateStr}`;
      }
    }

    return {
      total,
      budget,
      remaining,
      isOver,
      dailyAvg: Math.round(total / 7),
      topCategories,
      largestExpense,
      dateRangeText,
    };
  }, [expenses, weeklyBudget, startDateStr, endDateStr, formatDate, getCategoryLabel]);

  // Generate plain text recap for WhatsApp
  const recapText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`📊 *${t.exportShare.recapTitle}*`);
    if (summary.dateRangeText) {
      lines.push(`🗓️ ${t.exportShare.recapWeek}: ${summary.dateRangeText}`);
    }
    lines.push("");
    lines.push(
      `💰 *${t.exportShare.recapTotal}:* ${formatCurrency(summary.total)}`
    );

    if (summary.budget > 0) {
      lines.push(
        `🎯 *${t.exportShare.recapBudget}:* ${formatCurrency(summary.budget)}`
      );
      if (summary.isOver) {
        lines.push(
          `⚠️ *${
            t.exportShare.recapOverBudget
          }:* +${formatCurrency(Math.abs(summary.remaining))}`
        );
      } else {
        lines.push(
          `✅ *${
            t.exportShare.recapRemaining
          }:* ${formatCurrency(summary.remaining)}`
        );
      }
    }

    lines.push(
      `📈 *${t.exportShare.recapDailyAvg}:* ${formatCurrency(summary.dailyAvg)}/${locale === "id" ? "hari" : "day"}`
    );

    if (summary.topCategories.length > 0) {
      lines.push("");
      lines.push(`🏆 *${t.exportShare.recapTopCategories}:*`);
      summary.topCategories.slice(0, 3).forEach((item) => {
        lines.push(
          ` • ${item.label}: ${formatCurrency(item.amount)} (${
            item.percentage
          }%)`
        );
      });
    }

    if (summary.largestExpense) {
      lines.push("");
      lines.push(
        `⭐ *${t.exportShare.recapLargestSpend}:* ${
          summary.largestExpense.name
        } (${formatCurrency(Number(summary.largestExpense.amount))})`
      );
    }

    lines.push("");
    lines.push(`✨ _${t.exportShare.recapFooter}_`);

    return lines.join("\n");
  }, [summary, t, locale, formatCurrency]);

  const handleCopyRecap = async () => {
    try {
      await navigator.clipboard.writeText(recapText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    // If Web Share API is available (mobile browsers), prefer native share
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: t.exportShare.recapTitle,
          text: recapText,
        })
        .catch(() => {
          // Fallback to direct wa.me URL
          window.open(
            `https://wa.me/?text=${encodeURIComponent(recapText)}`,
            "_blank"
          );
        });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(recapText)}`,
        "_blank"
      );
    }
  };

  const handleDownloadCsv = () => {
    if (expenses.length === 0) return;

    const headers = [
      t.exportShare.csvColDate,
      t.exportShare.csvColName,
      t.exportShare.csvColCategory,
      t.exportShare.csvColAmount,
      t.exportShare.csvColNote,
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = expenses.map((item) => {
      const dateStr = item.spent_at.includes("T")
        ? item.spent_at.split("T")[0]
        : item.spent_at;
      return [
        escapeCsv(dateStr),
        escapeCsv(item.name),
        escapeCsv(getCategoryLabel(item.category)),
        Number(item.amount),
        escapeCsv(item.note || ""),
      ].join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\r\n");

    // Add UTF-8 BOM so Excel opens file without character encoding issues
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const dateSuffix =
      startDateStr || new Date().toISOString().split("T")[0];
    const fileName = `SakuTrack_${dateSuffix}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              {t.exportShare.modalTitle}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t.exportShare.modalSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 text-xs mt-3 select-none">
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "whatsapp"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>{t.exportShare.tabWhatsApp}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("csv")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "csv"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>{t.exportShare.tabCsv}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-3 overflow-y-auto flex-1 pr-0.5">
          {activeTab === "whatsapp" ? (
            <div className="flex flex-col gap-3">
              {/* WhatsApp Message Preview Box */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/20 p-3.5">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/50 dark:border-emerald-800/40 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  <span>Pratinjau Pesan / Preview</span>
                  {summary.dateRangeText && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {summary.dateRangeText}
                    </span>
                  )}
                </div>
                <pre className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed select-all">
                  {recapText}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyRecap}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 active:scale-98 transition-all dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:bg-zinc-800 shadow-2xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t.exportShare.recapCopied}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-500" />
                      <span>{t.exportShare.copyRecap}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-3 text-xs font-semibold active:scale-98 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{t.exportShare.openWhatsApp}</span>
                </button>
              </div>
            </div>
          ) : (
            /* CSV Export Tab */
            <div className="flex flex-col gap-4 py-2">
              <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-zinc-950/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.exportShare.csvTitle}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {t.exportShare.csvSubtitle}
                    </p>
                  </div>
                </div>

                {/* CSV File Info & Columns */}
                <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] flex flex-col gap-1.5">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>{t.archive.entryCount || "Total"}:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {expenses.length} {t.archive.entriesCount || "entri"}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>{t.exportShare.recapTotal}:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(summary.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Format:</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      UTF-8 BOM (.csv)
                    </span>
                  </div>
                </div>
              </div>

              {/* Download CSV Button */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={expenses.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 py-3 px-4 text-xs font-semibold active:scale-98 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>
                  {t.exportShare.downloadCsv} ({expenses.length}{" "}
                  {t.archive.entriesCount || "entri"})
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

