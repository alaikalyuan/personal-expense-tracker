import { describe, expect, it } from "vitest";
import { format, subDays } from "date-fns";
import { calculateStreak } from "./streak";
import {
  STREAK_WINDOW_ROW_LIMIT,
  streakNeedsFullHistory,
  streakWindowStart,
} from "./streakWindow";

const now = new Date(2026, 10, 14, 10, 0, 0);
const day = (n: number) => format(subDays(now, n), "yyyy-MM-dd");
const days = (from: number, to: number) => {
  const out: string[] = [];
  for (let i = from; i <= to; i++) out.push(day(i));
  return out;
};

function check(dates: string[]) {
  const windowStart = streakWindowStart(now);
  const inWindow = dates.filter((d) => d >= windowStart);
  const streak = calculateStreak(inWindow, now).currentStreak;
  return { streak, needsFull: streakNeedsFullHistory(inWindow, windowStart, streak, now) };
}

describe("streakNeedsFullHistory", () => {
  it("stays in the window for no streak", () => {
    expect(check([day(5), day(9)])).toEqual({ streak: 0, needsFull: false });
  });

  it("stays in the window for a short streak", () => {
    expect(check(days(0, 9))).toEqual({ streak: 10, needsFull: false });
  });

  it("stays in the window for a streak ending yesterday", () => {
    expect(check(days(1, 30))).toEqual({ streak: 30, needsFull: false });
  });

  it("widens when the streak reaches the window start", () => {
    const res = check(days(0, 400));
    expect(res.needsFull).toBe(true);
    expect(calculateStreak(days(0, 400), now).currentStreak).toBe(401);
  });

  it("widens when the row limit cut the window short", () => {
    // Many rows per day: the limit is hit after 50 days.
    const rows: string[] = [];
    for (let i = 0; i < 50; i++) for (let j = 0; j < STREAK_WINDOW_ROW_LIMIT / 50; j++) rows.push(day(i));
    const streak = calculateStreak(rows, now).currentStreak;
    expect(streak).toBe(50);
    expect(streakNeedsFullHistory(rows, streakWindowStart(now), streak, now)).toBe(true);
  });

  it("does not widen when the row limit was hit but the streak ended inside it", () => {
    const rows: string[] = [];
    for (let i = 0; i < 5; i++) rows.push(day(i));
    for (let i = 7; i < 50; i++) for (let j = 0; j < 30; j++) rows.push(day(i));
    const limited = rows.slice(0, STREAK_WINDOW_ROW_LIMIT);
    const streak = calculateStreak(limited, now).currentStreak;
    expect(streak).toBe(5);
    expect(streakNeedsFullHistory(limited, streakWindowStart(now), streak, now)).toBe(false);
  });
});
