import { cookies } from "next/headers";
import { Theme } from "./context";

export async function getThemeServer(): Promise<Theme> {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("THEME")?.value;
  if (themeCookie === "light" || themeCookie === "dark") {
    return themeCookie;
  }
  return "dark";
}

