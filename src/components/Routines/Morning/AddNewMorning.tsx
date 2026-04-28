"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { applyTimestamp, fileToBase64 } from "@/lib/utils";
import {
  AddNewMorningProps,
  MorningFormData,
  ConditionLevel,
} from "@/types/routines/morning";

export default function AddNewMorning({
  onCancel,
  onBackToHome,
  onSubmit,
}: AddNewMorningProps) {
  const [image, setImage] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepImprovement, setSleepImprovement] = useState("");
  const [condition, setCondition] = useState<ConditionLevel | "">("");
  const [success, setSuccess] = useState("");
  const [reflection, setReflection] = useState("");

  const sleepHoursNum = sleepHours ? parseFloat(sleepHours) : NaN;
  const showSleepImprovement = !Number.isNaN(sleepHoursNum) && sleepHoursNum < 7;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const stamped = await applyTimestamp(files[0]).catch(() => fileToBase64(files[0]));
    setImage(stamped);
  };

  const removeImage = () => {
    setImage("");
  };

  const isValid =
    !!sleepHours &&
    !!condition &&
    success.trim().length > 0 &&
    reflection.trim().length > 0 &&
    (!showSleepImprovement || sleepImprovement.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;

    const recordData: MorningFormData = {
      image,
      sleepHours: sleepHoursNum,
      condition: condition as ConditionLevel,
      success: success.trim(),
      reflection: reflection.trim(),
      ...(showSleepImprovement
        ? { sleepImprovement: sleepImprovement.trim() }
        : {}),
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
          <span className="text-sm">모닝 리추얼로 돌아가기</span>
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
        <h2 className="text-xl font-bold text-gray-900 mb-4">모닝 기록</h2>

        {/* 인증 사진 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 모닝리추얼 완료 인증 사진
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

        {/* 수면 시간 + 컨디션 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              수면 시간 (시간)
            </label>
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="예: 7.5"
              min="0"
              max="24"
              step="0.5"
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              컨디션
            </label>
            <div className="relative">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ConditionLevel | "")}
                className="w-full px-4 py-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 appearance-none cursor-pointer"
              >
                <option value="">선택</option>
                <option value="상">상</option>
                <option value="중">중</option>
                <option value="하">하</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 수면 시간 7시간 미만 시 원인 & 개선 방법 */}
        {showSleepImprovement && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              수면이 부족한 원인과 개선할 수 있는 방법
            </label>
            <textarea
              value={sleepImprovement}
              onChange={(e) => setSleepImprovement(e.target.value)}
              placeholder="예: 늦게까지 휴대폰을 본 것이 원인. 잠자기 1시간 전에는 화면을 보지 않기."
              rows={3}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
            />
          </div>
        )}

        {/* 오늘의 작은 성공 (오늘 한 일) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            오늘의 작은 성공 (오늘 한 일)
          </label>
          <textarea
            value={success}
            onChange={(e) => setSuccess(e.target.value)}
            placeholder="오늘 한 일 중 작은 성공을 적어보세요"
            rows={3}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 한 줄 회고 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            한 줄 회고
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="오늘을 한 줄로 돌아본다면?"
            rows={2}
            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 py-4 px-4 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            기록 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
