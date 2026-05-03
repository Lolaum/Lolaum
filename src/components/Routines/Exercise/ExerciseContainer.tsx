"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import RecordExercise from "./RecordExercise";
import AddNewExercise from "./AddNewExercise";
import {
  ExerciseRecord,
  ExerciseFormData,
} from "@/types/routines/exercise";
import { createRitualRecordAuto, getMyRitualRecords } from "@/api/ritual-record";
import type { ExerciseRecordData, Json } from "@/types/supabase";

interface ExerciseContainerProps {
  mode?: "main" | "new";
}

export default function ExerciseContainer({ mode = "main" }: ExerciseContainerProps) {
  const router = useRouter();
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const goHome = () => router.push("/home");
  const goMain = () => router.push("/home/exercise");
  const goNew = () => router.push("/home/exercise/new");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRitualRecords({ routineType: "exercise" });
    if (data) {
      const records: ExerciseRecord[] = data.map((r) => {
        const d = r.record_data as unknown as ExerciseRecordData;
        const date = new Date(r.record_date);
        return {
          id: r.id as unknown as number,
          date: `${date.getMonth() + 1}월 ${date.getDate()}일`,
          recordType: d.recordType ?? "exercise",
          exerciseName: d.exerciseName,
          duration: d.duration,
          macros: d.macros,
          images: d.images ?? [],
          achievement: d.achievement ?? "",
        };
      });
      setExerciseRecords(records);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mode === "main") fetchRecords();
  }, [fetchRecords, mode]);

  const handleSubmit = async (formData: ExerciseFormData) => {
    const today = new Date().toISOString().split("T")[0];
    const recordData: ExerciseRecordData = {
      recordType: formData.recordType,
      exerciseName: formData.exerciseName,
      duration: formData.duration,
      macros: formData.macros,
      images: formData.images,
      achievement: formData.achievement,
    };
    const { error } = await createRitualRecordAuto({
      routineType: "exercise",
      recordDate: today,
      recordData: recordData as unknown as Json,
    });
    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }
    goMain();
  };

  // 운동 기록만 합산 (식단 제외)
  const exerciseOnly = exerciseRecords.filter((r) => r.recordType === "exercise");
  const exerciseCount = exerciseOnly.length;
  const totalMinutes = exerciseOnly.reduce((sum, r) => sum + r.duration, 0);
  const dietCount = exerciseRecords.filter((r) => r.recordType === "diet").length;

  if (mode === "new") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <AddNewExercise
          onCancel={goMain}
          onBackToHome={goHome}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {/* 네비게이션 */}
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={goHome}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-0.5">운동 리추얼</p>
        <h1 className="text-lg font-bold text-gray-900 mb-4">운동 기록 관리</h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{exerciseCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">운동 횟수</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalMinutes}<span className="text-sm font-medium ml-0.5">분</span></p>
            <p className="text-xs text-gray-400 mt-0.5">총 운동 시간</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{dietCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">식단 기록</p>
          </div>
        </div>
      </div>

      {/* 기록 추가 버튼 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={goNew}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          style={{ backgroundColor: "#ff8900" }}
        >
          + 오늘 운동/식단 기록하기
        </button>
      </div>

      {/* 운동 기록 섹션 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">기록을 불러오는 중...</p>
        </div>
      ) : (
        <RecordExercise exerciseRecords={exerciseRecords} />
      )}
    </div>
  );
}
