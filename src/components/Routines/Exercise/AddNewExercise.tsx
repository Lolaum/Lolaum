"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { applyTimestamp, fileToBase64 } from "@/lib/utils";
import {
  AddNewExerciseProps,
  ExerciseFormData,
  ExerciseRecordType,
} from "@/types/routines/exercise";

const DURATION_OPTIONS = [10, 20, 30, 40, 50, 60, 90, 120];
const MACROS_OPTIONS = ["1:1:1", "2:1:1", "3:2:1", "4:3:3", "5:3:2"];

export default function AddNewExercise({
  onCancel,
  onBackToHome,
  onSubmit,
  initialImages,
}: AddNewExerciseProps) {
  const [images, setImages] = useState<string[]>(initialImages ?? []);
  const [recordType, setRecordType] = useState<ExerciseRecordType>("exercise");
  const [exerciseName, setExerciseName] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [macros, setMacros] = useState<string | null>(null);
  const [customMacros, setCustomMacros] = useState("");
  const [achievement, setAchievement] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 5 - images.length);
    const stampedImages = await Promise.all(
      newFiles.map((f) => applyTimestamp(f).catch(() => fileToBase64(f)))
    );
    setImages([...images, ...stampedImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const finalDuration = duration ?? (customDuration ? parseInt(customDuration) : 0);
  const finalMacros = macros ?? (customMacros.trim() || undefined);

  const canSubmit =
    exerciseName.trim() &&
    (recordType === "exercise" ? finalDuration > 0 : !!finalMacros);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const recordData: ExerciseFormData = {
      recordType,
      images,
      exerciseName: exerciseName.trim(),
      duration: recordType === "exercise" ? finalDuration : 0,
      macros: recordType === "diet" ? finalMacros : undefined,
      achievement: achievement.trim(),
    };

    if (onSubmit) {
      await onSubmit(recordData);
    } else {
      onCancel();
    }
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
        {/* 운동 / 식단 탭 */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setRecordType("exercise")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              recordType === "exercise"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            운동 기록
          </button>
          <button
            type="button"
            onClick={() => setRecordType("diet")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
              recordType === "diet"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            식단 기록
          </button>
        </div>

        {/* 인증 사진 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            인증 사진 (최대 5장)
          </label>
          <div className="space-y-3">
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

        {/* 운동 종류 / 식단 이름 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {recordType === "exercise" ? "운동 종류" : "식단 기록"}
          </label>
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder={
              recordType === "exercise"
                ? "예: 필라테스, 달리기, 웨이트 트레이닝"
                : "예: 샐러드, 닭가슴살 도시락"
            }
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* 운동 시간 선택 (운동일 때) */}
        {recordType === "exercise" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              운동 시간 (분)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DURATION_OPTIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => {
                    setDuration(duration === min ? null : min);
                    setCustomDuration("");
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    duration === min
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {min}분
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value);
                setDuration(null);
              }}
              placeholder="직접 입력 (분)"
              min="1"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
            />
          </div>
        )}

        {/* 탄단지 비율 선택 (식단일 때) */}
        {recordType === "diet" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              탄:단:지 비율
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {MACROS_OPTIONS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => {
                    setMacros(macros === ratio ? null : ratio);
                    setCustomMacros("");
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    macros === ratio
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customMacros}
              onChange={(e) => {
                setCustomMacros(e.target.value);
                setMacros(null);
              }}
              placeholder="직접 입력 (예: 3:2:1)"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
            />
          </div>
        )}

        {/* 오늘의 작은 성취 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 작은 성취
          </label>
          <textarea
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
            placeholder={
              recordType === "exercise"
                ? "운동 후 한 줄 코멘트를 작성해주세요."
                : "식단 후 한 줄 코멘트를 작성해주세요."
            }
            rows={4}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
