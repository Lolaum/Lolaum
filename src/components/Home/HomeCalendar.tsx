"use client";

import { useState } from "react";
import { getMonthDates } from "@/modules/Common/dateModules";
import { DAYS } from "@/constants/constant";

interface HomCalendarProps {
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

export default function HomCalendar({
  today,
  selectedDate,
  onSelectDate,
  currentMonth: propCurrentMonth,
  onMonthChange,
}: HomCalendarProps) {
  const [internalMonth, setInternalMonth] = useState(propCurrentMonth || today);
  const currentMonth = propCurrentMonth || internalMonth;

  const monthDates = getMonthDates(currentMonth);

  // 주간 날짜 계산 (선택된 날짜 기준)
  const getWeekDates = (date: Date) => {
    const week: Date[] = [];
    const day = date.getDay(); // 0(일) ~ 6(토)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return false;
    return date.getMonth() === currentMonth.getMonth();
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-md p-6">
      {/* 헤더: 현재 월 표시와 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="이전 달"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="다음 달"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 주간 캘린더 (xs only) */}
      <div className="block sm:hidden sticky top-0 bg-white z-10 pb-4 -mx-6 px-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`flex h-12 items-center justify-center rounded-full text-base font-semibold transition-colors ${
                isSelected(date)
                  ? "bg-yellow-400 text-gray-900"
                  : isToday(date)
                    ? "bg-gray-100 text-gray-900"
                    : isCurrentMonth(date)
                      ? "text-gray-900 hover:bg-gray-50"
                      : "text-gray-300 hover:bg-gray-50"
              }`}
            >
              {date.getDate()}
            </button>
          ))}
        </div>
      </div>

      {/* 월간 캘린더 (sm and above) */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {monthDates.map((date, index) =>
            date === null ? (
              <div key={index} className="h-12" />
            ) : (
              <button
                key={date.toISOString()}
                onClick={() => onSelectDate(date)}
                className={`
                  aspect-square p-2 rounded-lg transition-all relative focus:outline-none focus:ring-2 focus:ring-yellow-400/30
                  ${!isCurrentMonth(date) ? "text-gray-300" : "text-gray-700"}
                  ${
                    isSelected(date)
                      ? "bg-yellow-400/15 text-yellow-500 font-semibold"
                      : "hover:bg-gray-100/80"
                  }
                  ${
                    isToday(date) && !isSelected(date)
                      ? "bg-gray-100/80 font-medium"
                      : ""
                  }
                `}
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
