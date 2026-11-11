"use client";

import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Check, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { continueAsGuest } from "@/app/actions";

interface WelcomeGuestModalProps {
  /** Path to return to after the guest session is created. */
  next?: string;
  onOpenAuth: (mode: "signup" | "login") => void;
}

function GuestButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="min-h-12 w-full rounded-xl bg-accent px-4 text-base font-bold text-on-accent hover:brightness-95 active:brightness-90 disabled:opacity-60"
    >
      {label}
    </button>
  );
}

/**
 * The first screen for a visitor with no session. It is a page, not a modal:
 * what the app does, what guest mode costs, and two clear ways in.
 * A guest account is created only by pressing the guest button.
 */
export default function WelcomeGuestModal({ next, onOpenAuth }: WelcomeGuestModalProps) {
  const { t } = useTranslation();
  const points = [t.home.welcomePoint1, t.home.welcomePoint2, t.home.welcomePoint3];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pb-8 pt-10">
      <header className="flex flex-col gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={56}
          height={56}
          priority
          className="h-14 w-14 rounded-2xl border border-line bg-card object-contain p-1"
        />
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-ink">{t.guest.welcomeTitle}</h1>
        <p className="text-base text-ink-soft">{t.guest.welcomeSubtitle}</p>
      </header>

      <ul className="flex flex-col gap-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-base font-medium text-ink">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* The cost of guest mode is shown in full, above the button that starts it. */}
      <section aria-labelledby="guest-risk" className="rounded-2xl border border-line bg-card p-4">
        <h2 id="guest-risk" className="flex items-center gap-2 text-sm font-bold text-accent-strong">
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{t.guest.riskCardTitle}</span>
        </h2>
        <p className="mt-2 text-sm text-ink">{t.guest.riskCardDesc}</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-soft">
          {t.guest.riskPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <form action={continueAsGuest}>
          <input type="hidden" name="next" value={next ?? "/"} />
          <GuestButton label={t.home.tryAsGuest} />
        </form>
        <button
          type="button"
          onClick={() => onOpenAuth("signup")}
          className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-base font-semibold text-ink hover:bg-paper active:bg-line"
        >
          {t.guest.signInOrRegisterBtn}
        </button>
      </div>
    </main>
  );
}
