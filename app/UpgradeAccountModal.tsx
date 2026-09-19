"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  Sparkles,
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { upgradeGuestAccount, modalLogin } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";

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
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(initialError || null);
      setIsSuccess(false);
    }
  }, [isOpen, initialMode, initialError]);

  if (!isOpen) return null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              {mode === "signup" ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{t.guest.upgradeModalTitle}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span>{t.guest.loginTitle}</span>
                </>
              )}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              {mode === "signup"
                ? t.guest.upgradeModalSubtitle
                : t.guest.loginSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label={t.common.close}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {successMessage}
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3.5">
            {/* Segmented Mode Switcher: Sign Up vs Log In */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 text-xs select-none">
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {t.guest.tabSignUp}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {t.guest.tabLogIn}
              </button>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                {error}
              </div>
            )}

            {/* Google 1-Click Option */}
            <button
              type="button"
              onClick={handleGoogleLink}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900 cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
            </button>

            <div className="relative my-0.5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500 font-medium">
                  {t.login.or}
                </span>
              </div>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {t.guest.upgradeEmailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.login.emailPlaceholder}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:border-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {t.guest.upgradePasswordLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:border-zinc-400 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center whitespace-nowrap"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {mode === "signup"
                          ? t.guest.upgradeSubmittingBtn
                          : t.guest.loginSubmittingBtn}
                      </span>
                    </>
                  ) : (
                    <>
                      {mode === "signup" ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t.guest.upgradeSubmitBtn}</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3.5 h-3.5" />
                          <span>{t.guest.loginSubmitBtn}</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Switch Link at bottom */}
            <div className="text-center pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setError(null);
                }}
                className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {mode === "signup" ? t.guest.switchToLogIn : t.guest.switchToSignUp}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
