"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Loader2 } from "lucide-react";
import RecordExercise from "./RecordExercise";
import AddNewExercise from "./AddNewExercise";
import {
  ExerciseRecord,
  ExerciseContainerProps,
  ExerciseFormData,
} from "@/types/routines/exercise";
import { createRitualRecordAuto, getMyRitualRecords } from "@/actions/ritual-record";
import type { ExerciseRecordData, Json } from "@/types/supabase";

export default function ExerciseContainer({
  onBackToTimer,
  onBackToHome,
  certificationPhotos,
  elapsedSeconds = 0,
}: ExerciseContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(!!certificationPhotos?.length);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
          exerciseName: d.exerciseName,
          duration: d.duration,
          images: d.images ?? [],
          achievement: d.achievement ?? "",
        };
      });
      setExerciseRecords(records);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (formData: ExerciseFormData) => {
    const today = new Date().toISOString().split("T")[0];
    const recordData: ExerciseRecordData = {
      exerciseName: formData.exerciseName,
      duration: formData.duration,
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
    setShowAddRecord(false);
    fetchRecords();
  };

  // 이번 달 통계 계산
  const exerciseCount = exerciseRecords.length;
  const totalMinutes = exerciseRecords.reduce(
    (sum, record) => sum + record.duration,
    0,
  );

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return (
        <AddNewExercise
          onCancel={() => setShowAddRecord(false)}
          onBackToHome={onBackToHome}
          onSubmit={handleSubmit}
          initialImages={certificationPhotos}
          initialDuration={elapsedSeconds > 0 ? Math.round(elapsedSeconds / 60) : undefined}
        />
      );
    }

    // 메인 화면
    return (
      <>
        {/* 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToTimer}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            타이머로
          </button>
          <button
            type="button"
            onClick={onBackToHome}
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{exerciseCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">이번 달 횟수</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalMinutes}<span className="text-sm font-medium ml-0.5">분</span></p>
              <p className="text-xs text-gray-400 mt-0.5">총 운동 시간</p>
            </div>
          </div>
        </div>

        {/* 기록 추가 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAddRecord(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: "#ff8900" }}
          >
            + 오늘 운동 기록하기
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
      </>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {renderContent()}
    </div>
  );
}
