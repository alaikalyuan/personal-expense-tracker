"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  Sparkles,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { upgradeGuestAccount, modalLogin } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import Dialog from "@/app/ui/Dialog";
import Button from "@/app/ui/Button";
import { SegmentedControl } from "@/app/ui/Toggle";

export interface UpgradeAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (mergedCount?: number) => void;
  initialMode?: "signup" | "login";
  initialError?: string | null;
}

export default function UpgradeAccountModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signup",
  initialError = null,
}: UpgradeAccountModalProps) {
  if (!isOpen) return null;

  return (
    <UpgradeAccountModalContent
      key={`${initialMode}-${initialError || ""}`}
      onClose={onClose}
      onSuccess={onSuccess}
      initialMode={initialMode}
      initialError={initialError}
    />
  );
}

function UpgradeAccountModalContent({
  onClose,
  onSuccess,
  initialMode = "signup",
  initialError = null,
}: {
  onClose: () => void;
  onSuccess?: (mergedCount?: number) => void;
  initialMode?: "signup" | "login";
  initialError?: string | null;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      if (mode === "signup") {
        const result = await upgradeGuestAccount(formData);
        if (result?.error) {
          setError(result.error);
          setLoading(false);
        } else {
          setSuccessMessage(t.guest.upgradeSuccessMessage);
          setIsSuccess(true);
          setLoading(false);
          if (onSuccess) onSuccess();
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 1400);
        }
      } else {
        const result = await modalLogin(formData);
        if (result?.error) {
          setError(result.error);
          setLoading(false);
        } else {
          setSuccessMessage(t.guest.loginSuccessMessage);
          setIsSuccess(true);
          setLoading(false);
          if (onSuccess) onSuccess(result.mergedCount);
          setTimeout(() => {
            onClose();
            const mergedParam = result.mergedCount && result.mergedCount > 0 ? `?merged=${result.mergedCount}` : "";
            window.location.href = `/${mergedParam}`;
          }, 1200);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  };

  const handleGoogleLink = async () => {
    try {
      setError(null);
      setGoogleLoading(true);
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect Google account");
      setGoogleLoading(false);
    }
  };

  const switchMode = (next: "signup" | "login") => {
    setMode(next);
    setError(null);
  };

  const inputClass =
    "w-full min-h-11 rounded-xl border border-field-line bg-paper pl-9 pr-3 text-base text-ink placeholder:text-ink-soft/70 hover:border-ink-soft";

  return (
    <Dialog
      isOpen
      onClose={onClose}
      busy={loading}
      title={mode === "signup" ? t.guest.upgradeModalTitle : t.guest.loginTitle}
      description={mode === "signup" ? t.guest.upgradeModalSubtitle : t.guest.loginSubtitle}
      closeLabel={t.common.close}
      footer={
        isSuccess ? undefined : (
          <>
            <Button block onClick={onClose} disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button block variant="primary" type="submit" form="auth-form" disabled={loading} className="whitespace-nowrap">
              {loading ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
                  {mode === "signup" ? t.guest.upgradeSubmittingBtn : t.guest.loginSubmittingBtn}
                </>
              ) : mode === "signup" ? (
                <>
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  {t.guest.upgradeSubmitBtn}
                </>
              ) : (
                <>
                  <LogIn aria-hidden="true" className="h-4 w-4" />
                  {t.guest.loginSubmitBtn}
                </>
              )}
            </Button>
          </>
        )
      }
    >
      {isSuccess ? (
        <div role="status" className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-ink">{successMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SegmentedControl
            ariaLabel={`${t.guest.tabSignUp} / ${t.guest.tabLogIn}`}
            value={mode}
            onChange={switchMode}
            options={[
              {
                value: "signup",
                label: (
                  <>
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                    {t.guest.tabSignUp}
                  </>
                ),
              },
              {
                value: "login",
                label: (
                  <>
                    <LogIn aria-hidden="true" className="h-4 w-4" />
                    {t.guest.tabLogIn}
                  </>
                ),
              },
            ]}
          />

          {error && (
            <p role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <Button onClick={handleGoogleLink} disabled={googleLoading || loading} className="w-full">
            {googleLoading ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin" />
            ) : (
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {t.guest.upgradeGoogleBtn}
          </Button>

          <div className="relative" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 font-medium text-ink-soft">{t.login.or}</span>
            </div>
          </div>

          <form id="auth-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-sm font-semibold text-ink">
                {t.guest.upgradeEmailLabel}
              </label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.login.emailPlaceholder}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-sm font-semibold text-ink">
                {t.guest.upgradePasswordLabel}
              </label>
              <div className="relative">
                <Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={inputClass}
                />
              </div>
            </div>
          </form>

          <div className="border-t border-line pt-1 text-center">
            <Button variant="ghost" onClick={() => switchMode(mode === "signup" ? "login" : "signup")} className="text-xs">
              {mode === "signup" ? t.guest.switchToLogIn : t.guest.switchToSignUp}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
