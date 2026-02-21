"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReadingRecord, BookCalendarProps } from "@/types/routines/reading";

export default function BookCalendar({ onBack }: BookCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 임시 독서 기록 데이터
  const readingRecords: ReadingRecord[] = [
    {
      date: "2026-01-05",
      bookCover: "/images/book1.jpg",
      bookTitle: "아침의 힘",
    },
    {
      date: "2026-01-12",
      bookCover: "/images/book2.jpg",
      bookTitle: "습관의 디테일",
    },
    {
      date: "2026-01-18",
      bookCover: "/images/book3.jpg",
      bookTitle: "데일 카네기 인간관계론",
    },
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 해당 월의 첫 날과 마지막 날
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 달력 시작 요일 (0 = 일요일)
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 해당 날짜의 독서 기록 찾기
  const getReadingRecord = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return readingRecords.find((record) => record.date === dateStr);
  };

  // 요일 헤더
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 달력 그리드 생성
  const calendarDays = [];

  // 이전 달의 빈 칸
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // 현재 달의 날짜들
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 뒤로가기 버튼 */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm">뒤로</span>
      </button>

      {/* 헤더 - 년월 및 네비게이션 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">
          {year}년 {month + 1}월
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-4">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0
                ? "text-red-400"
                : index === 6
                  ? "text-blue-400"
                  : "text-gray-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-y-2">
        {calendarDays.map((day, index) => {
          const dayOfWeek = index % 7;
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;
          const readingRecord = day ? getReadingRecord(day) : null;

          return (
            <div
              key={index}
              className="flex flex-col items-center py-2 min-h-[100px]"
            >
              {day && (
                <>
                  {/* 날짜 숫자 */}
                  <span
                    className={`text-sm font-medium mb-2 ${
                      isSunday
                        ? "text-red-400"
                        : isSaturday
                          ? "text-blue-400"
                          : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>

                  {/* 책 표지 (독서 기록이 있는 경우) */}
                  {readingRecord && (
                    <div className="w-10 h-14 rounded overflow-hidden shadow-sm">
                      <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-[8px]">표지</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
