import { DAYS } from "@/constants/constant";

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

// 날짜를 YYYY-MM-DD 형식으로 변환
export const formatDateKey = (date: Date): string =>
  date.toISOString().split("T")[0];

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
