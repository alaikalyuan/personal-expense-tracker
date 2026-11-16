import type { Metadata } from "next";
import { getDictionaryServer } from "./server";
import type { Dictionary } from "./dictionaries";

/** Page title in the visitor's language; the root layout adds " · SakuTrack". */
export function pageMetadata(key: keyof Dictionary["pageTitles"]) {
  return async function generateMetadata(): Promise<Metadata> {
    const { t } = await getDictionaryServer();
    return { title: t.pageTitles[key] };
  };
}
