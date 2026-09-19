"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Zap,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  LogIn,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";

interface WelcomeGuestModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenUpgrade?: (mode?: "signup" | "login") => void;
}

export default function WelcomeGuestModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpenUpgrade,
}: WelcomeGuestModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If controlled, obey prop
    if (typeof controlledIsOpen === "boolean") {
      setIsOpen(controlledIsOpen);
      return;
    }

    // Otherwise, check localStorage and URL param
    if (typeof window !== "undefined") {
      const welcomed = localStorage.getItem("sakutrack_guest_welcomed");
      const urlParams = new URLSearchParams(window.location.search);
      const isWelcomeParam = urlParams.get("welcome") === "true";
      const hasAuthParam = urlParams.has("auth");

      if (!hasAuthParam && (!welcomed || isWelcomeParam)) {
        setIsOpen(true);
      }
    }
  }, [controlledIsOpen]);

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sakutrack_guest_welcomed", "true");
      // Clean up URL parameter cleanly
      const url = new URL(window.location.href);
      if (url.searchParams.has("welcome")) {
        url.searchParams.delete("welcome");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
    setIsOpen(false);
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  const handleSignInOrRegister = () => {
    handleContinue();
    if (onOpenUpgrade) {
      onOpenUpgrade("signup");
    }
  };

  const handleLogInHere = () => {
    handleContinue();
    if (onOpenUpgrade) {
      onOpenUpgrade("login");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleContinue();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-modal-in flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="text-center pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-zinc-200/80 shadow-xs dark:border-zinc-700/80 p-1 mb-2.5 overflow-hidden">
            <Image
              src="/icons/icon-192.png"
              alt="SakuTrack"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            {t.guest.welcomeTitle}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {t.guest.welcomeSubtitle}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 py-4 flex flex-col gap-4 pr-1">
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.guest.features.instantTitle}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {t.guest.features.instantDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.guest.features.budgetTitle}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {t.guest.features.budgetDesc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {t.guest.features.insightsTitle}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {t.guest.features.insightsDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Guest Mode & Free Usage Notice with Risks */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{t.guest.riskCardTitle}</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {t.guest.riskCardDesc}
            </p>
            <ul className="flex flex-col gap-1.5 pt-1">
              {t.guest.riskPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2.5">
          {/* Primary Call to Action: Continue */}
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 py-3 text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t.guest.continueBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Action: Sign In or Register */}
          <button
            type="button"
            onClick={handleSignInOrRegister}
            className="w-full rounded-2xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 py-2.5 text-xs font-semibold active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.guest.signInOrRegisterBtn}</span>
          </button>

          {/* Returning User Helper Link */}
          <div className="text-center pt-1">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t.guest.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={handleLogInHere}
                className="font-semibold text-zinc-900 dark:text-zinc-200 underline hover:opacity-80 transition-opacity cursor-pointer"
              >
                {t.guest.logInHere}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

