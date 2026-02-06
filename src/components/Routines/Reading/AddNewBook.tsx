"use client";

import React, { useState } from "react";
import { Upload, X, FileText, Percent } from "lucide-react";

interface AddNewBookProps {
  onCancel: () => void;
  onSubmit?: (bookData: BookFormData) => void;
}

interface BookFormData {
  title: string;
  author: string;
  trackingType: "page" | "percent";
  totalPages: number;
  coverImage?: File;
}

export default function AddNewBook({ onCancel, onSubmit }: AddNewBookProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [trackingType, setTrackingType] = useState<"page" | "percent">("page");
  const [totalPages, setTotalPages] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const bookData: BookFormData = {
      title: title.trim(),
      author: author.trim(),
      trackingType,
      totalPages: parseInt(totalPages) || 0,
      coverImage: coverImage || undefined,
    };

    onSubmit?.(bookData);
    onCancel();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 백 네비게이션 */}
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
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
        <span className="text-sm">독서 관리로 돌아가기</span>
      </button>

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-8 mx-auto">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">책 추가하기</h2>

        {/* 책 표지 업로드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            책 표지
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative border-2 border-dashed border-gray-300 rounded-2xl py-12 px-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white"
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="책 표지 미리보기"
                  className="w-24 h-36 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverImage(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-sm text-orange-500 font-medium underline">
                  클릭하거나 드래그해서 업로드
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG (권장: 2:3 비율)
                </p>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

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

        {/* 진행도 측정 방식 */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            진행도 측정 방식
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
              <FileText className="w-5 h-5" />
              <span className="font-medium">페이지</span>
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
              <Percent className="w-5 h-5" />
              <span className="font-medium">퍼센트</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            총 페이지 수를 입력하면 현재 읽은 페이지를 진행률로 전환될
            측정합니다
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
            disabled={!title.trim()}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            책 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
