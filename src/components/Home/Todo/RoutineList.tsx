"use client";
import React, { useState } from "react";
import routine_mock from "@/mock/routinemock";
import GenerateRoutine from "./GenerateRoutine";
import { PROGRESS_COLORS } from "@/constants/constant";

interface RoutineListProps {
  selectedDate: Date;
  onTaskClick: (title: string, color: string) => void;
}

export default function RoutineList({
  selectedDate,
  onTaskClick,
}: RoutineListProps) {
  const [routines, setRoutines] = useState(routine_mock);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showGenerateRoutine, setShowGenerateRoutine] = useState(false);

  // 고유한 태그 목록 추출
  const tags = [...new Set(routines.map((r) => r.tag))];

  // 선택된 태그로 필터링 (없으면 전체)
  const filteredRoutines = selectedTag
    ? routines.filter((r) => r.tag === selectedTag)
    : routines;

  const handleToggle = (id: number) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id
          ? { ...routine, completed: !routine.completed }
          : routine,
      ),
    );
  };

  // 예시: routine_mock에 count, totalCount 필드가 있다고 가정
  // 실제 데이터에 맞게 수정 필요
  // routine.count: 현재 달성 횟수, routine.totalCount: 목표 횟수

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* 진행중 루틴 헤더 */}
      <div className="mb-6">
        <span className="text-base font-semibold text-gray-500">
          진행 중인 루틴
        </span>
        <span className="ml-2 text-base text-gray-400">
          ({filteredRoutines.length})
        </span>
      </div>

      {/* 루틴 리스트 */}
      <ul className="space-y-4">
        {filteredRoutines.map((routine, idx) => {
          // 임시 진행도: id를 기반으로 예시값 생성 (실제 데이터에 맞게 수정 필요)
          const total = 5;
          const count = routine.id % (total + 1);
          const percent = Math.min(100, Math.round((count / total) * 100));
          const colorInfo = PROGRESS_COLORS[idx % PROGRESS_COLORS.length];
          return (
            <li
              key={routine.id}
              onClick={() => onTaskClick(routine.title, colorInfo.hex)}
              className="bg-gray-50 rounded-xl px-6 py-4 flex flex-col gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-semibold text-gray-900">
                  {routine.title}
                </span>
                <span className="text-base font-semibold text-gray-400">
                  {count}/{total}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${colorInfo.class}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {/* 루틴 생성 폼 */}
      {showGenerateRoutine && (
        <GenerateRoutine onClose={() => setShowGenerateRoutine(false)} />
      )}
      <button
        onClick={() => setShowGenerateRoutine(true)}
        className="w-90 mt-6 rounded-lg bg-yellow-500 px-6 py-3 text-base font-bold text-white shadow hover:bg-yellow-500 transition-colors"
      >
        루틴 생성하기
      </button>
    </div>
  );
}
