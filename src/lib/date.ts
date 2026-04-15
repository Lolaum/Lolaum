import { DAYS } from "@/lib/constants";

/** 한국 시간(KST) 기준 오늘 날짜를 YYYY-MM-DD로 반환 */
export const getKoreanToday = (): string => {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
};

/** 한국 시간(KST) 기준 현재 시각의 Date 객체 반환 (로컬 타임존 무관) */
export const getKoreanNow = (): Date => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 3600000); // KST = UTC+9
};

/** Date 객체를 YYYY-MM-DD 문자열로 변환 (UTC 변환 없이 로컬 기준) */
export const toDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 현재 월의 모든 날짜 생성
export const getMonthDates = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const dates: (Date | null)[] = [];

  // 첫 주의 빈 칸 채우기
  for (let i = 0; i < firstDay.getDay(); i++) {
    dates.push(null);
  }

  // 날짜 채우기
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }

  return dates;
};

// 날짜를 한국어 형식으로 표시
export const formatDateDisplay = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = DAYS[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
};

// 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 타임존 기준)
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 주간 범위(월~일) 텍스트 반환
export const getWeekRangeText = (date: Date) => {
  const day = date.getDay(); // 0(일)~6(토)
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const format = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${format(monday)} - ${format(sunday)}`;
};
