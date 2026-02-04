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
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">새 책 추가하기</h2>
      </div>

      {/* 책 표지 업로드 */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          책 표지
        </label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="책 표지 미리보기"
                className="w-24 h-32 object-cover rounded-lg"
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
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-orange-500 font-medium">
                클릭하거나 드래그해서 업로드
              </p>
              <p className="text-xs text-gray-400 mt-1">
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          책 제목 <span className="text-orange-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 아침의 힘"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 저자 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          저자
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="예: 제프 센더스"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 진행도 추적 방식 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          진행도 추적 방식
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTrackingType("page")}
            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
              trackingType === "page"
                ? "border-orange-500 bg-orange-50 text-orange-600"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">페이지</span>
          </button>
          <button
            type="button"
            onClick={() => setTrackingType("percent")}
            className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
              trackingType === "percent"
                ? "border-orange-500 bg-orange-50 text-orange-600"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <Percent className="w-5 h-5" />
            <span className="font-medium">퍼센트</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          총 페이지 수를 입력하면 현재 읽은 페이지로 진행도를 추적합니다
        </p>
      </div>

      {/* 총 페이지 수 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          총 페이지 수
        </label>
        <input
          type="number"
          value={totalPages}
          onChange={(e) => setTotalPages(e.target.value)}
          placeholder="예: 280"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="flex-1 py-3 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          책 추가하기
        </button>
      </div>
    </div>
  );
}
