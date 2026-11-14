import { describe, expect, it } from "vitest";
import { weekCounts, weekSurplus, type WeekSpend } from "@/utils/surplus";

/** The same filter-then-sum the savings page does. */
function summariseSurplus(weeks: WeekSpend[], budget: number | null, firstWeek: string | null) {
  const counted = weeks.filter((w) => weekCounts(w.weekStartStr, firstWeek)).map((w) => weekSurplus(w, budget));
  return { weeks: counted, total: counted.reduce((sum, w) => sum + w.surplus, 0) };
}

describe("weekSurplus", () => {
  it("is the budget minus regular spending when under budget", () => {
    expect(weekSurplus({ weekStartStr: "2026-11-02", regularSpend: 65000 }, 300000)).toMatchObject({
      isSurplus: true,
      surplus: 235000,
      deficit: 0,
    });
  });
  it("records a deficit, never a negative surplus", () => {
    expect(weekSurplus({ weekStartStr: "2026-11-02", regularSpend: 350000 }, 300000)).toMatchObject({
      isSurplus: false,
      surplus: 0,
      deficit: 50000,
    });
  });
  it("produces nothing without a budget", () => {
    expect(weekSurplus({ weekStartStr: "2026-11-02", regularSpend: 0 }, null)).toMatchObject({
      isSurplus: false,
      surplus: 0,
      deficit: 0,
    });
  });
});

describe("summariseSurplus", () => {
  const weeks = [
    { weekStartStr: "2026-10-19", regularSpend: 40000 },
    { weekStartStr: "2026-10-26", regularSpend: 25000 },
    { weekStartStr: "2026-11-02", regularSpend: 100000 },
  ];

  it("excludes weeks before the account started (audit A002-16)", () => {
    // Account created on Wed 4 Nov 2026: its week starts Mon 2 Nov.
    const { weeks: counted, total } = summariseSurplus(weeks, 250000, "2026-11-02");
    expect(counted.map((w) => w.weekStartStr)).toEqual(["2026-11-02"]);
    expect(total).toBe(150000);
  });

  it("counts every week when the start is unknown", () => {
    expect(summariseSurplus(weeks, 250000, null).total).toBe(210000 + 225000 + 150000);
  });

  it("is zero without a budget", () => {
    expect(summariseSurplus(weeks, null, "2026-10-19").total).toBe(0);
  });

  it("includes the week the account was created in", () => {
    expect(weekCounts("2026-11-02", "2026-11-02")).toBe(true);
    expect(weekCounts("2026-10-26", "2026-11-02")).toBe(false);
  });
});
