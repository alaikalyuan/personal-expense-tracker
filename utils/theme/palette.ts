// Color palettes. "orange" is the original Warung look and needs no overrides;
// the others swap the paper, ink and accent tokens in globals.css through the
// data-palette attribute on <html>. "hybrid" picks one by the local hour.

export const PALETTES = ["orange", "pink", "blue", "mono"] as const;
export type Palette = (typeof PALETTES)[number];
export type PaletteChoice = Palette | "hybrid";

export const PALETTE_CHOICES: PaletteChoice[] = [...PALETTES, "hybrid"];

export function isPaletteChoice(value: unknown): value is PaletteChoice {
  return typeof value === "string" && (PALETTE_CHOICES as string[]).includes(value);
}

// Morning sun, midday sky, dusk, night. Start hours, local time.
export const HYBRID_SCHEDULE: { from: number; palette: Palette }[] = [
  { from: 5, palette: "orange" },
  { from: 11, palette: "blue" },
  { from: 15, palette: "pink" },
  { from: 19, palette: "mono" },
];

export function paletteForHour(hour: number): Palette {
  let current: Palette = "mono";
  for (const slot of HYBRID_SCHEDULE) {
    if (hour >= slot.from) current = slot.palette;
  }
  return current;
}

export function resolvePalette(choice: PaletteChoice, date = new Date()): Palette {
  return choice === "hybrid" ? paletteForHour(date.getHours()) : choice;
}

// Paper color per palette, used for the browser and status bar color.
export const PAPER: Record<Palette, { light: string; dark: string }> = {
  orange: { light: "#fff8ec", dark: "#1a130d" },
  pink: { light: "#fff5f7", dark: "#1b1015" },
  blue: { light: "#f3f7fc", dark: "#0d1421" },
  mono: { light: "#f6f6f4", dark: "#121212" },
};

// Runs in <head> before first paint so the page never flashes the wrong colors.
// Kept in sync with HYBRID_SCHEDULE by building it from the same data.
export const THEME_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var m=function(n){var c=document.cookie.match(new RegExp('(?:^|;\\\\s*)'+n+'=([^;]+)'));return c?c[1]:null};var t=m('THEME')||localStorage.getItem('theme')||'light';d.classList.toggle('dark',t==='dark');d.style.colorScheme=t==='dark'?'dark':'light';var p=m('PALETTE')||'orange';if(p==='hybrid'){var h=new Date().getHours(),s=${JSON.stringify(
  HYBRID_SCHEDULE.map((s) => [s.from, s.palette])
)};p='mono';for(var i=0;i<s.length;i++){if(h>=s[i][0])p=s[i][1];}}if(p==='orange'){d.removeAttribute('data-palette')}else{d.setAttribute('data-palette',p)}}catch(e){}})();`;
