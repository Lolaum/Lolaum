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
 * - Within each Monday-Sunday week, certifications are pooled by routine type.
 *   The weekly result is the least-completed routine count, capped at the
 *   weekday target. For example, with five registered routines, Mon 1/2/3 +
 *   Tue 4/5 + Wed 1/2/3/4/5 counts as two completed days.
 * - Missed weekdays for happy chance/donation accounting use the same pooled
 *   weekly result, so the example above leaves one missed weekday.
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

    const completedInWeek = Math.min(minRoutineCompletions, maxWeekdayTarget);

    completedDays += completedInWeek;
    weekdayMissed += Math.max(0, pastWeekdayTarget - completedInWeek);
  }

  return { completedDays, weekdayMissed };
}
