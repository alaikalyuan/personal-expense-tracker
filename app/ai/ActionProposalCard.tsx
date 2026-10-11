"use client";

import { useState, useTransition } from "react";
import { Check, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
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

  const handleConfirm = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await executeAiAction({
          action: proposal.action,
          args: proposal.args,
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
      } catch (err: any) {
        const msg = err.message || "Terjadi kesalahan saat memproses aksi.";
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
      <div className="p-3 space-y-2 text-xs">
        {proposal.preview.lines.map((line, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              {line.label}
            </span>
            <div className="flex items-center gap-1.5">
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
        ))}

        {errorMessage && (
          <div className="mt-2 flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[11px] bg-red-500/10 p-2 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-3 py-2 border-t border-teal-500/15 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-end gap-2">
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
              disabled={isPending}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
  );
}
