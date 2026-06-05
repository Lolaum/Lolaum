"use client";

import { useState, useCallback } from "react";
import GenerateRoutine from "./GenerateRoutine";
import { Plus, X, ChevronRight } from "lucide-react";
import { RoutineListProps } from "@/types/home/todo";
import { getMyRoutines } from "@/api/routine";
import type { ChallengeRegistration, RoutineTypeDB } from "@/types/supabase";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";

const TAG_COLORS: Record<string, { color: string; bgColor: string }> = {
  운동: { color: "#ff8900", bgColor: "#fff4e5" },
  영어: { color: "#0ea5e9", bgColor: "#f0f9ff" },
  독서: { color: "#6366f1", bgColor: "#eef2ff" },
  모닝: { color: "#eab32e", bgColor: "#fefce8" },
  제2외국어: { color: "#10b981", bgColor: "#ecfdf5" },
  원서: { color: "#8b5cf6", bgColor: "#f5f3ff" },
  자산관리: { color: "#10b981", bgColor: "#ecfdf5" },
  기록: { color: "#f43f5e", bgColor: "#fff1f2" },
};

const ROUTINE_TAG: Record<RoutineTypeDB, string> = {
  morning: "모닝",
  exercise: "운동",
  reading: "독서",
  english: "영어",
  second_language: "제2외국어",
  recording: "기록",
  finance: "자산관리",
  english_book: "원서",
};

const DEFAULT_COLOR = { color: "#6b7280", bgColor: "#f3f4f6" };

export default function RoutineList({
  onTaskClick,
  initialRoutines,
  routineCompletionMap = {},
  isPastDate = false,
  isOutsidePeriod = false,
  totalRoutineDays,
}: RoutineListProps) {
  const isDisabled = isPastDate || isOutsidePeriod;
  // 목표 일수 = 평일 수 + 3 보너스(선언/중간회고/최종회고). API 미수신 시 fallback 18
  const goalDays = (totalRoutineDays ?? 15) + 3;
  const [routines, setRoutines] = useState<ChallengeRegistration[]>(
    initialRoutines ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [showGenerateRoutine, setShowGenerateRoutine] = useState(false);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRoutines();
    setRoutines(data || []);
    setLoading(false);
  }, []);

  const handleCreated = () => {
    setShowGenerateRoutine(false);
    fetchRoutines();
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            진행 중인 리추얼
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {routines.length}
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

      {/* 리추얼 생성 바텀시트 */}
      {showGenerateRoutine && (
        <GenerateRoutine
          onClose={() => setShowGenerateRoutine(false)}
          onCreated={handleCreated}
          existingTypes={routines.map((r) => r.routine_type)}
        />
      )}

      {/* 리추얼 리스트 */}
      {loading ? (
        <p className="text-sm text-gray-300 text-center py-4">불러오는 중...</p>
      ) : routines.length === 0 ? (
        <p className="text-sm text-gray-200 text-center py-4">
          등록된 리추얼이 없습니다
        </p>
      ) : (
        <div className="space-y-2.5">
          {routines.map((routine) => {
            const tag = ROUTINE_TAG[routine.routine_type];
            const title = ROUTINE_TYPE_LABEL[routine.routine_type];
            const colors = TAG_COLORS[tag] || DEFAULT_COLOR;

            const completedDays =
              routineCompletionMap[routine.routine_type] ?? 0;
            const fillPercent = Math.min(
              Math.round((completedDays / goalDays) * 100),
              100,
            );

            return (
              <div
                key={routine.id}
                onClick={() => !isDisabled && onTaskClick(title, colors.color)}
                className={`relative overflow-hidden rounded-2xl p-4 shadow-sm border border-gray-100 transition-all duration-200 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                }`}
                style={{
                  borderLeft: `4px solid ${colors.color}`,
                  backgroundColor: "#fff",
                }}
              >
                {/* 달성률 배경 채우기 */}
                <div
                  className="absolute inset-0 transition-all duration-500 pointer-events-none"
                  style={{
                    width: `${fillPercent}%`,
                    backgroundColor: colors.bgColor,
                  }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  {/* 리추얼 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {title}
                      </span>
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
