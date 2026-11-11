import Link from "next/link";
import { getDictionaryServer } from "@/utils/i18n/server";

export default async function NotFound() {
  const { t } = await getDictionaryServer();

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-start justify-center gap-4 px-6 pb-28">
      <h1 className="text-2xl font-bold text-ink">{t.home.notFoundTitle}</h1>
      <p className="text-base text-ink-soft">{t.home.notFoundBody}</p>
      <Link
        href="/"
        className="flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-on-accent hover:brightness-95 active:brightness-90"
      >
        {t.home.backHome}
      </Link>
    </main>
  );
}
