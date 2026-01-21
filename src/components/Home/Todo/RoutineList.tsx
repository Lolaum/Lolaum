"use client";
import React, { useState } from "react";
import routine_mock from "@/mock/routinemock";

interface RoutineListProps {
  selectedDate: Date;
  onTaskClick: (title: string) => void;
}

export default function RoutineList({
  selectedDate,
  onTaskClick,
}: RoutineListProps) {
  const [routines, setRoutines] = useState(routine_mock);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

  return (
    <div>
      {/* 태그 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedTag(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedTag === null
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedTag === tag
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tag}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">
          {filteredRoutines.filter((r) => r.completed).length}/
          {filteredRoutines.length}
          완료
        </span>
      </div>

      {/* 루틴 리스트 */}
      <ul className="space-y-2">
        {filteredRoutines.map((routine) => (
          <li
            key={routine.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
            onClick={() => onTaskClick(routine.title)}
          >
            {/* 체크박스 */}
            <input
              type="checkbox"
              checked={routine.completed}
              onChange={() => handleToggle(routine.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-gray-300"
            />

            {/* 루틴 제목 */}
            <span
              className={`flex-1 text-sm ${
                routine.completed
                  ? "text-gray-400 line-through"
                  : "text-gray-900"
              }`}
            >
              {routine.title}
            </span>

            {/* 시간 */}
            <span className="text-xs text-gray-400">{routine.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
