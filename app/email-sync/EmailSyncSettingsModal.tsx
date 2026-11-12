"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  EmailSyncSettings,
  getEmailSyncSettings,
  updateEmailSyncSettings,
  regenerateEmailSyncToken,
  parseAndProcessPastedEmail,
} from "./actions";
import { useTranslation } from "@/utils/i18n/context";
import type { ParsedLivinTransaction } from "@/utils/email/livinParser";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { FieldShell, SelectField, CONTROL_CLASS } from "@/app/ui/Field";

interface EmailSyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "setup" | "settings" | "paste";
const TABS: Tab[] = ["setup", "settings", "paste"];

const LIVIN_SENDER = "noreply.livin@bankmandiri.co.id";
const GMAIL_FORWARDING_URL = "https://mail.google.com/mail/u/0/#settings/fwdandpop";
const GMAIL_SEARCH_URL = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`from:${LIVIN_SENDER}`)}`;

/**
 * The stored verification value comes from an inbound email, so only show it
 * when it is a plain numeric code or a link on Google's own mail hosts.
 */
function readVerification(value: string | null | undefined): { code?: string; url?: string } | null {
  if (!value) return null;
  if (/^\d{6,12}$/.test(value)) return { code: value };
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && (url.hostname === "mail.google.com" || url.hostname === "mail-settings.google.com")) {
      return { url: value };
    }
  } catch {}
  return null;
}

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  }, []);
  return { copiedKey, copy };
}

export default function EmailSyncSettingsModal({ isOpen, onClose }: EmailSyncSettingsModalProps) {
  const { t, formatCurrency, getCategoryLabel } = useTranslation();
  const s = t.emailSync;
  const tabsId = useId();

  const [activeTab, setActiveTab] = useState<Tab>("setup");
  const [settings, setSettings] = useState<EmailSyncSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "saved" | "failed">("idle");
  const { copiedKey, copy } = useCopy();

  const [mode, setMode] = useState<"auto" | "review">("review");
  const [targetWalletId, setTargetWalletId] = useState<string>("primary");

  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteResult, setPasteResult] = useState<{
    success: boolean;
    message?: string;
    result?: ParsedLivinTransaction;
  } | null>(null);

  const applySettings = useCallback((data: EmailSyncSettings) => {
    setSettings(data);
    setMode(data.mode);
    const primary = data.spendingWallets.find((w) => w.is_primary);
    setTargetWalletId(!data.targetWalletId || data.targetWalletId === primary?.id ? "primary" : data.targetWalletId);
  }, []);

  const handleLoaded = useCallback(
    (data: EmailSyncSettings | null, first: boolean) => {
      setLoading(false);
      setRefreshing(false);
      if (!data) {
        setLoadFailed(true);
        return;
      }
      setLoadFailed(false);
      if (first) {
        applySettings(data);
        // Someone who already received a Gmail code has been through setup.
        setActiveTab(readVerification(data.lastVerificationCode) ? "settings" : "setup");
      } else {
        setSettings((prev) =>
          prev ? { ...prev, lastVerificationCode: data.lastVerificationCode, pendingCount: data.pendingCount } : data
        );
      }
    },
    [applySettings]
  );

  const fetchSettings = useCallback(
    (first: boolean) =>
      getEmailSyncSettings().then(
        (data) => handleLoaded(data, first),
        () => handleLoaded(null, first)
      ),
    [handleLoaded]
  );

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getEmailSyncSettings().then(
      (data) => active && handleLoaded(data, true),
      () => active && handleLoaded(null, true)
    );
    return () => {
      active = false;
    };
  }, [isOpen, handleLoaded]);

  const refresh = () => {
    setRefreshing(true);
    fetchSettings(false);
  };

  const retry = () => {
    setLoading(true);
    fetchSettings(true);
  };

  const handleClose = () => {
    setLoading(true);
    setSaveState("idle");
    setPasteResult(null);
    onClose();
  };

  const emailDomain = process.env.NEXT_PUBLIC_EMAIL_SYNC_DOMAIN || "sakutrack.my.id";
  const forwardingAddress = settings?.token ? `sync-${settings.token}@${emailDomain}` : "";
  const verification = readVerification(settings?.lastVerificationCode);
  const otherWallets = settings?.spendingWallets.filter((w) => !w.is_primary) ?? [];

  const handleSave = () => {
    setSaveState("idle");
    startTransition(async () => {
      try {
        await updateEmailSyncSettings({
          mode,
          targetWalletId: targetWalletId === "primary" ? null : targetWalletId,
        });
        setSaveState("saved");
      } catch {
        setSaveState("failed");
      }
    });
  };

  const handleRegenerateToken = () => {
    if (!confirm(s.resetConfirm)) return;
    startTransition(async () => {
      try {
        const newToken = await regenerateEmailSyncToken();
        setSettings((prev) => (prev ? { ...prev, token: newToken, lastVerificationCode: null } : prev));
      } catch {
        setSaveState("failed");
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
      if (res.success) fetchSettings(false);
    } catch (err: unknown) {
      setPasteResult({ success: false, message: err instanceof Error ? err.message : s.extractFailed });
    } finally {
      setPasteLoading(false);
    }
  };

  const loadSampleEmail = () => {
    setPasteText(`Livin' <${LIVIN_SENDER}>
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

  const handleTabKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(TABS.indexOf(activeTab) + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setActiveTab(next);
    document.getElementById(`${tabsId}-tab-${next}`)?.focus();
  };

  const tabLabel: Record<Tab, string> = { setup: s.tabSetup, settings: s.tabSettings, paste: s.tabPaste };

  const footer =
    !loading && !loadFailed && activeTab === "settings" ? (
      <div className="flex w-full flex-col gap-2">
        {saveState !== "idle" && (
          <p role="status" className={`text-sm font-medium ${saveState === "saved" ? "text-ok" : "text-danger"}`}>
            {saveState === "saved" ? s.savedToast : s.saveFailed}
          </p>
        )}
        <Button variant="primary" block onClick={handleSave} disabled={isPending} className="w-full">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {s.saveBtn}
        </Button>
      </div>
    ) : undefined;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title={s.modalTitle}
      description={s.modalSubtitle}
      closeLabel={t.common.close}
      footer={footer}
    >
      {loading ? (
        <div className="flex h-48 items-center justify-center" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-ink-soft" aria-hidden="true" />
          <span className="sr-only">{t.common.loading}</span>
        </div>
      ) : loadFailed || !settings ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-ink-soft">{s.loadFailed}</p>
          <Button onClick={retry}>{s.retryBtn}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Focal point: the one value the whole setup revolves around. */}
          <section aria-labelledby={`${tabsId}-address`} className="rounded-2xl border border-line bg-paper p-4">
            <h3 id={`${tabsId}-address`} className="text-sm font-semibold text-ink-soft">
              {s.addressLabel}
            </h3>
            <p className="mt-1 break-all font-mono text-[15px] font-semibold leading-snug text-ink">{forwardingAddress}</p>
            <Button
              variant="secondary"
              onClick={() => copy("address", forwardingAddress)}
              className="mt-3 w-full"
            >
              {copiedKey === "address" ? (
                <Check className="h-4 w-4 text-ok" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copiedKey === "address" ? s.copied : s.copyAddress}
            </Button>
            {settings.pendingCount > 0 && (
              <p className="mt-3 text-sm text-ink">
                {s.pendingNotice.replace("{count}", String(settings.pendingCount))}
              </p>
            )}
          </section>

          <div role="tablist" aria-label={s.modalTitle} className="grid grid-cols-3 gap-1 rounded-xl bg-paper p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                id={`${tabsId}-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tabsId}-panel-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={handleTabKey}
                className={`min-h-11 rounded-lg px-2 text-sm font-semibold transition-colors ${
                  activeTab === tab ? "bg-card text-ink shadow-xs" : "text-ink-soft hover:text-ink active:bg-line"
                }`}
              >
                {tabLabel[tab]}
              </button>
            ))}
          </div>

          <div
            id={`${tabsId}-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${activeTab}`}
          >
            {activeTab === "setup" && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 text-sm text-ink-soft">
                  <p>{s.setupIntro}</p>
                  <p>{s.mobileNote}</p>
                </div>

                <section aria-labelledby={`${tabsId}-part1`} className="flex flex-col gap-3">
                  <h3 id={`${tabsId}-part1`} className="text-base font-bold text-ink">
                    {s.partForwardTitle}
                  </h3>
                  <ol className="flex flex-col gap-4">
                    <Step n={1}>
                      <p>{s.stepOpenSettings}</p>
                      <ExternalButton href={GMAIL_FORWARDING_URL} label={s.openGmailSettings} />
                    </Step>
                    <Step n={2}>
                      <p>{s.stepAddAddress}</p>
                    </Step>
                    <Step n={3}>
                      <p>{s.stepCode}</p>
                      <div className="rounded-xl border border-line bg-paper p-3">
                        {verification?.code ? (
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-ink-soft">{s.codeLabel}</p>
                              <p className="font-mono text-lg font-bold tabular-nums tracking-wider text-ink">
                                {verification.code}
                              </p>
                            </div>
                            <Button onClick={() => copy("code", verification.code!)}>
                              {copiedKey === "code" ? (
                                <Check className="h-4 w-4 text-ok" aria-hidden="true" />
                              ) : (
                                <Copy className="h-4 w-4" aria-hidden="true" />
                              )}
                              {copiedKey === "code" ? s.copied : s.copyCodeBtn}
                            </Button>
                          </div>
                        ) : verification?.url ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm text-ink">{s.codeLinkFound}</p>
                            <ExternalButton href={verification.url} label={s.codeOpenLink} />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-ink-soft" role="status">
                              {s.codeWaiting}
                            </p>
                            <Button variant="ghost" onClick={refresh} disabled={refreshing} className="shrink-0 whitespace-nowrap">
                              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
                              {s.codeRefresh}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Step>
                    <Step n={4} attention>
                      <p>{s.stepKeepDisabled}</p>
                    </Step>
                  </ol>
                </section>

                <section aria-labelledby={`${tabsId}-part2`} className="flex flex-col gap-3">
                  <h3 id={`${tabsId}-part2`} className="text-base font-bold text-ink">
                    {s.partFilterTitle}
                  </h3>
                  <ol className="flex flex-col gap-4" start={5}>
                    <Step n={5}>
                      <p>{s.stepSearch}</p>
                      <ExternalButton href={GMAIL_SEARCH_URL} label={s.openGmailSearch} />
                    </Step>
                    <Step n={6}>
                      <p>{s.stepFilterFrom}</p>
                      <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 rounded-lg bg-paper px-2.5 py-2 font-mono text-sm text-ink">
                          {LIVIN_SENDER.split("@")[0]}
                          <wbr />@{LIVIN_SENDER.split("@")[1]}
                        </code>
                        <Button
                          variant="ghost"
                          onClick={() => copy("sender", LIVIN_SENDER)}
                          aria-label={s.copySender}
                          className="w-11 px-0"
                        >
                          {copiedKey === "sender" ? (
                            <Check className="h-4 w-4 text-ok" aria-hidden="true" />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </Step>
                    <Step n={7}>
                      <p>{s.stepForwardTo}</p>
                    </Step>
                  </ol>
                </section>

                <p className="rounded-xl bg-ok-soft p-3 text-sm text-ink">{s.stepDone}</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="flex flex-col gap-5">
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-sm font-semibold text-ink">{s.modeTitle}</legend>
                  {(
                    [
                      { value: "review", label: s.modeReview, desc: s.modeReviewDesc },
                      { value: "auto", label: s.modeAuto, desc: s.modeAutoDesc },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-3 hover:border-ink-soft has-[:checked]:border-accent has-[:checked]:bg-paper has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                    >
                      <input
                        type="radio"
                        name="email-sync-mode"
                        value={opt.value}
                        checked={mode === opt.value}
                        onChange={() => setMode(opt.value)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-ink">{opt.label}</span>
                        <span className="text-sm text-ink-soft">{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                {otherWallets.length > 0 && (
                  <SelectField
                    label={s.sakuTitle}
                    hint={s.sakuDesc}
                    value={targetWalletId}
                    onChange={(e) => setTargetWalletId(e.target.value)}
                  >
                    <option value="primary">{s.primarySakuDefault}</option>
                    {otherWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.emoji} {wallet.name}
                      </option>
                    ))}
                  </SelectField>
                )}

                <div className="flex flex-col gap-1.5 border-t border-line pt-4">
                  <p className="text-sm font-semibold text-ink">{s.resetTitle}</p>
                  <p className="text-sm text-ink-soft">{s.resetHint}</p>
                  <Button variant="danger" onClick={handleRegenerateToken} disabled={isPending} className="mt-1 self-start">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {s.resetToken}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "paste" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-ink-soft">{s.pasteDesc}</p>
                <FieldShell label={s.pasteTitle}>
                  {({ id, describedBy }) => (
                    <textarea
                      id={id}
                      aria-describedby={describedBy}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={s.pastePlaceholder}
                      rows={7}
                      className={`${CONTROL_CLASS} py-2.5 font-mono text-sm`}
                    />
                  )}
                </FieldShell>
                <div className="flex gap-3">
                  <Button onClick={loadSampleEmail}>{s.loadSampleBtn}</Button>
                  <Button
                    variant="primary"
                    block
                    onClick={handleProcessPasted}
                    disabled={pasteLoading || !pasteText.trim()}
                  >
                    {pasteLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {s.extractBtn}
                  </Button>
                </div>

                {pasteResult && (
                  <div
                    role="status"
                    className={`rounded-xl p-4 text-sm text-ink ${pasteResult.success ? "bg-ok-soft" : "bg-danger-soft"}`}
                  >
                    <p className={`font-bold ${pasteResult.success ? "text-ok" : "text-danger"}`}>
                      {pasteResult.success ? s.extractSuccess : s.extractFailed}
                    </p>
                    {pasteResult.message && <p className="mt-1">{pasteResult.message}</p>}
                    {pasteResult.result && (
                      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-card p-3">
                        <dt className="text-ink-soft">{s.merchantLabel}</dt>
                        <dd className="font-semibold">{pasteResult.result.merchantName}</dd>
                        <dt className="text-ink-soft">{s.amountLabel}</dt>
                        <dd className="font-semibold tabular-nums">{formatCurrency(pasteResult.result.amount)}</dd>
                        <dt className="text-ink-soft">{s.dateLabel}</dt>
                        <dd className="tabular-nums">
                          {pasteResult.result.date}
                          {pasteResult.result.time ? `, ${pasteResult.result.time}` : ""}
                        </dd>
                        <dt className="text-ink-soft">{s.categoryLabel}</dt>
                        <dd>{getCategoryLabel(pasteResult.result.suggestedCategory)}</dd>
                      </dl>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Step({ n, attention = false, children }: { n: number; attention?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${
          attention ? "bg-accent text-on-accent" : "bg-paper text-ink"
        }`}
      >
        {n}
      </span>
      <div className={`flex min-w-0 flex-1 flex-col gap-2 pt-0.5 text-sm ${attention ? "font-medium text-ink" : "text-ink"}`}>
        {children}
      </div>
    </li>
  );
}

function ExternalButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-line bg-card px-4 text-sm font-semibold text-ink hover:bg-paper active:bg-line"
    >
      <ExternalLink className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      {label}
    </a>
  );
}
