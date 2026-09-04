import { login, signup } from "@/app/actions";
import { getDictionaryServer } from "@/utils/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getDictionaryServer();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h1 className="text-xl font-bold tracking-tight">{t.login.title}</h1>
        <p className="text-sm text-zinc-400 mt-1 mb-6">{t.login.subtitle}</p>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-md">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder={t.login.emailPlaceholder}
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-100"
          />
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 text-zinc-100"
          />
          <div className="flex gap-2 pt-2">
            <button
              formAction={login}
              className="flex-1 rounded-lg bg-zinc-100 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 cursor-pointer"
            >
              {t.login.logIn}
            </button>
            <button
              formAction={signup}
              className="flex-1 rounded-lg border border-zinc-800 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
            >
              {t.login.signUp}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}