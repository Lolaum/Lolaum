import {
  addDaysToDateKey,
  formatKoreaDateKey,
  getDateKeyDayOfWeek,
} from "@/lib/korea-date";

export interface WeeklyRoutineProgressResult {
  completedDays: number;
  weekdayMissed: number;
}

function getWeekKey(dateKey: string): string {
  const dow = getDateKeyDayOfWeek(dateKey); // 0=일, 1=월, ..., 6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDaysToDateKey(dateKey, diff);
}

/**
 * Shared routine progress accounting.
 *
 * - Weekdays before the weekend are counted by same-day full completion:
 *   every registered routine must be certified on that date.
 * - Once the weekend is in range, weekend certifications can make up missed
 *   weekday certifications in the same week. The final weekly count is limited
 *   by the least-completed registered routine, capped at the weekday target.
 * - Duplicate records for the same routine/date are already collapsed by the
 *   Set in dateMap and therefore count once.
 */
export function calculateWeeklyRoutineProgress(input: {
  dateMap: Map<string, Set<string>>;
  registeredTypes: Set<string>;
  rangeStart: string;
  rangeEnd: string;
  today?: string;
}): WeeklyRoutineProgressResult {
  if (input.registeredTypes.size === 0 || input.rangeEnd < input.rangeStart) {
    return { completedDays: 0, weekdayMissed: 0 };
  }

  const today = input.today ?? formatKoreaDateKey();
  const weekData = new Map<
    string,
    { weekdays: string[]; weekends: string[] }
  >();

  for (
    let dateStr = input.rangeStart;
    dateStr <= input.rangeEnd;
    dateStr = addDaysToDateKey(dateStr, 1)
  ) {
    const dow = getDateKeyDayOfWeek(dateStr);
    const wk = getWeekKey(dateStr);
    if (!weekData.has(wk)) {
      weekData.set(wk, { weekdays: [], weekends: [] });
    }
    if (dow === 0 || dow === 6) {
      weekData.get(wk)!.weekends.push(dateStr);
    } else {
      weekData.get(wk)!.weekdays.push(dateStr);
    }
  }

  let completedDays = 0;
  let weekdayMissed = 0;

  for (const { weekdays, weekends } of weekData.values()) {
    const pastWeekdayTarget = weekdays.filter((wd) => wd < today).length;
    const maxWeekdayTarget = weekdays.length;
    const hasWeekendMakeupWindow = weekends.some(
      (weekendDate) => weekendDate <= input.rangeEnd,
    );
    let weekdayFullCompletions = 0;

    for (const weekday of weekdays) {
      const completedTypes = input.dateMap.get(weekday);
      const isFullyCompleteWeekday = Array.from(input.registeredTypes).every(
        (routineType) => completedTypes?.has(routineType),
      );
      if (isFullyCompleteWeekday) {
        weekdayFullCompletions++;
      }
    }

    let minRoutineCompletions = maxWeekdayTarget;
    for (const routineType of input.registeredTypes) {
      let routineCompletions = 0;
      for (const date of [...weekdays, ...weekends]) {
        if (input.dateMap.get(date)?.has(routineType)) {
          routineCompletions++;
        }
      }
      minRoutineCompletions = Math.min(
        minRoutineCompletions,
        routineCompletions,
      );
    }

    const completedInWeek = hasWeekendMakeupWindow
      ? Math.min(minRoutineCompletions, maxWeekdayTarget)
      : weekdayFullCompletions;

    completedDays += completedInWeek;
    weekdayMissed += Math.max(0, pastWeekdayTarget - completedInWeek);
  }

  return { completedDays, weekdayMissed };
}
