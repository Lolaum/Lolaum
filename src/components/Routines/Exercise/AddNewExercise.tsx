"use client";

import { useState, useRef } from "react";
import { Upload, X, Info } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = recordType === "diet" ? 1 : 5;
    const newFiles = Array.from(files).slice(0, maxImages - images.length);
    const stampedImages = await Promise.all(
      newFiles.map((f) => applyTimestamp(f).catch(() => fileToBase64(f))),
    );
    setImages([...images, ...stampedImages].slice(0, maxImages));
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const finalDuration =
    duration ?? (customDuration ? parseInt(customDuration) : 0);
  const finalMacros = macros ?? (customMacros.trim() || undefined);

  const canSubmit =
    exerciseName.trim() &&
    (recordType === "exercise" ? finalDuration > 0 : !!finalMacros);

  const handleSubmit = async () => {
    if (submittingRef.current || !canSubmit) return;
    submittingRef.current = true;
    setSubmitting(true);

    const recordData: ExerciseFormData = {
      recordType,
      images,
      exerciseName: exerciseName.trim(),
      duration: recordType === "exercise" ? finalDuration : 0,
      macros: recordType === "diet" ? finalMacros : undefined,
      achievement: achievement.trim(),
    };

    try {
      if (onSubmit) {
        await onSubmit(recordData);
      } else {
        onCancel();
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
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
            onClick={() => {
              setRecordType("diet");
              setImages((prev) => prev.slice(0, 1));
            }}
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
            인증 사진
          </label>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            {recordType === "exercise"
              ? "10분 이상 텀이 있는 시작/종료 사진 or 10분 이상 운동 기록 찍힌 운동 앱 화면 캡쳐"
              : "건강한 식단 사진 1장"}
          </p>
          <div className="space-y-3">
            {images.length < (recordType === "diet" ? 1 : 5) && (
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
                  multiple={recordType !== "diet"}
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
                ? "예) 필라테스, 달리기, 웨이트 트레이닝"
                : "예) 샐러드, 닭가슴살 도시락"
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
            <div className="flex items-center gap-1.5 mb-3">
              <label className="block text-sm font-medium text-gray-700">
                탄:단:지 비율
              </label>
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  aria-label="권장 탄단지 비율 안내"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div
                  role="tooltip"
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg transition-opacity z-10 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible"
                >
                  <p className="mb-2">
                    한국인 영양소 섭취 기준, 권장되는 탄단지 비율
                    <br />
                    탄수화물 50~60%, 단백질 15~20%, 지방 20~25%
                  </p>
                  <p className="mb-2">
                    다이어트를 목적으로 한다면
                    <br />
                    탄수화물 40%, 단백질 30%, 지방 30%
                  </p>
                  <p>
                    근육 증가가 목표라면 단백질 비중을 더 높여
                    <br />
                    탄수화물 45%, 단백질 35%, 지방 20%
                  </p>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              영양소 비율 기록은 균형잡힌 식단인지 체크하는 것이 목적입니다.
              인아웃 등 영양소 확인 앱 등 활용해도 되고, 대략 탄/단/지 구분이
              가능하시다면 눈대중으로 작성하셔도 됩니다 :)
            </p>
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
                ? "예: 티비보면서 쉬려다가 무작정 시작한 홈트!! 조금이라도 해서 너무 뿌듯❤️"
                : "예: 샐러드만 먹었는데도 포만감 충분! 내가 먹은 음식 영양소를 눈으로도 대략 확인할 수 있게 됐다ㅎㅎ"
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
            disabled={!canSubmit || submitting}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? "저장 중..." : "기록 추가하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
