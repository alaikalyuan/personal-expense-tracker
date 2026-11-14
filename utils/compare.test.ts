import { describe, expect, it } from "vitest";
import { compareWeeks } from "@/utils/compare";

describe("compareWeeks", () => {
  it("uses the same day window for the headline and the daily averages", () => {
    // Audit A002-15: 5 days in, 63.500 this week against 74.700 over last week's first 5 days.
    const c = compareWeeks(63500, 74700, 5);
    expect(c.direction).toBe("less");
    expect(c.percentDiff).toBe(-15);
    expect(c.thisDailyAvg).toBe(12700);
    expect(c.lastDailyAvg).toBe(14940);
    // The pace card can no longer say "more per day" while the headline says "less".
    expect(c.thisDailyAvg < c.lastDailyAvg).toBe(true);
    expect(c.dailyAvgGap).toBe(2240);
  });

  it("has no baseline when last week had nothing over the same days", () => {
    const c = compareWeeks(12000, 0, 3);
    expect(c.hasBaseline).toBe(false);
    expect(c.percentDiff).toBeNull();
  });

  it("has no baseline when both weeks are empty", () => {
    const c = compareWeeks(0, 0, 4);
    expect(c.hasBaseline).toBe(false);
    expect(c.direction).toBe("even");
    expect(c.dailyAvgGap).toBe(0);
  });

  it("reports an even week", () => {
    const c = compareWeeks(50000, 50000, 7);
    expect(c.direction).toBe("even");
    expect(c.percentDiff).toBe(0);
  });

  it("clamps the window to one to seven days", () => {
    expect(compareWeeks(7000, 7000, 0).days).toBe(1);
    expect(compareWeeks(7000, 7000, 9).days).toBe(7);
  });
});
