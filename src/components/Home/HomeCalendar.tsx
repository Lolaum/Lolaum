"use client";

import { useState } from "react";
import { getMonthDates, formatDateKey } from "@/lib/date";
import { DAYS } from "@/lib/constants";
import type { CalendarDayMarker } from "@/api/ritual-stats";

interface HomCalendarProps {
  today: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
  markers?: Record<string, CalendarDayMarker>;
}

export default function HomCalendar({
  today,
  selectedDate,
  onSelectDate,
  currentMonth: propCurrentMonth,
  onMonthChange,
  markers = {},
}: HomCalendarProps) {
  const [internalMonth, setInternalMonth] = useState(propCurrentMonth || today);
  const currentMonth = propCurrentMonth || internalMonth;

  const monthDates = getMonthDates(currentMonth);

  // 주간 날짜 계산 (선택된 날짜 기준)
  const getWeekDates = (date: Date) => {
    const week: Date[] = [];
    const day = date.getDay();
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

  const hasRoutine = (date: Date | null) => {
    if (!date) return false;
    const marker = markers[formatDateKey(date)];
    return marker?.hasRoutine ?? false;
  };

  const hasTodo = (date: Date | null) => {
    if (!date) return false;
    const marker = markers[formatDateKey(date)];
    return marker?.hasTodo ?? false;
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    if (onMonthChange) onMonthChange(newMonth);
    else setInternalMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    if (onMonthChange) onMonthChange(newMonth);
    else setInternalMonth(newMonth);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    onSelectDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    onSelectDate(newDate);
  };

  /**
   * 연속 루틴 배경을 위한 border-radius 계산
   * dates: 7칸 배열 (Date | null), index: 현재 위치
   */
  const getStreakRadius = (dates: (Date | null)[], index: number) => {
    const curr = hasRoutine(dates[index]);
    if (!curr) return "";

    const prevInRow = index % 7 !== 0 && hasRoutine(dates[index - 1]);
    const nextInRow = index % 7 !== 6 && hasRoutine(dates[index + 1]);

    if (prevInRow && nextInRow) return "rounded-none";
    if (prevInRow && !nextInRow) return "rounded-l-none rounded-r-full";
    if (!prevInRow && nextInRow) return "rounded-l-full rounded-r-none";
    return "rounded-full"; // 단독
  };

  /** 투두 완료 회색 점 */
  const renderTodoDot = (date: Date | null) => {
    if (!hasTodo(date)) return null;
    return (
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-300" />
    );
  };

  // ── 날짜 셀 렌더 (공용) ──────────────────────────────
  const renderDateCell = (
    date: Date | null,
    index: number,
    dates: (Date | null)[],
    opts?: { hideOtherMonth?: boolean },
  ) => {
    if (date === null) {
      return <div key={index} className="aspect-square" />;
    }

    const otherMonth = opts?.hideOtherMonth && !isCurrentMonth(date);
    const routine = hasRoutine(date);
    const selected = isSelected(date);
    const todayDate = isToday(date);
    const streakRadius = getStreakRadius(dates, index);

    // 배경색 우선순위: 선택 > 루틴 > 오늘 > 기본
    let bgClass = "";
    let textClass = otherMonth ? "text-gray-300" : "text-gray-700";

    if (selected) {
      bgClass = "bg-[#eab32e]";
      textClass = "text-white font-semibold";
    } else if (routine && !otherMonth) {
      bgClass = "bg-[#eab32e]/15";
      textClass = "text-[#b8860b] font-medium";
    } else if (todayDate) {
      bgClass = "bg-gray-100";
      textClass = "text-gray-900 font-medium";
    }

    // 루틴 streak 연결: 루틴이 있으면 streak radius 적용, 그 외 원형
    const radiusClass = routine && !selected ? streakRadius : "rounded-full";

    return (
      <button
        key={date.toISOString()}
        type="button"
        onClick={() => onSelectDate(date)}
        className={`aspect-square relative flex flex-col items-center justify-center transition-all focus:outline-none ${bgClass} ${radiusClass}`}
      >
        <span className={`text-sm ${textClass}`}>{date.getDate()}</span>
        {!otherMonth && renderTodoDot(date)}
      </button>
    );
  };

  return (
    <div className="rounded-2xl bg-white shadow-md p-6">
      {/* 헤더 (xs): 주간 네비게이션 */}
      <div className="flex sm:hidden items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="이전 주"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="다음 주"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 헤더 (sm 이상): 월간 네비게이션 */}
      <div className="hidden sm:flex items-center justify-between mb-6">
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
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="다음 달"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 주간 캘린더 (xs only) */}
      <div className="block sm:hidden sticky top-0 bg-white z-10 pb-4 -mx-6 px-6">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weekDates.map((date, index) =>
            renderDateCell(date, index, weekDates),
          )}
        </div>
      </div>

      {/* 월간 캘린더 (sm and above) */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDates.map((date, index) =>
            renderDateCell(date, index, monthDates, { hideOtherMonth: true }),
          )}
        </div>
      </div>
    </div>
  );
}
