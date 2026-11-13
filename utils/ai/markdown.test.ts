import { describe, expect, it } from "vitest";
import { preprocessAiMarkdown } from "@/utils/ai/markdown";

const TABLE = [
  "| Periode | Anggaran | Terpakai |",
  "|---|---|---|",
  "| Mingguan | Rp 300.000 | Rp 120.000 |",
  "| Bulanan | Rp 1.200.000 | Rp 500.000 |",
].join("\n");

describe("preprocessAiMarkdown", () => {
  it("leaves a well-formed table untouched", () => {
    const md = `Berikut ringkasannya:\n\n${TABLE}\n\nSemoga membantu.`;
    expect(preprocessAiMarkdown(md)).toBe(md);
  });

  it("keeps aligned separator rows intact", () => {
    const md = "| Kategori | Total |\n| :--- | ---: |\n| Makanan | 50.000 |";
    expect(preprocessAiMarkdown(md)).toBe(md);
  });

  it("adds a blank line between prose and a table", () => {
    const md = `Ringkasan:\n${TABLE}`;
    expect(preprocessAiMarkdown(md)).toBe(`Ringkasan:\n\n${TABLE}`);
  });

  it("splits a table that starts on the same line as prose", () => {
    const md = "Ringkasan: | Periode | Anggaran |\n|---|---|\n| Mingguan | Rp 300.000 |";
    const out = preprocessAiMarkdown(md);
    expect(out.startsWith("Ringkasan:\n\n| Periode | Anggaran |")).toBe(true);
  });

  it("splits rows that were concatenated onto one line", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 || 3 | 4 |";
    expect(preprocessAiMarkdown(md)).toBe("| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |");
  });

  it("does not join rows that end with trailing spaces", () => {
    const md = "| A | B | \n|---|---|\n| 1 | 2 | ";
    expect(preprocessAiMarkdown(md)).toBe(md);
  });

  it("rejoins a header row split across two lines", () => {
    expect(preprocessAiMarkdown("| Periode\n| Anggaran |")).toBe("| Periode | Anggaran |");
  });

  it("normalises unicode bullets", () => {
    expect(preprocessAiMarkdown("• satu\n• dua")).toBe("- satu\n- dua");
  });
});
