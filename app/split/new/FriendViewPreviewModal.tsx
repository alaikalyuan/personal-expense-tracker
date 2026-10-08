"use client";

import { useState } from "react";
import {
  X,
  CreditCard,
  Copy,
  Eye,
  ShieldCheck,
} from "lucide-react";
import {
  SplitCalculationSummary,
  ParticipantCalculation,
} from "@/utils/splitCalculator";
import { useTranslation } from "@/utils/i18n/context";

interface FriendViewPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  isPublishing: boolean;
  title: string;
  calculation: SplitCalculationSummary;
  paymentInfo: {
    method?: string;
    account_number?: string;
    account_name?: string;
    note?: string;
  };
}

export default function FriendViewPreviewModal({
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing,
  title,
  calculation,
  paymentInfo,
}: FriendViewPreviewModalProps) {
  const { formatCurrency } = useTranslation();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    calculation.participants.find((p) => !p.isCreator)?.participantId ||
      calculation.participants[0]?.participantId ||
      ""
  );

  if (!isOpen) return null;

  const activeParticipant: ParticipantCalculation | undefined =
    calculation.participants.find((p) => p.participantId === selectedParticipantId) ||
    calculation.participants[0];

  const formatRupiah = (amt: number) => {
    return formatCurrency(amt);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pratinjau Tampilan Teman
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {title ? `${title} · ` : ""}Inilah yang akan dilihat teman di browser
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Participant switcher tabs */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
              Pilih Peserta untuk Dilihat:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {calculation.participants.map((p) => {
                const isSelected = p.participantId === selectedParticipantId;
                return (
                  <button
                    key={p.participantId}
                    type="button"
                    onClick={() => setSelectedParticipantId(p.participantId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>{p.name}</span>
                    {p.isCreator && (
                      <span className="text-[10px] opacity-75 font-normal">(Host)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Mobile Card for this Friend */}
          {activeParticipant && (
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-4 sm:p-5 space-y-4">
              {/* Friend's Name & Total Owed */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Tagihan untuk {activeParticipant.name}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {formatRupiah(activeParticipant.totalOwed)}
                  </h3>
                </div>
                <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-700/40">
                  Belum Bayar
                </div>
              </div>

              {/* Itemized breakdown for this participant */}
              <div className="rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2">
                <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5 flex items-center justify-between">
                  <span>Rincian Menu / Pesanan</span>
                  <span>Porsi</span>
                </div>

                {activeParticipant.items.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-1">Tidak ada item tersendiri</p>
                ) : (
                  <div className="space-y-1.5">
                    {activeParticipant.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="truncate pr-2">
                          {item.name}
                          {item.splitBetweenCount > 1 && (
                            <span className="text-[10px] text-zinc-400 ml-1">
                              (patungan {item.splitBetweenCount} org)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                          {formatRupiah(item.shareAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotal, Tax, Service */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                    <span>Subtotal Menu</span>
                    <span>{formatRupiah(activeParticipant.itemsSubtotal)}</span>
                  </div>
                  {activeParticipant.taxShare > 0 && (
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                      <span>Pajak (Proporsional)</span>
                      <span>+{formatRupiah(activeParticipant.taxShare)}</span>
                    </div>
                  )}
                  {activeParticipant.serviceShare > 0 && (
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                      <span>Service Charge</span>
                      <span>+{formatRupiah(activeParticipant.serviceShare)}</span>
                    </div>
                  )}
                  {activeParticipant.feeShare > 0 && (
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400 text-[11px]">
                      <span>Ongkir / Biaya Lain</span>
                      <span>+{formatRupiah(activeParticipant.feeShare)}</span>
                    </div>
                  )}
                  {activeParticipant.discountShare > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <span>Diskon / Promo</span>
                      <span>-{formatRupiah(activeParticipant.discountShare)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Destination Box Preview */}
              {paymentInfo.account_number ? (
                <div className="rounded-xl bg-zinc-900 text-white dark:bg-zinc-800 p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Tujuan Transfer</span>
                    <span className="font-bold text-amber-400">{paymentInfo.method || "Transfer Bank"}</span>
                  </div>
                  <div className="flex items-center justify-between bg-zinc-800 dark:bg-zinc-900 rounded-lg p-2.5">
                    <div>
                      <p className="font-mono font-bold text-sm tracking-wide text-zinc-100">
                        {paymentInfo.account_number}
                      </p>
                      {paymentInfo.account_name && (
                        <p className="text-[11px] text-zinc-400">a/n {paymentInfo.account_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-300 bg-zinc-700/60 dark:bg-zinc-800 px-2 py-1 rounded-md">
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-3 text-center text-xs text-zinc-500">
                  <CreditCard className="w-4 h-4 mx-auto mb-1 opacity-60" />
                  Belum ada nomor rekening/e-wallet yang dimasukkan
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Lanjut Edit
          </button>
          <button
            type="button"
            onClick={onConfirmPublish}
            disabled={isPublishing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <span>Mempublikasikan...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Semua Sesuai, Publikasikan!</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
