import { cookies } from "next/headers";
import { Theme } from "./context";
import { isPaletteChoice, type PaletteChoice } from "./palette";

export async function getThemeServer(): Promise<Theme> {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("THEME")?.value;
  if (themeCookie === "light" || themeCookie === "dark") {
    return themeCookie;
  }
  return "light";
}

export async function getPaletteServer(): Promise<PaletteChoice> {
  const cookieStore = await cookies();
  const value = cookieStore.get("PALETTE")?.value;
  return isPaletteChoice(value) ? value : "orange";
}
