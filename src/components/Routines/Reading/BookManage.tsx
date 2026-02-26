"use client";

import { useState } from "react";
import { List, Plus, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";
import AddNewBook from "./AddNewBook";
import BookCalendar from "./BookCalendar";
import BookDetail from "./BookDetail";
import { Book, ViewMode, BookManageProps } from "@/types/routines/reading";

export default function BookManage({ onBackToTimer, onBackToHome }: BookManageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAddBook, setShowAddBook] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // 임시 책 데이터
  const books: Book[] = [
    {
      id: 1,
      title: "아침의 힘",
      author: "제프 센더스",
      trackingType: "page",
      currentPage: 126,
      totalPages: 280,
      coverImage: "/images/book1.jpg",
    },
    {
      id: 2,
      title: "습관의 디테일",
      author: "제임스 클리어",
      trackingType: "percent",
      currentPage: 45,
      totalPages: 100,
      coverImage: "/images/book2.jpg",
    },
    {
      id: 3,
      title: "데일 카네기 인간관계론",
      author: "데일 카네기",
      trackingType: "page",
      currentPage: 118,
      totalPages: 420,
      coverImage: "/images/book3.jpg",
    },
    {
      id: 4,
      title: "아침의 힘",
      author: "제프 센더스",
      trackingType: "page",
      currentPage: 126,
      totalPages: 280,
      coverImage: "/images/book1.jpg",
    },
    {
      id: 5,
      title: "습관의 디테일",
      author: "제임스 클리어",
      trackingType: "percent",
      currentPage: 72,
      totalPages: 100,
      coverImage: "/images/book2.jpg",
    },
    {
      id: 6,
      title: "데일 카네기 인간관계론",
      author: "데일 카네기",
      trackingType: "page",
      currentPage: 118,
      totalPages: 420,
      coverImage: "/images/book3.jpg",
    },
  ];

  const calculateProgress = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const handleAddBook = () => {
    setShowAddBook(true);
  };

  // 새 책 추가하기 화면
  if (showAddBook) {
    return (
      <div className="w-full">
        <AddNewBook onCancel={() => setShowAddBook(false)} onBackToHome={onBackToHome} />
      </div>
    );
  }

  // 독서 달력 화면
  if (showCalendar) {
    return (
      <div className="w-full">
        <BookCalendar
          onBack={() => setShowCalendar(false)}
          onBookSelect={(bookTitle) => {
            const found = books.find((b) => b.title === bookTitle);
            if (found) {
              setShowCalendar(false);
              setSelectedBook(found);
            }
          }}
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
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 뒤로가기 버튼 및 x버튼 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBackToTimer}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm">타이머로 돌아가기</span>
        </button>
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
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">독서 관리</h1>
          <p className="text-sm text-gray-500">
            현재 {books.length}권의 책을 읽고 있습니다
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
              book.currentPage,
              book.totalPages,
            );
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-100 w-[320px] h-[200px] flex-shrink-0 flex p-4 gap-4"
              >
                {/* 책 표지 */}
                <div className="w-[120px] h-full bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {/* 임시 이미지 대신 배경색 */}
                  <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      책 표지
                    </span>
                  </div>
                </div>

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
                      {book.currentPage} / {book.totalPages} 페이지 · {progress}
                      %
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
              book.currentPage,
              book.totalPages,
            );
            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex gap-3">
                  {/* 책 표지 썸네일 */}
                  <div className="w-14 h-18 bg-gradient-to-br from-orange-300 to-orange-500 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xs">표지</span>
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
                        {book.currentPage} / {book.totalPages} 페이지
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

      {/* 독서 달력 보기 */}
      <button
        type="button"
        onClick={() => setShowCalendar(true)}
        className="flex w-full bg-gradient-to-r from-[#fef7e6] to-[#fef4dc] rounded-xl p-6 mt-6 items-center cursor-pointer hover:opacity-80 transition-opacity text-left"
      >
        <CalendarIcon className="w-12 h-12 text-[var(--gold-300)] bg-[#fdefc8] rounded-xl p-2" />
        <div className="ml-4 flex flex-col justify-center gap-1">
          <span>독서 달력 보기</span>
          <span>매일의 독서 기록을 확인하세요</span>
        </div>
      </button>
    </div>
  );
}
