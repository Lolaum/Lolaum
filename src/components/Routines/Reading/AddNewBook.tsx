"use client";

import React, { useState } from "react";
import { BookOpen, Tablet } from "lucide-react";
import { AddNewBookProps, BookFormData } from "@/types/routines/reading";

export default function AddNewBook({ onCancel, onBackToHome, onSubmit, isEnglishBook }: AddNewBookProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [trackingType, setTrackingType] = useState<"page" | "percent">("page");
  const [totalPages, setTotalPages] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;

    const bookData: BookFormData = {
      title: title.trim(),
      author: author.trim(),
      trackingType,
      totalPages: parseInt(totalPages) || 0,
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

        {/* 책 제목 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            책 제목 <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 아침의 힘"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 저자 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            저자
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="예: 제프 센더스"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
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
