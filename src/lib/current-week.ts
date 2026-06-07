import { addDaysToDateKey, formatKoreaDateKey, getDateKeyDayOfWeek } from "@/lib/korea-date";

export function getCurrentKoreaWeekRange(today = formatKoreaDateKey()): {
  start: string;
  end: string;
} {
  const dayOfWeek = getDateKeyDayOfWeek(today); // 0=Sun, 1=Mon ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const start = addDaysToDateKey(today, mondayOffset);
  return { start, end: addDaysToDateKey(start, 6) };
}

export function isDateInCurrentKoreaWeek(dateKey: string, today?: string): boolean {
  const { start, end } = getCurrentKoreaWeekRange(today);
  return dateKey >= start && dateKey <= end;
}
