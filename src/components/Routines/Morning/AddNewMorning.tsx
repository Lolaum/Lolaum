"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import {
  AddNewMorningProps,
  MorningFormData,
} from "@/types/routines/morning";

export default function AddNewMorning({
  onCancel,
  onSubmit,
}: AddNewMorningProps) {
  const [image, setImage] = useState("");
  const [condition, setCondition] = useState("");
  const [successAndReflection, setSuccessAndReflection] = useState("");
  const [gift, setGift] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageUrl = URL.createObjectURL(files[0]);
    setImage(imageUrl);
  };

  const removeImage = () => {
    setImage("");
  };

  const handleSubmit = () => {
    if (!condition || !successAndReflection.trim() || !gift.trim()) return;

    const recordData: MorningFormData = {
      image,
      condition: parseInt(condition),
      successAndReflection: successAndReflection.trim(),
      gift: gift.trim(),
    };

    onSubmit?.(recordData);
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
        <span className="text-sm">모닝 리추얼로 돌아가기</span>
      </button>

      {/* 메인 카드 */}
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-200 p-8 mx-auto">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">모닝 기록</h2>

        {/* 인증 사진 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            인증 사진 (최대 1장)
          </label>
          <div className="space-y-3">
            {/* 이미지 업로드 영역 */}
            {!image && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition-colors bg-gray-50">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    이미지 업로드 또는 드래그
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            )}

            {/* 업로드된 이미지 미리보기 */}
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="업로드 이미지"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 오늘의 컨디션 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 컨디션 (%)
          </label>
          <input
            type="number"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="0 ~ 100"
            min="0"
            max="100"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          {/* 컨디션 프리뷰 */}
          {condition && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, parseInt(condition) || 0)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {condition}%
              </span>
            </div>
          )}
        </div>

        {/* 오늘의 작은 성공 & 한 줄 회고 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 작은 성공 & 한 줄 회고
          </label>
          <textarea
            value={successAndReflection}
            onChange={(e) => setSuccessAndReflection(e.target.value)}
            placeholder="오늘 이룬 작은 성공과 느낀 점을 적어보세요"
            rows={4}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 오늘 나에게 주는 선물 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘 나에게 주는 선물 (지금 떠오르는 것 적기)
          </label>
          <textarea
            value={gift}
            onChange={(e) => setGift(e.target.value)}
            placeholder="오늘 나에게 줄 작은 선물을 떠올려보세요"
            rows={3}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !condition || !successAndReflection.trim() || !gift.trim()
            }
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
