// 날짜를 한국어 형식으로 표시
export const formatDateDisplay = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];
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
