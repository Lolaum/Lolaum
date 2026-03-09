"use client";

import React, { useState } from "react";
import routine_mock from "@/mock/routinemock";
import GenerateRoutine from "./GenerateRoutine";
import { Plus, X, Flame, ChevronRight } from "lucide-react";
import { RoutineListProps } from "@/types/home/todo";

const TAG_COLORS: Record<string, { color: string; bgColor: string }> = {
  운동:     { color: "#ff8900", bgColor: "#fff4e5" },
  영어:     { color: "#0ea5e9", bgColor: "#f0f9ff" },
  독서:     { color: "#6366f1", bgColor: "#eef2ff" },
  모닝:     { color: "#eab32e", bgColor: "#fefce8" },
  제2외국어: { color: "#10b981", bgColor: "#ecfdf5" },
  원서:     { color: "#8b5cf6", bgColor: "#f5f3ff" },
  자산관리: { color: "#10b981", bgColor: "#ecfdf5" },
};

const DEFAULT_COLOR = { color: "#6b7280", bgColor: "#f3f4f6" };

export default function RoutineList({
  selectedDate,
  onTaskClick,
}: RoutineListProps) {
  const [routines, setRoutines] = useState(routine_mock);
  const [showGenerateRoutine, setShowGenerateRoutine] = useState(false);

  const handleToggle = (id: number) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id
          ? { ...routine, completed: !routine.completed }
          : routine,
      ),
    );
  };

  const completedCount = routines.filter((r) => r.completed).length;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">진행 중인 루틴</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {completedCount}/{routines.length}
          </span>
        </div>
        <button
          onClick={() => setShowGenerateRoutine(!showGenerateRoutine)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
          style={{ backgroundColor: "#eab32e" }}
        >
          {showGenerateRoutine ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* 루틴 생성 폼 */}
      {showGenerateRoutine && (
        <div className="mb-4">
          <GenerateRoutine onClose={() => setShowGenerateRoutine(false)} />
        </div>
      )}

      {/* 루틴 리스트 */}
      <div className="space-y-2.5">
        {routines.map((routine) => {
          const colors = TAG_COLORS[routine.tag] || DEFAULT_COLOR;
          const total = 5;
          const count = routine.id % (total + 1);
          const percent = Math.min(100, Math.round((count / total) * 100));

          return (
            <div
              key={routine.id}
              onClick={() => onTaskClick(routine.title, colors.color)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ borderLeft: `4px solid ${routine.completed ? "#e5e7eb" : colors.color}` }}
            >
              <div className="flex items-center gap-3">
                {/* 완료 체크 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(routine.id);
                  }}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: routine.completed ? colors.color : "#d1d5db",
                    backgroundColor: routine.completed ? colors.color : "transparent",
                  }}
                >
                  {routine.completed && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* 루틴 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-sm font-semibold ${routine.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
                    >
                      {routine.title}
                    </span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bgColor, color: colors.color }}
                    >
                      {routine.tag}
                    </span>
                  </div>

                  {/* 진행도 바 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: routine.completed ? "#d1d5db" : colors.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{count}/{total}</span>
                  </div>
                </div>

                {/* 연속 달성 + 화살표 */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {count > 0 && !routine.completed && (
                    <div className="flex items-center gap-0.5">
                      <Flame size={11} style={{ color: colors.color }} />
                      <span className="text-[10px] font-medium" style={{ color: colors.color }}>
                        {count}일
                      </span>
                    </div>
                  )}
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
