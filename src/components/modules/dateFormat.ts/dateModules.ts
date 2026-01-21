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
