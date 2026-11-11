"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/utils/i18n/context";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-start justify-center gap-4 px-6 pb-28">
      <h1 className="text-2xl font-bold text-ink">{t.home.errorTitle}</h1>
      <p className="text-base text-ink-soft">{t.home.errorBody}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent hover:brightness-95 active:brightness-90"
        >
          {t.home.retry}
        </button>
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-xl border border-line bg-card px-5 text-sm font-semibold text-ink hover:bg-paper active:bg-line"
        >
          {t.home.backHome}
        </Link>
      </div>
    </main>
  );
}
