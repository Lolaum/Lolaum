"use client";

import { useState, useEffect, useCallback } from "react";
import { List, Plus, LayoutGrid } from "lucide-react";
import AddNewBook from "./AddNewBook";
import BookDetail from "./BookDetail";
import { Book, ViewMode, BookManageProps } from "@/types/routines/reading";
import { getBooksAuto, createBookAuto, deleteBook, updateBook } from "@/api/book";
import type { Book as BookDB } from "@/types/supabase";

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

export default function BookManage({ onBackToTimer, onBackToHome, isEnglishBook, certificationPhotos }: BookManageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const result = await getBooksAuto(isEnglishBook ? "english_book" : "reading");
    if (result.data) {
      setBooks(result.data.map(toBook));
    }
    setLoading(false);
  }, [isEnglishBook]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const calculateProgress = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const handleAddBook = () => {
    setShowAddBook(true);
  };

  const handleBookCreated = async (bookData: {
    title: string;
    author: string;
    trackingType: "page" | "percent";
    totalPages: number;
  }) => {
    const result = await createBookAuto({
      routineType: isEnglishBook ? "english_book" : "reading",
      title: bookData.title,
      author: bookData.author,
      trackingType: bookData.trackingType,
      totalValue: bookData.trackingType === "percent" ? 100 : bookData.totalPages,
    });

    if (result.data) {
      setBooks((prev) => [toBook(result.data!), ...prev]);
    }
  };

  const handleBookDeleted = async (bookId: string) => {
    const result = await deleteBook(bookId);
    if (result.success) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setSelectedBook(null);
    }
  };

  const handleBookUpdated = async (bookId: string, input: {
    title?: string;
    author?: string;
    currentValue?: number;
    isCompleted?: boolean;
  }) => {
    const result = await updateBook(bookId, input);
    if (result.data) {
      const updated = toBook(result.data);
      setBooks((prev) => prev.map((b) => (b.id === bookId ? updated : b)));
      setSelectedBook(updated);
    }
  };

  // 새 책 추가하기 화면
  if (showAddBook) {
    return (
      <div className="w-full">
        <AddNewBook
          onCancel={() => setShowAddBook(false)}
          onBackToHome={onBackToHome}
          onSubmit={handleBookCreated}
          isEnglishBook={isEnglishBook}
        />
      </div>
    );
  }

  // 책 상세 화면
  if (selectedBook) {
    return (
      <div className="w-full">
        <BookDetail
          book={selectedBook}
          onBack={() => setSelectedBook(null)}
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
      {/* 뒤로가기 버튼 및 x버튼 */}
      <div className="flex items-center justify-between mb-4">
        {!isEnglishBook ? (
          <button
            type="button"
            onClick={onBackToTimer}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">타이머로 돌아가기</span>
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 영어원서: 외부 링크 */}
      {isEnglishBook && (
        <button
          type="button"
          className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-900">원서 읽기 자료</p>
            <p className="text-xs text-gray-400 mt-0.5">클릭하여 원서 자료 페이지로 이동</p>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {isEnglishBook ? "원서 관리" : "독서 관리"}
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? "불러오는 중..." : `현재 ${books.length}권의 책을 읽고 있습니다`}
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
            onClick={handleAddBook}
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
          {books.map((book) => {
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
                {/* 책 정보 */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500">{book.author}</p>
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
            onClick={handleAddBook}
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
          {books.map((book) => {
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

    </div>
  );
}
