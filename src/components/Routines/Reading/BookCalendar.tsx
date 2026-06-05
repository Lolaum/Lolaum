"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, BookCheck } from "lucide-react";
import {
  BookCalendarProps,
  CompletedBook,
} from "@/types/routines/reading";
import { getMyRitualRecordsAcrossChallenges } from "@/api/ritual-record";
import { getBooksAuto } from "@/api/book";
import type { ReadingRecordData } from "@/types/supabase";

export default function BookCalendar({
  embedded = false,
  onBack,
  onBookSelect,
  completedBooks = [],
}: BookCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarCompletedBooks, setCalendarCompletedBooks] = useState<
    CompletedBook[]
  >([]);
  const [showCompletedBooks, setShowCompletedBooks] = useState(false);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 독서/원서읽기 책과 기록을 함께 가져오기
      const [readingBooksResult, englishBooksResult, recordsResult] =
        await Promise.all([
          getBooksAuto("reading"),
          getBooksAuto("english_book"),
          getMyRitualRecordsAcrossChallenges({
            routineTypes: ["reading", "english_book"],
          }),
        ]);

      // 책 ID → 정보 매핑
      const allBooks = [
        ...(readingBooksResult.data ?? []),
        ...(englishBooksResult.data ?? []),
      ];
      const map: Record<
        string,
        {
          title: string;
          coverImageUrl: string | null;
          routineType: "reading" | "english_book";
          totalValue: number;
        }
      > = {};
      for (const book of allBooks) {
        map[book.id] = {
          title: book.title,
          coverImageUrl: book.cover_image_url,
          routineType: book.routine_type,
          totalValue: book.total_value,
        };
      }

      const completedDateByBookId: Record<string, string> = {};
      for (const record of recordsResult.data ?? []) {
        const data = record.record_data as unknown as ReadingRecordData;
        const bookId = data?.bookId;
        const book = bookId ? map[bookId] : undefined;
        if (!book || data.endValue < book.totalValue) continue;
        const previousDate = completedDateByBookId[bookId];
        if (!previousDate || record.record_date < previousDate) {
          completedDateByBookId[bookId] = record.record_date;
        }
      }

      setCalendarCompletedBooks(
        allBooks
          .filter((book) => book.is_completed)
          .map((book) => ({
            id: book.id,
            title: book.title,
            coverImageUrl: book.cover_image_url,
            completedDate:
              completedDateByBookId[book.id] ?? book.updated_at.slice(0, 10),
            routineType: book.routine_type,
          })),
      );

      setLoading(false);
    }

    fetchData();
  }, []);

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

  // 해당 날짜에 완독된 책 찾기
  const getCompletedBook = (day: number): CompletedBook | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return [...completedBooks, ...calendarCompletedBooks].find(
      (book) => book.completedDate === dateStr,
    );
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
      {!embedded && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">뒤로</span>
        </button>
      )}

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

      {/* 완독 책 목록 */}
      {[...completedBooks, ...calendarCompletedBooks].length > 0 && (
        <div className="mb-6 bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <button
            type="button"
            onClick={() => setShowCompletedBooks((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showCompletedBooks}
          >
            <div className="flex items-center gap-2">
              <BookCheck className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-orange-700">
                완독한 책
              </h3>
              <span className="text-xs font-semibold text-orange-500">
                {[...completedBooks, ...calendarCompletedBooks].length}권
              </span>
            </div>
            <ChevronRight
              className={`h-4 w-4 text-orange-400 transition-transform ${
                showCompletedBooks ? "rotate-90" : ""
              }`}
            />
          </button>

          {showCompletedBooks && (
            <div className="mt-3 space-y-2">
              {[...completedBooks, ...calendarCompletedBooks].map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    if (book.routineType) {
                      onBookSelect?.({
                        bookId: book.id,
                        routineType: book.routineType,
                      });
                    }
                  }}
                  className="w-full rounded-xl bg-white/70 p-3 text-left transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-sm">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          width={40}
                          height={56}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-300 to-orange-500">
                          <span className="text-[7px] font-medium text-white">
                            완독
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {book.title}
                      </p>
                      <p className="mt-0.5 text-xs text-orange-600">
                        {book.completedDate}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-gray-400 mb-4">불러오는 중...</p>
      )}

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
          const completedBook = day ? getCompletedBook(day) : undefined;

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

                  {/* 완독된 책 표지 (우선 표시) */}
                  {completedBook ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (completedBook.routineType) {
                          onBookSelect?.({
                            bookId: completedBook.id,
                            routineType: completedBook.routineType,
                          });
                        }
                      }}
                      className="w-10 h-14 rounded overflow-hidden shadow-md hover:scale-110 transition-transform relative"
                      title={`${completedBook.title} (완독!)`}
                    >
                      {completedBook.coverImageUrl ? (
                        <Image
                          src={completedBook.coverImageUrl}
                          alt={completedBook.title}
                          width={40}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                          <span className="text-white text-[7px] font-medium">
                            완독
                          </span>
                        </div>
                      )}
                      {/* 완독 배지 */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
