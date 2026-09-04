import { login, signup } from "@/app/actions";
import { getDictionaryServer } from "@/utils/i18n/server";
import GoogleSignInButton from "./GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getDictionaryServer();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.login.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-6">{t.login.subtitle}</p>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
            {error}
          </div>
        )}

        <GoogleSignInButton label={t.login.googleSignIn} />

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500 font-medium">
              {t.login.or}
            </span>
          </div>
        </div>

        <form className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder={t.login.emailPlaceholder}
            required
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <div className="flex gap-2 pt-2">
            <button
              formAction={login}
              className="flex-1 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 py-2.5 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              {t.login.logIn}
            </button>
            <button
              formAction={signup}
              className="flex-1 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 py-2.5 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              {t.login.signUp}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}