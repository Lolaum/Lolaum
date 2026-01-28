"use client";

import { useState } from "react";

interface GenerateRoutineProps {
  onClose?: () => void;
}

const routineOptions = [
  "모닝리추얼",
  "운동리추얼",
  "독서리추얼",
  "글쓰기리추얼",
  "영어리추얼",
  "언어리추얼",
  "자산관리리추얼",
  "원서읽기 리추얼",
];

export default function GenerateRoutine({ onClose }: GenerateRoutineProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">새 루틴 만들기</h2>
      </div>

      {/* 루틴 선택 */}
      <div className="mb-6">
        <label className="block mb-2">
          <span className="text-base font-semibold text-gray-700">루틴</span>
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedRoutine}
            onChange={(e) => setSelectedRoutine(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-base text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">루틴을 선택하세요</option>
            {routineOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          매일 반복할 습관을 선택해주세요
        </p>
      </div>

      {/* 기간 설정 */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-700 mb-4">
          기간 설정
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">시작일 ~ 종료일</div>
        </div>
        <div className="mt-3 relative">
          <input
            type="text"
            placeholder="남겨를 선택하세요"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-base text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          종료일을 지정하지 않으면 계속 진행됩니다
        </p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg border border-gray-200 text-base font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        )}
        <button className="flex-1 px-6 py-3 rounded-lg bg-yellow-500 text-base font-bold text-white shadow hover:bg-yellow-600 transition-colors">
          생성하기
        </button>
      </div>
    </div>
  );
}
