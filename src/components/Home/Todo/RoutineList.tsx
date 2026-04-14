"use client";

import React, { useState, useEffect, useCallback } from "react";
import GenerateRoutine from "./GenerateRoutine";
import { Plus, X, Flame, ChevronRight, Trash2 } from "lucide-react";
import { RoutineListProps } from "@/types/home/todo";
import { getMyRoutines, deleteRoutine } from "@/api/routine";
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
  selectedDate,
  onTaskClick,
}: RoutineListProps) {
  const [routines, setRoutines] = useState<ChallengeRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateRoutine, setShowGenerateRoutine] = useState(false);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRoutines();
    setRoutines(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    const { error } = await deleteRoutine(id);
    if (error) {
      fetchRoutines();
    }
  };

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
            진행 중인 루틴
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

      {/* 루틴 생성 바텀시트 */}
      {showGenerateRoutine && (
        <GenerateRoutine
          onClose={() => setShowGenerateRoutine(false)}
          onCreated={handleCreated}
        />
      )}

      {/* 루틴 리스트 */}
      {loading ? (
        <p className="text-sm text-gray-300 text-center py-4">불러오는 중...</p>
      ) : routines.length === 0 ? (
        <p className="text-sm text-gray-200 text-center py-4">
          등록된 루틴이 없습니다
        </p>
      ) : (
        <div className="space-y-2.5">
          {routines.map((routine) => {
            const tag = ROUTINE_TAG[routine.routine_type];
            const title = ROUTINE_TYPE_LABEL[routine.routine_type];
            const colors = TAG_COLORS[tag] || DEFAULT_COLOR;

            return (
              <div
                key={routine.id}
                onClick={() => onTaskClick(title, colors.color)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  borderLeft: `4px solid ${colors.color}`,
                }}
              >
                <div className="flex items-center gap-3">
                  {/* 루틴 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {title}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: colors.bgColor,
                          color: colors.color,
                        }}
                      >
                        {tag}
                      </span>
                    </div>
                  </div>

                  {/* 삭제 + 화살표 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, routine.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      aria-label="삭제"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
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
