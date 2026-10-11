"use client";

import { useState, useTransition, useMemo } from "react";
import { Check, Loader2, Sparkles, AlertCircle, AlertTriangle } from "lucide-react";
import { AiProposal } from "@/utils/ai/tools";
import { executeAiAction } from "@/app/ai/actions";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/utils/i18n/context";

interface ActionProposalCardProps {
  proposal: AiProposal;
  onUpdateProposal: (updated: AiProposal) => void;
}

export default function ActionProposalCard({
  proposal,
  onUpdateProposal,
}: ActionProposalCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(proposal.error || null);

  const isBatchLog = proposal.action === "log_expenses";

  // For batch logging: track which rows are selected.
  // Duplicate rows start un-checked (soft warning).
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
    if (!isBatchLog) return new Set();
    const set = new Set<number>();
    proposal.preview.lines.forEach((line, idx) => {
      if (!line.isDuplicate) {
        set.add(idx);
      }
    });
    // If every item happens to be marked duplicate, keep them un-checked so user explicitly decides
    return set;
  });

  const toggleIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    setErrorMessage(null);

    // If batch log, filter items based on selectedIndices
    let finalArgs = proposal.args;
    if (isBatchLog) {
      const rawExpenses = Array.isArray(proposal.args.expenses) ? proposal.args.expenses : [];
      const filtered = rawExpenses.filter((_, idx) => selectedIndices.has(idx));
      if (filtered.length === 0) {
        setErrorMessage("Pilih minimal 1 pengeluaran untuk dicatat.");
        return;
      }
      finalArgs = { ...proposal.args, expenses: filtered };
    }

    startTransition(async () => {
      try {
        const result = await executeAiAction({
          action: proposal.action,
          args: finalArgs,
        });

        if (result.success) {
          onUpdateProposal({
            ...proposal,
            status: "confirmed",
          });
          router.refresh();
        } else {
          setErrorMessage(result.error || "Gagal menerapkan tindakan.");
          onUpdateProposal({
            ...proposal,
            status: "failed",
            error: result.error,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses aksi.";
        setErrorMessage(msg);
        onUpdateProposal({
          ...proposal,
          status: "failed",
          error: msg,
        });
      }
    });
  };

  const handleCancel = () => {
    onUpdateProposal({
      ...proposal,
      status: "cancelled",
    });
  };

  const hasAnySelected = !isBatchLog || selectedIndices.size > 0;

  return (
    <div className="my-2.5 overflow-hidden rounded-2xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-teal-500/15 bg-teal-500/10 dark:bg-teal-900/30">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {proposal.preview.title}
          </span>
        </div>
        <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[9px] font-semibold text-teal-700 dark:text-teal-300">
          Aksi AI
        </span>
      </div>

      {/* Body details */}
      <div className="p-3 space-y-2.5 text-xs">
        {proposal.preview.lines.map((line, idx) => {
          const isSelected = selectedIndices.has(idx);

          return (
            <div
              key={idx}
              className={`rounded-xl p-2 transition-colors ${
                line.isDuplicate
                  ? "border border-amber-300/60 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20"
                  : "bg-white/50 dark:bg-zinc-900/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {isBatchLog && proposal.status === "pending" && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleIndex(idx)}
                      className="mt-0.5 h-3.5 w-3.5 rounded-sm border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  )}
                  <div>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium leading-tight block">
                      {line.label}
                    </span>
                    {line.duplicateWarning && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{line.duplicateWarning}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  {line.before && (
                    <span className="text-zinc-400 line-through text-[11px]">
                      {line.before}
                    </span>
                  )}
                  {line.before && <span className="text-zinc-400 text-[10px]">→</span>}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {line.after}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {errorMessage && (
          <div className="mt-2 flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[11px] bg-red-500/10 p-2 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-3 py-2 border-t border-teal-500/15 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between gap-2">
        <div>
          {isBatchLog && proposal.status === "pending" && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {selectedIndices.size} dari {proposal.preview.lines.length} dipilih
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {proposal.status === "confirmed" ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold py-1">
              <Check className="w-4 h-4" />
              <span>Tindakan Berhasil Diterapkan</span>
            </div>
          ) : proposal.status === "cancelled" ? (
            <span className="text-zinc-400 text-xs py-1 italic">
              Tindakan Dibatalkan
            </span>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCancel}
                className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                disabled={isPending || !hasAnySelected}
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Konfirmasi</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
