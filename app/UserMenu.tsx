"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import {
  MoreVertical,
  Archive,
  Wallet,
  ArrowLeftRight,
  LogOut,
  Languages,
  Sun,
  Moon,
} from "lucide-react";
import { useTranslation } from "@/utils/i18n/context";
import { useTheme } from "@/utils/theme/context";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { locale, setLocale, t } = useTranslation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isArchive = pathname.startsWith("/archive");
  const isTracker = pathname === "/";
  const isCompare = pathname.startsWith("/compare");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.nav.openMenu}
        aria-expanded={isOpen}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-2xl shadow-zinc-950/10 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/80 animate-modal-in"
        >
          {/* Menu Items */}
          <div className="flex flex-col gap-0.5">
            {!isTracker && (
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>{t.nav.tracker}</span>
              </Link>
            )}

            {!isArchive && (
              <Link
                href="/archive"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
              >
                <Archive className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>{t.nav.archive}</span>
              </Link>
            )}

            {!isCompare && (
              <Link
                href="/compare"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>{t.nav.compare}</span>
              </Link>
            )}

            <div className="my-1 border-t border-zinc-200/80 dark:border-zinc-800/80" />

            {/* Language Selector */}
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <Languages className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-[11px]">{t.nav.language}</span>
              </span>
              <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-950 p-0.5 border border-zinc-200 dark:border-zinc-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setLocale("id")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    locale === "id"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    locale === "en"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                {theme === "dark" ? (
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="text-[11px]">{t.nav.theme}</span>
              </span>
              <div className="flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-950 p-0.5 border border-zinc-200 dark:border-zinc-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Sun className="w-2.5 h-2.5" />
                  {t.nav.light}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Moon className="w-2.5 h-2.5" />
                  {t.nav.dark}
                </button>
              </div>
            </div>

            <div className="my-1 border-t border-zinc-200/80 dark:border-zinc-800/80" />

            {/* Logout Action */}
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-300 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.signOut}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

