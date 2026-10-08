"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  ArrowLeft,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import {
  SplitBillRecord,
  SplitParticipantRecord,
  SplitItemRecord,
  getCachedOrCalculateSplit,
  invalidateSplitCache,
  SplitCalculationSummary,
} from "@/utils/splitCalculator";
import { toggleParticipantPaid, deleteSplitBill } from "@/app/split/actions";
import { useTranslation } from "@/utils/i18n/context";

interface SplitBillViewerProps {
  bill: SplitBillRecord;
  participants: SplitParticipantRecord[];
  items: SplitItemRecord[];
  isHost: boolean;
}

export default function SplitBillViewer({
  bill,
  participants,
  items,
  isHost,
}: SplitBillViewerProps) {
  const router = useRouter();
  const { formatCurrency } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteBill = async () => {
    setIsDeleting(true);
    try {
      await deleteSplitBill(bill.id);
      invalidateSplitCache(bill.id);
      router.push("/split");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus tagihan.");
      setIsDeleting(false);
    }
  };

  // Compute once or load from LocalStorage cache
  const calculation: SplitCalculationSummary = useMemo(() => {
    return getCachedOrCalculateSplit(bill, items, participants);
  }, [bill, items, participants]);

  // Calculate settlement progress
  const paidCount = participants.filter((p) => p.is_paid).length;
  const allPaid = participants.length > 0 && paidCount === participants.length;

  // Generate QR Code on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#18181b",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR code", err));
    }
  }, []);

  // Trigger confetti if all participants are paid
  useEffect(() => {
    if (allPaid) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [allPaid]);

  const formatRupiah = (amt: number) => {
    return formatCurrency(amt);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyAccount = (textToCopy: string) => {
    if (typeof window !== "undefined" && textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleTogglePaid = async (participantId: string, currentStatus: boolean) => {
    setIsUpdatingStatus(participantId);
    try {
      await toggleParticipantPaid(bill.id, participantId, !currentStatus);
      // Invalidate local calculation cache so fresh status reflects
      invalidateSplitCache(bill.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // WhatsApp Share handler
  const handleShareWhatsApp = () => {
    if (typeof window === "undefined") return;
    const currentUrl = window.location.href;

    const lines: string[] = [];
    lines.push(`🍽️ *Split Bill: ${bill.title}*`);
    lines.push(`Total Tagihan: ${formatRupiah(calculation.grandTotal)}`);
    lines.push("");
    lines.push("*Rincian per Orang:*");

    calculation.participants.forEach((p) => {
      const statusIcon = p.isPaid ? "✅" : "⏳";
      lines.push(`• ${p.name}: *${formatRupiah(p.totalOwed)}* ${statusIcon}`);
    });

    if (bill.payment_info?.account_number) {
      lines.push("");
      lines.push(`💳 *Transfer ke ${bill.payment_info.method || "Bank"}:*`);
      lines.push(`No: ${bill.payment_info.account_number}`);
      if (bill.payment_info.account_name) {
        lines.push(`a/n: ${bill.payment_info.account_name}`);
      }
    }

    lines.push("");
    lines.push("🔗 *Cek rincian menu lengkap & status di browser:*");
    lines.push(currentUrl);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={isHost ? "/split" : "/"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHost ? "Riwayat Split" : "Kembali"}</span>
        </Link>

        {isHost && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              Host
            </span>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Bill Hero Card */}
      <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Rincian Split Bill
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
              {bill.title}
            </h1>
            <p suppressHydrationWarning className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {new Date(bill.created_at).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
              Total Tagihan
            </span>
            <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50">
              {formatRupiah(calculation.grandTotal)}
            </span>
          </div>
        </div>

        {/* Progress & Status Bar */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
              Status Pembayaran:
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {paidCount} dari {participants.length} orang lunas ({Math.round((paidCount / Math.max(1, participants.length)) * 100)}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{
                width: `${(paidCount / Math.max(1, participants.length)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Action Sharing Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Disalin!" : "Salin Link"}</span>
          </button>

          {/* Show QR Code */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-500" />
            <span>Kode QR</span>
          </button>

          {/* Share to WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Payment Transfer Details Card */}
      {bill.payment_info?.account_number && (
        <div className="rounded-3xl border border-zinc-900 bg-zinc-900 text-white dark:border-zinc-800 dark:bg-zinc-900 p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-zinc-200">
                Transfer ke {bill.payment_info.method || "Bank"}
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-zinc-800 text-amber-400 px-2 py-0.5 rounded-md">
              Tujuan Transfer
            </span>
          </div>

          <div className="flex items-center justify-between bg-zinc-800/90 dark:bg-zinc-800 p-3 rounded-2xl">
            <div>
              <p className="font-mono text-base sm:text-lg font-bold tracking-wider text-zinc-100">
                {bill.payment_info.account_number}
              </p>
              {bill.payment_info.account_name && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  a/n {bill.payment_info.account_name}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCopyAccount(bill.payment_info.account_number || "")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAccount ? "Disalin!" : "Salin No"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Participants Breakdown Accordion */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
          Rincian Pembayaran Masing-Masing ({participants.length} Orang)
        </h2>

        {calculation.participants.map((p) => {
          const isExpanded = expandedParticipantId === p.participantId;
          const isUpdating = isUpdatingStatus === p.participantId;

          return (
            <div
              key={p.participantId}
              className={`rounded-3xl border transition-all overflow-hidden ${
                p.isPaid
                  ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  : "border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10"
              }`}
            >
              {/* Header row */}
              <div
                onClick={() =>
                  setExpandedParticipantId(isExpanded ? null : p.participantId)
                }
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                      p.isPaid
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    }`}
                  >
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.isCreator && (
                        <span className="text-[10px] text-zinc-400 font-normal">
                          (Host)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
                      {formatRupiah(p.totalOwed)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      p.isPaid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {p.isPaid ? "Lunas" : "Belum Bayar"}
                  </span>

                  <button
                    type="button"
                    aria-label="Detail"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Item Breakdown */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3 text-xs">
                  <div className="space-y-1.5 pt-2">
                    <p className="font-semibold text-zinc-500 text-[11px]">
                      Menu & Porsi Pesanan:
                    </p>
                    {p.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="truncate pr-2">
                          {item.name}
                          {item.splitBetweenCount > 1 && (
                            <span className="text-[10px] text-zinc-400 ml-1">
                              (patungan {item.splitBetweenCount} org)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(item.shareAmount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Proportional breakdown items */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Subtotal Menu</span>
                      <span>{formatRupiah(p.itemsSubtotal)}</span>
                    </div>
                    {p.taxShare > 0 && (
                      <div className="flex justify-between">
                        <span>Pajak (Proporsional)</span>
                        <span>+{formatRupiah(p.taxShare)}</span>
                      </div>
                    )}
                    {p.serviceShare > 0 && (
                      <div className="flex justify-between">
                        <span>Service Charge</span>
                        <span>+{formatRupiah(p.serviceShare)}</span>
                      </div>
                    )}
                    {p.feeShare > 0 && (
                      <div className="flex justify-between">
                        <span>Ongkir / Biaya Tambahan</span>
                        <span>+{formatRupiah(p.feeShare)}</span>
                      </div>
                    )}
                    {p.discountShare > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Diskon / Potongan</span>
                        <span>-{formatRupiah(p.discountShare)}</span>
                      </div>
                    )}
                  </div>

                  {/* Host Action: Toggle Paid / Unpaid */}
                  {isHost && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePaid(p.participantId, p.isPaid);
                        }}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                          p.isPaid
                            ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                        }`}
                      >
                        {isUpdating
                          ? "Menyimpan..."
                          : p.isPaid
                          ? "Tandai Belum Bayar"
                          : "Tandai Sudah Bayar"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* QR Code Modal for In-Person Scanning */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Pindai Kode QR
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Arahkan kamera HP teman ke kode QR ini untuk langsung membuka rincian tagihan
              </p>
            </div>

            {/* QR Code Canvas / Image */}
            <div className="flex justify-center p-3 bg-white rounded-2xl border border-zinc-200 shadow-inner">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt={`QR Code untuk split bill ${bill.title}`}
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-zinc-400">
                  Membuat QR Code...
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Host */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Hapus Split Bill Ini?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Tagihan <b>&quot;{bill.title}&quot;</b> dan seluruh rincian teman akan dihapus secara permanen.
                  {bill.logged_expense_id && (
                    <span className="block mt-1 text-rose-600 dark:text-rose-400 font-medium">
                      Catatan pengeluaran terkait di pelacak pribadi juga akan ikut dihapus.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteBill}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
