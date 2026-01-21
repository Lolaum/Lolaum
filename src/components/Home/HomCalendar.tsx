import React from "react";

// 요일 배열
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 현재 날짜 기준 주간 날짜 생성
function getWeekDates(date: Date) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(current);
    d.setDate(diff + i);
    return d;
  });
}

// 현재 월의 모든 날짜 생성
function getMonthDates(date: Date) {
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
}

interface HomCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function HomCalendar({
  selectedDate,
  onSelectDate,
}: HomCalendarProps) {
  const today = new Date();
  const weekDates = getWeekDates(today);
  const monthDates = getMonthDates(today);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="rounded-lg border p-4">
      {/* 헤더: 현재 월 표시 */}
      <h2 className="mb-4 text-lg font-semibold">
        {today.getFullYear()}년 {today.getMonth() + 1}월
      </h2>

      {/* 모바일: 주간 캘린더 */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
          {weekDates.map((date, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`flex h-10 items-center justify-center rounded-full text-sm transition-colors ${
                isSelected(date)
                  ? "bg-gray-900 font-bold text-white"
                  : isToday(date)
                    ? "border-2 border-gray-900 font-bold"
                    : "hover:bg-gray-100"
              }`}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* 태블릿/데스크톱: 월간 캘린더 */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
          {monthDates.map((date, index) =>
            date === null ? (
              <div key={index} className="h-10" />
            ) : (
              <button
                key={index}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`flex h-10 items-center justify-center rounded-full text-sm transition-colors ${
                  isSelected(date)
                    ? "bg-gray-900 font-bold text-white"
                    : isToday(date)
                      ? "border-2 border-gray-900 font-bold"
                      : "hover:bg-gray-100"
                }`}
              >
                {date.getDate()}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
