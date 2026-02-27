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
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
      {/* 헤더 */}
      <h2 className="text-base font-bold text-gray-800 mb-4">새 루틴 만들기</h2>

      {/* 루틴 선택 */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          루틴 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedRoutine}
            onChange={(e) => setSelectedRoutine(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
          >
            <option value="">루틴을 선택하세요</option>
            {routineOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-gray-300">매일 반복할 습관을 선택해주세요</p>
      </div>

      {/* 기간 설정 */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          시작일
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
        />
        <p className="mt-1.5 text-xs text-gray-300">종료일을 지정하지 않으면 계속 진행됩니다</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        )}
        <button
          className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
          style={{ backgroundColor: "#eab32e" }}
        >
          생성하기
        </button>
      </div>
    </div>
  );
}
