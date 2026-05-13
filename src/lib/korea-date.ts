export const KOREA_TIME_ZONE = "Asia/Seoul";

export function formatKoreaDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateKeyUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKeyUTC(date);
}

export function getDateKeyDayOfWeek(dateKey: string): number {
  return parseDateKey(dateKey).getUTCDay();
}

export function countWeekdaysInDateKeyRange(
  startDate: string,
  endDate: string,
): number {
  let count = 0;
  for (
    let current = startDate;
    current <= endDate;
    current = addDaysToDateKey(current, 1)
  ) {
    const dayOfWeek = getDateKeyDayOfWeek(current);
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
  }
  return count;
}

export function getKoreaTodayWithinRange(endDate: string): string {
  const today = formatKoreaDateKey();
  return today < endDate ? today : endDate;
}

