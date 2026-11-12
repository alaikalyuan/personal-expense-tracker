"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions";
import { setMultiSakuEnabled } from "@/app/saku/actions";
import { Menu, Archive, CreditCard, Bell, Mail, LogOut, UserPlus, ChevronRight } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { useTheme } from "@/utils/theme/context";
import { PALETTE_CHOICES, type PaletteChoice } from "@/utils/theme/palette";
import { CURRENCY_CODES, SUPPORTED_CURRENCIES, SupportedCurrency } from "@/utils/money";
import { FEATURE_MULTI_SAKU_ENABLED } from "@/utils/wallets/config";
import { useAiAssistant } from "@/app/ai/AiAssistantProvider";
import Dialog from "@/app/ui/Dialog";

// Settings dialogs load the first time they are opened.
const NotificationSettingsModal = dynamic(() => import("./NotificationSettingsModal"), { ssr: false });
const EmailSyncSettingsModal = dynamic(() => import("@/app/email-sync/EmailSyncSettingsModal"), { ssr: false });

interface UserMenuProps {
  isGuest?: boolean;
  onOpenUpgrade?: (mode?: "signup" | "login") => void;
  multiSakuEnabled?: boolean;
}

const ROW =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink hover:bg-paper active:bg-line";

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="flex h-11 w-14 shrink-0 items-center justify-center disabled:opacity-50"
    >
      <span
        className={`flex h-7 w-12 items-center rounded-full border p-0.5 transition-colors ${
          checked ? "border-ok bg-ok" : "border-ink-soft bg-card"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full transition-transform ${checked ? "translate-x-5 bg-card" : "translate-x-0 bg-ink-soft"}`}
        />
      </span>
    </button>
  );
}

// Each swatch shows its palette's accent on its paper, so it reads the same in either mode.
const SWATCH: Record<PaletteChoice, string> = {
  orange: "#e8590c",
  pink: "#d6336c",
  blue: "#1f6feb",
  mono: "#1c1c1c",
  // The four colors in the order the day goes through them.
  hybrid: "conic-gradient(#e8590c 0 25%, #1f6feb 0 50%, #d6336c 0 75%, #1c1c1c 0)",
};

function PalettePicker() {
  const { t } = useTranslation();
  const { palette, activePalette, setPalette } = useTheme();
  const names = t.nav.paletteNames;
  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline justify-between gap-3 text-sm font-semibold text-ink">
        <span id="menu-palette">{t.nav.palette}</span>
        <span className="text-ink-soft">{names[palette]}</span>
      </div>
      <div role="group" aria-labelledby="menu-palette" className="mt-2 flex flex-wrap gap-2">
        {PALETTE_CHOICES.map((choice) => {
          const selected = palette === choice;
          return (
            <button
              key={choice}
              type="button"
              aria-pressed={selected}
              aria-label={names[choice]}
              title={names[choice]}
              onClick={() => setPalette(choice)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                selected ? "border-ink" : "border-transparent hover:border-line"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-8 w-8 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                style={{ background: SWATCH[choice] }}
              />
            </button>
          );
        })}
      </div>
      {palette === "hybrid" && (
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {t.nav.hybridHint} {t.nav.hybridNow.replace("{name}", names[activePalette])}
        </p>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-xl border border-line bg-paper p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`min-h-11 min-w-14 rounded-lg px-3 text-sm font-semibold ${
            value === opt.value ? "bg-card text-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function UserMenu({ isGuest = false, onOpenUpgrade, multiSakuEnabled }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState<"notifications" | "email" | null>(null);
  const [loadedSettings, setLoadedSettings] = useState({ notifications: false, email: false });
  const { locale, setLocale, currency, setCurrency, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { isAiEnabled, setIsAiEnabled } = useAiAssistant();
  const [isPending, startTransition] = useTransition();
  const [localOverride, setLocalOverride] = useState<boolean | null>(null);

  const isMultiSaku =
    FEATURE_MULTI_SAKU_ENABLED &&
    (localOverride !== null
      ? localOverride
      : multiSakuEnabled !== undefined
      ? multiSakuEnabled
      : typeof document !== "undefined"
      ? document.cookie.includes("MULTI_SAKU_ENABLED=true")
      : false);

  const askToSignIn = (mode: "signup" | "login", next?: string) => {
    setIsOpen(false);
    if (onOpenUpgrade) {
      onOpenUpgrade(mode);
    } else {
      router.push(next ? `/login?next=${next}` : `/?auth=${mode}`);
    }
  };

  const handleToggleMultiSaku = () => {
    if (isGuest) {
      askToSignIn("signup");
      return;
    }
    const nextVal = !isMultiSaku;
    setLocalOverride(nextVal);
    startTransition(async () => {
      try {
        await setMultiSakuEnabled(nextVal);
        router.refresh();
      } catch (err) {
        console.error("Failed to toggle multi saku:", err);
        setLocalOverride(null);
      }
    });
  };

  const showSettings = (which: "notifications" | "email") => {
    setIsOpen(false);
    setLoadedSettings((prev) => ({ ...prev, [which]: true }));
    setOpenSettings(which);
  };

  const pageLink = (href: string, label: string, Icon: typeof Archive) => {
    const current = pathname.startsWith(href);
    if (isGuest && href === "/subscriptions") {
      return (
        <button type="button" onClick={() => askToSignIn("login", href)} className={ROW}>
          <Icon className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
          <span className="flex-1">{label}</span>
          <span className="text-xs font-medium text-ink-soft">{t.nav.loginBadge}</span>
        </button>
      );
    }
    return (
      <Link href={href} onClick={() => setIsOpen(false)} aria-current={current ? "page" : undefined} className={ROW}>
        <Icon className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
        <span className="flex-1">{label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
      </Link>
    );
  };

  const settingRow = "flex min-h-12 items-center justify-between gap-3 px-3 text-sm font-semibold text-ink";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={t.nav.openMenu}
        aria-haspopup="dialog"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink hover:bg-paper active:bg-line"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={t.nav.openMenu} closeLabel={t.common.close}>
        <div className="-mx-2 flex flex-col gap-4">
          <section aria-labelledby="menu-pages">
            <h3 id="menu-pages" className="px-3 pb-1 text-xs font-semibold text-ink-soft">
              {t.home.menuPages}
            </h3>
            {pageLink("/subscriptions", t.nav.subscriptions, CreditCard)}
            {pageLink("/archive", t.nav.archive, Archive)}
            <button type="button" onClick={() => showSettings("notifications")} className={ROW}>
              <Bell className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
              <span className="flex-1">{t.nav.notifications}</span>
            </button>
            {!isGuest && (
              <button type="button" onClick={() => showSettings("email")} className={ROW}>
                <Mail className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden="true" />
                <span className="flex-1">{t.nav.emailSync}</span>
              </button>
            )}
          </section>

          <section aria-labelledby="menu-settings" className="border-t border-line pt-3">
            <h3 id="menu-settings" className="px-3 pb-1 text-xs font-semibold text-ink-soft">
              {t.home.menuSettings}
            </h3>
            <div className={settingRow}>
              <span>{t.nav.language}</span>
              <Segmented
                label={t.nav.language}
                value={locale}
                onChange={setLocale}
                options={[
                  { value: "id", label: "ID" },
                  { value: "en", label: "EN" },
                ]}
              />
            </div>
            <div className={settingRow}>
              <span>{t.nav.theme}</span>
              <Segmented
                label={t.nav.theme}
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "light", label: t.nav.light },
                  { value: "dark", label: t.nav.dark },
                ]}
              />
            </div>
            <PalettePicker />
            <div className={settingRow}>
              <label htmlFor="menu-currency">{t.nav.currency}</label>
              <select
                id="menu-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                className="min-h-11 rounded-xl border border-line bg-paper px-3 text-sm font-semibold text-ink"
              >
                {CURRENCY_CODES.map((code) => {
                  const cfg = SUPPORTED_CURRENCIES[code];
                  return (
                    <option key={code} value={code}>
                      {cfg.code} ({cfg.symbol})
                    </option>
                  );
                })}
              </select>
            </div>
            {FEATURE_MULTI_SAKU_ENABLED && (
              <div className={settingRow}>
                <span>{t.saku.multiSakuMode}</span>
                <Switch checked={isMultiSaku} onChange={handleToggleMultiSaku} label={t.saku.multiSakuMode} disabled={isPending} />
              </div>
            )}
            <div className={settingRow}>
              <span>{t.aiAdvisor.aiModeSwitch}</span>
              <Switch checked={isAiEnabled} onChange={() => setIsAiEnabled(!isAiEnabled)} label={t.aiAdvisor.aiModeSwitch} />
            </div>
          </section>

          <section className="border-t border-line pt-3">
            {isGuest ? (
              <button type="button" onClick={() => askToSignIn("signup")} className={`${ROW} text-accent-strong`}>
                <UserPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{t.guest.createAccountOrSignIn}</span>
              </button>
            ) : (
              <form action={logout}>
                <button type="submit" className={`${ROW} text-danger`}>
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{t.nav.signOut}</span>
                </button>
              </form>
            )}
          </section>
        </div>
      </Dialog>

      {loadedSettings.notifications && (
        <NotificationSettingsModal
          isOpen={openSettings === "notifications"}
          onClose={() => setOpenSettings(null)}
          isGuest={isGuest}
        />
      )}
      {loadedSettings.email && !isGuest && (
        <EmailSyncSettingsModal isOpen={openSettings === "email"} onClose={() => setOpenSettings(null)} />
      )}
    </>
  );
}
