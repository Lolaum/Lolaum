"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, BookCheck } from "lucide-react";
import { ReadingRecord, BookCalendarProps, CompletedBook } from "@/types/routines/reading";
import { getMyRitualRecords } from "@/api/ritual-record";
import { getBooksAuto } from "@/api/book";
import type { ReadingRecordData } from "@/types/supabase";

export default function BookCalendar({ onBack, onBookSelect, completedBooks = [] }: BookCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [readingRecords, setReadingRecords] = useState<ReadingRecord[]>([]);
  const [bookMap, setBookMap] = useState<Record<string, { title: string; coverImageUrl: string | null }>>({});
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 책 목록과 독서 기록을 동시에 가져오기
      const [booksResult, recordsResult] = await Promise.all([
        getBooksAuto("reading"),
        getMyRitualRecords({ routineType: "reading" }),
      ]);

      // 책 ID → 정보 매핑
      const map: Record<string, { title: string; coverImageUrl: string | null }> = {};
      if (booksResult.data) {
        for (const book of booksResult.data) {
          map[book.id] = { title: book.title, coverImageUrl: book.cover_image_url };
        }
      }
      setBookMap(map);

      // ritual_records에서 독서 기록 추출
      if (recordsResult.data) {
        const records: ReadingRecord[] = [];
        for (const record of recordsResult.data) {
          const data = record.record_data as unknown as ReadingRecordData;
          if (data?.bookId && map[data.bookId]) {
            records.push({
              date: record.record_date,
              bookCover: map[data.bookId].coverImageUrl ?? "",
              bookTitle: map[data.bookId].title,
            });
          }
        }
        setReadingRecords(records);
      }

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

  // 해당 날짜의 독서 기록 찾기
  const getReadingRecord = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return readingRecords.find((record) => record.date === dateStr);
  };

  // 해당 날짜에 완독된 책 찾기
  const getCompletedBook = (day: number): CompletedBook | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return completedBooks.find((book) => book.completedDate === dateStr);
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

      {/* 완독 책 목록 */}
      {completedBooks.length > 0 && (
        <div className="mb-6 bg-orange-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <BookCheck className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-orange-700">이번 달 완독</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {completedBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => onBookSelect?.(book.title)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden shadow-sm ring-2 ring-orange-400">
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                      <span className="text-white text-[7px] font-medium">완독</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 max-w-[60px] truncate">{book.title}</span>
              </button>
            ))}
          </div>
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
          const readingRecord = day ? getReadingRecord(day) : null;
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
                      onClick={() => onBookSelect?.(completedBook.title)}
                      className="w-10 h-14 rounded overflow-hidden shadow-md hover:scale-110 transition-transform ring-2 ring-orange-400 relative"
                      title={`${completedBook.title} (완독!)`}
                    >
                      {completedBook.coverImageUrl ? (
                        <img
                          src={completedBook.coverImageUrl}
                          alt={completedBook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                          <span className="text-white text-[7px] font-medium">완독</span>
                        </div>
                      )}
                      {/* 완독 배지 */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </button>
                  ) : readingRecord ? (
                    <button
                      type="button"
                      onClick={() => onBookSelect?.(readingRecord.bookTitle)}
                      className="w-10 h-14 rounded overflow-hidden shadow-sm hover:scale-110 hover:shadow-md transition-transform"
                      title={readingRecord.bookTitle}
                    >
                      {readingRecord.bookCover ? (
                        <img
                          src={readingRecord.bookCover}
                          alt={readingRecord.bookTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                          <span className="text-white text-[8px]">표지</span>
                        </div>
                      )}
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
