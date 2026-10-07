export interface FinanceQuote {
  id: number;
  textId: string;
  textEn: string;
  author: string;
}

export const FINANCE_QUOTES: FinanceQuote[] = [
  {
    id: 1,
    textId: "Hemat bukan berarti pelit, tapi bijak mengatur masa depan.",
    textEn: "Being frugal doesn't mean being cheap, it means being wise with your future.",
    author: "SakuTrack",
  },
  {
    id: 2,
    textId: "Anggaran bukanlah pembatas kebebasan, melainkan peta menuju kemerdekaan finansial.",
    textEn: "A budget is not a restraint on freedom, but a map to financial independence.",
    author: "Dave Ramsey",
  },
  {
    id: 3,
    textId: "Catat Rp 1.000 hari ini, selamatkan jutaan rupiah di masa depan.",
    textEn: "Record a single dollar today, safeguard thousands tomorrow.",
    author: "SakuTrack",
  },
  {
    id: 4,
    textId: "Kebocoran kecil bisa menenggelamkan kapal besar. Perhatikan jajan-jajan kecilmu!",
    textEn: "Beware of little expenses. A small leak will sink a great ship.",
    author: "Benjamin Franklin",
  },
  {
    id: 5,
    textId: "Jangan simpan apa yang tersisa setelah dibelanjakan; belanjakan apa yang tersisa setelah ditabung.",
    textEn: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
  },
  {
    id: 6,
    textId: "Konsistensi mencatat pengeluaran adalah langkah awal hidup tenang tanpa cemas tanggal tua.",
    textEn: "Consistency in tracking spending brings financial peace of mind before payday.",
    author: "SakuTrack",
  },
  {
    id: 7,
    textId: "Kekayaan sejati diukur dari seberapa banyak kebebasan yang bisa kamu beli dengan uangmu.",
    textEn: "Real wealth is the ability to fully experience life and freedom.",
    author: "Henry David Thoreau",
  },
  {
    id: 8,
    textId: "Uang adalah pelayan yang baik, tapi majikan yang buruk. Kendalikan dia dengan catatanmu.",
    textEn: "Money is a terrible master but an excellent servant.",
    author: "P.T. Barnum",
  },
  {
    id: 9,
    textId: "Satu catatan kecil setiap malam menjaga dompetmu tetap sehat sepanjang semester.",
    textEn: "One quick entry every night keeps your student budget healthy all semester.",
    author: "SakuTrack",
  },
  {
    id: 10,
    textId: "Bukan berapa banyak yang kamu hasilkan, tapi berapa banyak yang berhasil kamu pertahankan.",
    textEn: "It's not how much money you make, but how much money you keep.",
    author: "Robert Kiyosaki",
  },
];

export function getDailyQuote(locale: "id" | "en" = "id"): { quote: string; author: string } {
  // Use day of year to deterministically rotate quotes
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const selected = FINANCE_QUOTES[dayOfYear % FINANCE_QUOTES.length];
  return {
    quote: locale === "en" ? selected.textEn : selected.textId,
    author: selected.author,
  };
}

export function getRandomQuote(locale: "id" | "en" = "id"): { quote: string; author: string } {
  const index = Math.floor(Math.random() * FINANCE_QUOTES.length);
  const selected = FINANCE_QUOTES[index];
  return {
    quote: locale === "en" ? selected.textEn : selected.textId,
    author: selected.author,
  };
}
