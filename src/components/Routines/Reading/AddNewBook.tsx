"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BookOpen, Tablet, Search, Upload, X, ImagePlus } from "lucide-react";
import { AddNewBookProps, BookFormData } from "@/types/routines/reading";
import type { BookSearchResult } from "@/app/api/books/search/route";
import { uploadBookCover } from "@/api/book";
import { resizeImageFile } from "@/lib/utils";

export default function AddNewBook({ onCancel, onBackToHome, onSubmit, isEnglishBook }: AddNewBookProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [trackingType, setTrackingType] = useState<"page" | "percent">("page");
  const [totalPages, setTotalPages] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 카카오 책 자동완성 ──────────────────────────────
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const skipSearchRef = useRef(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const keyword = title.trim();
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (keyword.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/books/search?query=${encodeURIComponent(keyword)}&size=10`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const json: { documents: BookSearchResult[] } = await res.json();
        setResults(json.documents);
        setShowResults(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchBoxRef.current?.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (book: BookSearchResult) => {
    skipSearchRef.current = true;
    setTitle(book.title);
    setAuthor(book.author);
    setCoverImageUrl(book.thumbnail || null);
    setShowResults(false);
    setResults([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const resized = await resizeImageFile(file, 800, 0.85);
      const formData = new FormData();
      formData.append("file", resized);
      const { url, error } = await uploadBookCover(formData);
      if (error) {
        alert(`표지 업로드 실패: ${error}`);
        return;
      }
      if (url) setCoverImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;

    const bookData: BookFormData = {
      title: title.trim(),
      author: author.trim(),
      trackingType,
      totalPages: parseInt(totalPages) || 0,
      coverImageUrl,
    };

    setSubmitting(true);
    await onSubmit?.(bookData);
    setSubmitting(false);
    onCancel();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 백 네비게이션 및 x버튼 */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onCancel}
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
          <span className="text-sm">
            {isEnglishBook ? "원서읽기 리추얼 관리로 돌아가기" : "독서 관리로 돌아가기"}
          </span>
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

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-4 mx-auto">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">책 추가하기</h2>

        {/* 표지 + 제목/저자 (좌우 레이아웃) */}
        <div className="mb-6 flex gap-4" ref={searchBoxRef}>
          {/* 왼쪽: 책 표지 */}
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {coverImageUrl ? (
              <div className="relative w-28 h-40">
                <Image
                  src={coverImageUrl}
                  alt={title || "책 표지"}
                  fill
                  sizes="112px"
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl(null)}
                  className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 shadow-sm"
                  aria-label="표지 제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs py-1 rounded-b-lg flex items-center justify-center gap-1 hover:bg-black/60 disabled:opacity-50"
                >
                  <ImagePlus className="w-3 h-3" />
                  {uploading ? "업로드 중" : "변경"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-28 h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <span className="text-xs">업로드 중...</span>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-xs leading-tight text-center px-1">표지 직접 추가</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* 오른쪽: 제목 + 저자 */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* 책 제목 (자동완성) */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                책 제목 <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  placeholder="제목 입력 시 자동 검색"
                  className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {showResults && (results.length > 0 || searching) && (
                <ul className="absolute z-10 mt-2 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                  {searching && (
                    <li className="px-4 py-3 text-sm text-gray-400">검색 중...</li>
                  )}
                  {!searching && results.length === 0 && (
                    <li className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다. 표지를 직접 추가해 주세요</li>
                  )}
                  {results.map((book, idx) => (
                    <li key={`${book.title}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectResult(book)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 text-left"
                      >
                        {book.thumbnail ? (
                          <Image
                            src={book.thumbnail}
                            alt={book.title}
                            width={40}
                            height={56}
                            unoptimized
                            referrerPolicy="no-referrer"
                            className="w-10 h-14 object-cover rounded shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-gray-100 rounded shrink-0 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                          <p className="text-xs text-gray-500 truncate">{book.author || "저자 미상"}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 저자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                저자
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="저자명"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* 책 종류 */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            책 종류
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTrackingType("page")}
              className={`flex-1 py-4 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
                trackingType === "page"
                  ? "border-orange-500 bg-orange-50 text-orange-500"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">종이책</span>
            </button>
            <button
              type="button"
              onClick={() => setTrackingType("percent")}
              className={`flex-1 py-4 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
                trackingType === "percent"
                  ? "border-orange-500 bg-orange-50 text-orange-500"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              <Tablet className="w-5 h-5" />
              <span className="font-medium">전자책</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            종이책은 페이지(p), 전자책은 퍼센트(%)로 진행도를 기록합니다
          </p>
        </div>

        {/* 총 페이지 수 */}
        {trackingType === "page" && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              총 페이지 수
            </label>
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="예: 280"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? "추가하는 중..." : "책 추가하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
