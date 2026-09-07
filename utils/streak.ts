import { addDays, format, isAfter, isSameDay, startOfWeek, subDays } from "date-fns";

export interface DayStatus {
  dateStr: string;
  dayLabel: string; // e.g. "S", "M", etc.
  dayName: string; // e.g. "Senin", "Monday"
  isLogged: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface StreakData {
  currentStreak: number;
  hasLoggedToday: boolean;
  daysLoggedThisWeek: number;
  totalDaysThisWeekSoFar: number;
  weekDaysStatus: DayStatus[];
}

/**
 * Calculates user's logging streak and week consistency.
 *
 * @param spentDates Array of date strings (e.g. '2026-09-07' or ISO format) from all user expenses.
 * @param now Current date in user's timezone.
 * @param locale 'id' | 'en'
 */
export function calculateStreak(
  spentDates: string[],
  now: Date,
  locale: "id" | "en" = "id"
): StreakData {
  // Normalize dates to 'YYYY-MM-DD'
  const dateSet = new Set<string>();
  spentDates.forEach((dateStr) => {
    if (!dateStr) return;
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.trim();
    if (cleanDate) {
      dateSet.add(cleanDate);
    }
  });

  const todayStr = format(now, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");

  const hasLoggedToday = dateSet.has(todayStr);

  // Consecutive days calculation
  let streak = 0;
  if (hasLoggedToday) {
    // Count today + backwards
    let checkDate = now;
    while (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
  } else if (dateSet.has(yesterdayStr)) {
    // Count from yesterday backwards (streak is active, just pending today)
    let checkDate = subDays(now, 1);
    while (dateSet.has(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
  } else {
    streak = 0;
  }

  // Monday-Sunday of current week
  const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
  const dayLabelsId = ["S", "S", "R", "K", "J", "S", "M"]; // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu
  const dayLabelsEn = ["M", "T", "W", "T", "F", "S", "S"]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const labels = locale === "id" ? dayLabelsId : dayLabelsEn;

  const dayNamesId = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const dayNamesEn = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const names = locale === "id" ? dayNamesId : dayNamesEn;

  let daysLoggedThisWeek = 0;
  let totalDaysThisWeekSoFar = 0;

  const weekDaysStatus: DayStatus[] = Array.from({ length: 7 }, (_, i) => {
    const dayDate = addDays(startOfWeekDate, i);
    const dateStr = format(dayDate, "yyyy-MM-dd");
    const isLogged = dateSet.has(dateStr);
    const isToday = isSameDay(dayDate, now);
    const isFuture = isAfter(dayDate, now);

    if (!isFuture) {
      totalDaysThisWeekSoFar++;
      if (isLogged) {
        daysLoggedThisWeek++;
      }
    }

    return {
      dateStr,
      dayLabel: labels[i],
      dayName: names[i],
      isLogged,
      isToday,
      isFuture,
    };
  });

  return {
    currentStreak: streak,
    hasLoggedToday,
    daysLoggedThisWeek,
    totalDaysThisWeekSoFar,
    weekDaysStatus,
  };
}
