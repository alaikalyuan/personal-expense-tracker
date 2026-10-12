"use client";

import { useState, useEffect, useTransition } from "react";
import {
  EmailSyncSettings,
  getEmailSyncSettings,
  updateEmailSyncSettings,
  regenerateEmailSyncToken,
  parseAndProcessPastedEmail,
} from "./actions";
import {
  Mail,
  X,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  FileText,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { formatMoney } from "@/utils/money";
import { useTranslation } from "@/utils/i18n/context";
import type { CategoryKey } from "@/utils/i18n/dictionaries";

interface EmailSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailSyncSettingsModal({
  isOpen,
  onClose,
}: EmailSyncSettingsModalProps) {
  const { t, currency } = useTranslation();
  const [activeTab, setActiveTab] = useState<"settings" | "test">("settings");
  const [settings, setSettings] = useState<EmailSyncSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [mode, setMode] = useState<"auto" | "review">("review");
  const [targetWalletId, setTargetWalletId] = useState<string>("primary");

  // Paste Test states
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState<{
    success: boolean;
    message?: string;
    result?: any;
    mode?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getEmailSyncSettings()
      .then((data) => {
        if (data) {
          setSettings(data);
          setMode(data.mode);
          setTargetWalletId(data.targetWalletId || "primary");
        }
      })
      .finally(() => setLoading(false));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const emailDomain = process.env.NEXT_PUBLIC_EMAIL_SYNC_DOMAIN || "sakutrack.my.id";
  const forwardingAddress = settings?.token
    ? `sync-${settings.token}@${emailDomain}`
    : "";

  const handleCopy = () => {
    if (!forwardingAddress) return;
    navigator.clipboard.writeText(forwardingAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    startTransition(async () => {
      try {
        await updateEmailSyncSettings({
          mode,
          targetWalletId: targetWalletId === "primary" ? null : targetWalletId,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
    });
  };

  const handleRegenerateToken = () => {
    if (!confirm(t.emailSync.resetConfirm)) return;
    startTransition(async () => {
      try {
        const newToken = await regenerateEmailSyncToken();
        if (settings) {
          setSettings({ ...settings, token: newToken });
        }
      } catch (err) {
        console.error("Failed to regenerate token:", err);
      }
    });
  };

  const handleProcessPasted = async () => {
    if (!pasteText.trim()) return;
    setPasteLoading(true);
    setPasteResult(null);
    try {
      const res = await parseAndProcessPastedEmail(pasteText);
      setPasteResult(res);
      if (res.success) {
        // Refresh settings pending count
        getEmailSyncSettings().then((d) => d && setSettings(d));
      }
    } catch (err: any) {
      setPasteResult({
        success: false,
        message: err.message || t.emailSync.extractFailed,
      });
    } finally {
      setPasteLoading(false);
    }
  };

  const loadSampleEmail = () => {
    setPasteText(`Livin' <noreply.livin@bankmandiri.co.id>
Pembayaran Berhasil

Halo ALAIKAL HAMDIA HAMDANI,

Berikut adalah detail transaksi Anda dengan QR:

Penerima
TEH CAMELLIA
Surabaya (Kota) - ID

Tanggal
12 Okt 2026

Jam
12:02:55 WIB

Nominal Transaksi
Rp 5.000,00`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t.emailSync.modalTitle}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {t.emailSync.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/70 px-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 border-b-2 py-3 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{t.emailSync.tabSettings}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={`flex items-center gap-1.5 border-b-2 py-3 text-xs font-semibold transition-all ml-6 cursor-pointer ${
              activeTab === "test"
                ? "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t.emailSync.tabPaste}</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : activeTab === "settings" ? (
            <>
              {/* Privacy guarantee note */}
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5 text-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  {t.emailSync.privacyNote}
                </div>
              </div>

              {/* Hybrid Mode Preference */}
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {t.emailSync.modeTitle}
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5">
                  {t.emailSync.modeDesc}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("review")}
                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      mode === "review"
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/20"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {t.emailSync.modeReview}
                      </span>
                      {mode === "review" && <Check className="h-4 w-4 text-amber-600" />}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t.emailSync.modeReviewDesc}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("auto")}
                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      mode === "auto"
                        ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/20"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {t.emailSync.modeAuto}
                      </span>
                      {mode === "auto" && <Check className="h-4 w-4 text-amber-600" />}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t.emailSync.modeAutoDesc}
                    </p>
                  </button>
                </div>
              </div>

              {/* Target Saku Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {t.emailSync.sakuTitle}
                </label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                  {t.emailSync.sakuDesc}
                </p>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <option value="primary">👛 {t.emailSync.primarySakuDefault}</option>
                  {settings?.spendingWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.emoji} {wallet.name} {wallet.is_primary ? `(${t.emailSync.primarySakuDefault})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Private Sync Address */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {t.emailSync.forwardingTitle}
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateToken}
                    disabled={isPending}
                    className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>{t.emailSync.resetToken}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 truncate rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-mono text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                    {forwardingAddress}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 shadow-2xs hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {settings?.lastVerificationCode && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold shrink-0">{t.emailSync.verificationCodeTitle}</span>
                      {settings.lastVerificationCode.startsWith("http") ? (
                        <a
                          href={settings.lastVerificationCode}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-mono font-bold text-emerald-700 underline dark:text-emerald-300 hover:text-emerald-800"
                          title={settings.lastVerificationCode}
                        >
                          Buka Link Konfirmasi ↗
                        </a>
                      ) : (
                        <span className="font-mono font-bold tracking-wider">{settings.lastVerificationCode}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.lastVerificationCode!);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer shrink-0 ml-2"
                    >
                      {t.emailSync.copyCodeBtn}
                    </button>
                  </div>
                )}
              </div>

              {/* Step-by-Step Gmail Guide */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                  {t.emailSync.gmailGuideTitle}
                </h4>
                <ol className="list-decimal space-y-1.5 pl-4 text-zinc-600 dark:text-zinc-400 text-[11px]">
                  <li>{t.emailSync.gmailStep1}</li>
                  <li>
                    {t.emailSync.gmailStep2}{" "}
                    <code className="rounded bg-zinc-200/80 px-1 py-0.5 dark:bg-zinc-700 font-mono">
                      noreply.livin@bankmandiri.co.id
                    </code>
                  </li>
                  <li>{t.emailSync.gmailStep3}</li>
                  <li>{t.emailSync.gmailStep4}</li>
                </ol>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-amber-700 active:scale-98 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  <span>{saveSuccess ? t.emailSync.savedToast : t.emailSync.saveBtn}</span>
                </button>
              </div>
            </>
          ) : (
            /* Test / Manual Paste Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {t.emailSync.pasteTitle}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t.emailSync.pasteDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSampleEmail}
                  className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
                >
                  {t.emailSync.loadSampleBtn}
                </button>
              </div>

              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={t.emailSync.pastePlaceholder}
                rows={7}
                className="w-full rounded-2xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              />

              <button
                type="button"
                onClick={handleProcessPasted}
                disabled={pasteLoading || !pasteText.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-98 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
              >
                {pasteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-400" />
                )}
                <span>{t.emailSync.extractBtn}</span>
              </button>

              {pasteResult && (
                <div
                  className={`rounded-2xl border p-4 text-xs ${
                    pasteResult.success
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
                      : "border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"
                  }`}
                >
                  <div className="font-bold mb-1">
                    {pasteResult.success ? `✅ ${t.emailSync.extractSuccess}` : `❌ ${t.emailSync.extractFailed}`}
                  </div>
                  <p className="text-[11px] mb-2">{pasteResult.message}</p>

                  {pasteResult.result && (
                    <div className="rounded-xl bg-white/80 p-3 space-y-1 text-[11px] dark:bg-zinc-900/80">
                      <div>
                        <strong>{t.emailSync.merchantLabel}:</strong> {pasteResult.result.merchantName}
                      </div>
                      <div>
                        <strong>{t.emailSync.amountLabel}:</strong>{" "}
                        {formatMoney(pasteResult.result.amount, currency as any)}
                      </div>
                      <div>
                        <strong>{t.emailSync.dateLabel}:</strong> {pasteResult.result.date}
                        {pasteResult.result.time ? ` • ${pasteResult.result.time}` : ""}
                      </div>
                      <div>
                        <strong>{t.emailSync.categoryLabel}:</strong>{" "}
                        {t.categories[pasteResult.result.suggestedCategory as CategoryKey] || pasteResult.result.suggestedCategory}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
