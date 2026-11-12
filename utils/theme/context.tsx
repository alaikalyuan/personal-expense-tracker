"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { PAPER, resolvePalette, type Palette, type PaletteChoice } from "./palette";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  palette: PaletteChoice;
  /** The palette on screen right now; differs from `palette` only for hybrid. */
  activePalette: Palette;
  setPalette: (palette: PaletteChoice) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const YEAR = 31536000;

function applyToDocument(theme: Theme, palette: Palette) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  if (palette === "orange") root.removeAttribute("data-palette");
  else root.setAttribute("data-palette", palette);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", PAPER[palette][theme]);
}

export function ThemeProvider({
  children,
  initialTheme = "light",
  initialPalette = "orange",
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
  initialPalette?: PaletteChoice;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [palette, setPaletteState] = useState<PaletteChoice>(initialPalette);
  // The server cannot know the visitor's clock, so hybrid starts from a guess
  // and is corrected in the effect below (the head script already painted it right).
  const [activePalette, setActivePalette] = useState<Palette>(
    initialPalette === "hybrid" ? "orange" : initialPalette
  );

  useEffect(() => {
    const update = () => setActivePalette(resolvePalette(palette));
    update();
    if (palette !== "hybrid") return;
    // Check once a minute so the colors change on the hour while the app is open.
    const id = window.setInterval(update, 60_000);
    const onVisible = () => document.visibilityState === "visible" && update();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [palette]);

  useEffect(() => {
    try {
      applyToDocument(theme, activePalette);
    } catch {
      // Ignore DOM errors in restricted environments
    }
  }, [theme, activePalette]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      document.cookie = `THEME=${newTheme}; path=/; max-age=${YEAR}; SameSite=Lax`;
      localStorage.setItem("theme", newTheme);
    } catch {
      // Ignore storage/cookie errors in restricted environments
    }
  };

  const setPalette = (next: PaletteChoice) => {
    setPaletteState(next);
    setActivePalette(resolvePalette(next));
    try {
      document.cookie = `PALETTE=${next}; path=/; max-age=${YEAR}; SameSite=Lax`;
    } catch {
      // Ignore cookie errors in restricted environments
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, palette, activePalette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
