"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  List,
  Plus,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
import BookDetail from "./BookDetail";
import { Book, ViewMode } from "@/types/routines/reading";
import { getBooksAuto, deleteBook, updateBook } from "@/api/book";
import type { Book as BookDB } from "@/types/supabase";

function BookCover({
  url,
  alt,
  className,
  iconSize,
}: {
  url: string | null;
  alt: string;
  className: string;
  iconSize: string;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes="120px"
        unoptimized
        referrerPolicy="no-referrer"
        className={className}
      />
    );
  }
  return (
    <div
      className={`${className} bg-gray-100 flex items-center justify-center`}
    >
      <BookOpen className={`${iconSize} text-gray-300`} />
    </div>
  );
}

interface BookManageProps {
  onBackToHome?: () => void;
  onAddBook: () => void;
  isEnglishBook?: boolean;
  certificationPhotos?: string[];
  initialBookId?: string;
}

/** DB Row → 프론트엔드 Book 변환 */
function toBook(row: BookDB): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    trackingType: row.tracking_type as "page" | "percent",
    currentValue: row.current_value,
    totalValue: row.total_value,
    coverImageUrl: row.cover_image_url,
    isCompleted: row.is_completed,
    updatedAt: row.updated_at,
  };
}

export default function BookManage({
  onBackToHome,
  onAddBook,
  isEnglishBook,
  certificationPhotos,
  initialBookId,
}: BookManageProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompletedBooks, setShowCompletedBooks] = useState(false);
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const result = await getBooksAuto(
      isEnglishBook ? "english_book" : "reading",
    );
    if (result.data) {
      setBooks(result.data.map(toBook));
    }
    setLoading(false);
  }, [isEnglishBook]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchBooks());
  }, [fetchBooks]);

  const calculateProgress = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };
  const activeBook =
    selectedBook ?? books.find((item) => item.id === initialBookId) ?? null;
  const completedBooks = books.filter((book) => book.isCompleted);
  const currentBooks = books.filter((book) => !book.isCompleted);
  const calendarPath = isEnglishBook
    ? "/home/english-book/calendar"
    : "/home/reading/calendar";

  const handleBookDeleted = async (bookId: string) => {
    const result = await deleteBook(bookId);
    if (result.success) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setSelectedBook(null);
    }
  };

  const handleBookUpdated = async (
    bookId: string,
    input: {
      title?: string;
      author?: string;
      currentValue?: number;
      totalValue?: number;
      isCompleted?: boolean;
      coverImageUrl?: string | null;
    },
  ) => {
    const result = await updateBook(bookId, input);
    if (result.data) {
      const updated = toBook(result.data);
      setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
      setSelectedBook(updated);
    }
  };

  // 책 상세 화면
  if (activeBook) {
    return (
      <div className="w-full">
        <BookDetail
          book={activeBook}
          onBack={() => {
            setSelectedBook(null);
            if (initialBookId) {
              router.replace(
                isEnglishBook ? "/home/english-book" : "/home/reading",
              );
            }
          }}
          onBackToHome={onBackToHome}
          onDelete={handleBookDeleted}
          onUpdate={handleBookUpdated}
          isEnglishBook={isEnglishBook}
          certificationPhotos={certificationPhotos}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* x버튼 */}
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 영어원서: 외부 링크 */}
      {isEnglishBook && (
        <a
          href="https://classroom.google.com/c/ODM2ODc5NDYwMzY2?cjc=bgggatyj"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-900">구글 클래스룸</p>
            <p className="text-xs text-gray-400 mt-0.5">
              클릭하여 구글 클래스룸 페이지로 이동
            </p>
          </div>
          <svg
            className="w-4 h-4 text-gray-300"
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
        </a>
      )}

      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {isEnglishBook ? "원서 관리" : "독서 관리"}
          </h1>
          <p className="text-sm text-gray-500">
            {loading
              ? "불러오는 중..."
              : `현재 ${currentBooks.length}권의 책을 읽고 있습니다`}
          </p>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-400"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded transition-colors ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-400"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 그리드 뷰 */}
      {viewMode === "grid" && (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {/* 새 책 추가하기 카드 */}
          <button
            type="button"
            onClick={onAddBook}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-colors w-[200px] h-[200px] flex-shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900 mb-1">
                새 책 추가하기
              </p>
              <p className="text-xs text-gray-500">읽고 있는 책을 등록하세요</p>
            </div>
          </button>

          {/* 책 카드들 */}
          {currentBooks.map((book) => {
            const progress = calculateProgress(
              book.currentValue,
              book.totalValue,
            );
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-100 w-[280px] h-[200px] flex-shrink-0 flex p-4 gap-4"
              >
                {/* 책 표지 */}
                <div className="relative w-[100px] h-[140px] shrink-0">
                  <BookCover
                    url={book.coverImageUrl}
                    alt={book.title}
                    className="object-cover rounded-md"
                    iconSize="w-7 h-7"
                  />
                </div>

                {/* 책 정보 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {book.author}
                    </p>
                  </div>

                  {/* 진행률 정보 */}
                  <div>
                    <div className="text-sm text-gray-600 mb-2">
                      {book.trackingType === "percent"
                        ? `${book.currentValue}% 진행`
                        : `${book.currentValue} / ${book.totalValue} 페이지`}{" "}
                      · {progress}%
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 리스트 뷰 */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {/* 새 책 추가하기 버튼 */}
          <button
            type="button"
            onClick={onAddBook}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">
                새 책 추가하기
              </p>
              <p className="text-xs text-gray-500">읽고 있는 책을 등록하세요</p>
            </div>
          </button>

          {/* 책 리스트 */}
          {currentBooks.map((book) => {
            const progress = calculateProgress(
              book.currentValue,
              book.totalValue,
            );
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-3">
                  {/* 책 표지 */}
                  <div className="relative w-[60px] h-[84px] shrink-0">
                    <BookCover
                      url={book.coverImageUrl}
                      alt={book.title}
                      className="object-cover rounded-md"
                      iconSize="w-5 h-5"
                    />
                  </div>

                  {/* 책 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-0.5 truncate">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{book.author}</p>

                    {/* 진행률 정보 */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                      <span>
                        {book.trackingType === "percent"
                          ? `${book.currentValue}% 진행`
                          : `${book.currentValue} / ${book.totalValue} 페이지`}
                      </span>
                      <span className="font-semibold">{progress}%</span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <button
            type="button"
            onClick={() => setShowCompletedBooks((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showCompletedBooks}
          >
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                완독한 책
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                끝까지 읽은 책을 모아봅니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-orange-500">
                {completedBooks.length}권
              </span>
              <ChevronRight
                className={`h-4 w-4 text-gray-300 transition-transform ${
                  showCompletedBooks ? "rotate-90" : ""
                }`}
              />
            </div>
          </button>

          {showCompletedBooks && completedBooks.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
              <p className="text-sm text-gray-400">
                아직 완독한 책이 없습니다.
              </p>
            </div>
          ) : null}

          {showCompletedBooks && completedBooks.length > 0 ? (
            <div className="mt-3 space-y-2">
              {completedBooks.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className="w-full rounded-xl border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                      <BookCover
                        url={book.coverImageUrl}
                        alt={book.title}
                        className="object-cover rounded-md"
                        iconSize="w-4 h-4"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {book.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {book.author}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-500">
                      완독
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <button
          type="button"
          onClick={() => router.push(calendarPath)}
          className="w-full rounded-2xl bg-white p-4 text-left shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <CalendarDays className="h-5 w-5 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                독서 달력
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                독서와 원서읽기에 기록한 책을 함께 봅니다
              </p>
            </div>
            <svg
              className="h-4 w-4 text-gray-300"
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
          </div>
        </button>
      </div>
    </div>
  );
}
