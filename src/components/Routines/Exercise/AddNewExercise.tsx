"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import {
  AddNewExerciseProps,
  ExerciseFormData,
} from "@/types/routines/exercise";

export default function AddNewExercise({
  onCancel,
  onBackToHome,
  onSubmit,
}: AddNewExerciseProps) {
  const [images, setImages] = useState<string[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [duration, setDuration] = useState("");
  const [achievement, setAchievement] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - images.length);
    const imageUrls = newImages.map((file) => URL.createObjectURL(file));
    setImages([...images, ...imageUrls].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!exerciseName.trim() || !duration) return;

    const recordData: ExerciseFormData = {
      images,
      exerciseName: exerciseName.trim(),
      duration: parseInt(duration),
      achievement: achievement.trim(),
    };

    onSubmit?.(recordData);
    onCancel();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 백 네비게이션 및 x버튼 */}
      <div className="flex items-center justify-between mb-4">
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
          <span className="text-sm">운동 관리로 돌아가기</span>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">운동 기록</h2>

        {/* 인증 사진 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            인증 사진 (최대 5장)
          </label>
          <div className="space-y-3">
            {/* 이미지 업로드 영역 */}
            {images.length < 5 && (
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
                  multiple
                  onChange={handleImageUpload}
                />
              </label>
            )}

            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`업로드 이미지 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 운동 종류 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            운동 종류 / 식단 기록
          </label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="예: 필라테스, 달리기, 웨이트 트레이닝"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 운동 시간 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            운동 시간 (분) / 탄단지 비율 (%)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="예: 50"
            min="1"
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 오늘의 작은 성취 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 작은 성취
          </label>
          <textarea
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            placeholder="운동 후 한 줄 코멘트 혹은 식단 후 한 줄 코멘트를 작성해주세요."
            rows={4}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!exerciseName.trim() || !duration}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
