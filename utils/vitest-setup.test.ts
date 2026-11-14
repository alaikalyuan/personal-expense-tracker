import { describe, expect, it } from "vitest";
import { calculateSplitBreakdown } from "@/utils/splitCalculator";

describe("test setup", () => {
  it("resolves the @ alias", () => {
    expect(typeof calculateSplitBreakdown).toBe("function");
  });
});
