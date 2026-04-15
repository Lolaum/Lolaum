"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Loader2 } from "lucide-react";
import RecordMorning from "./RecordMorning";
import AddNewMorning from "./AddNewMorning";
import { MorningRecord, MorningContainerProps, MorningFormData } from "@/types/routines/morning";
import { createRitualRecordAuto, getMyRitualRecords } from "@/api/ritual-record";
import type { MorningRecordData, Json } from "@/types/supabase";

export default function MorningContainer({
  onBackToTimer,
  onBackToHome,
}: MorningContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [morningRecords, setMorningRecords] = useState<MorningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRitualRecords({ routineType: "morning" });
    if (data) {
      const records: MorningRecord[] = data.map((r) => {
        const d = r.record_data as unknown as MorningRecordData;
        const date = new Date(r.record_date);
        return {
          id: r.id as unknown as number,
          date: `${date.getMonth() + 1}월 ${date.getDate()}일`,
          image: d.image ?? "",
          sleepHours: d.sleepHours,
          condition: d.condition,
          successAndReflection: d.successAndReflection,
          gift: d.gift,
        };
      });
      setMorningRecords(records);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubmit = async (formData: MorningFormData) => {
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    const recordData: MorningRecordData = {
      sleepHours: formData.sleepHours,
      condition: formData.condition,
      successAndReflection: formData.successAndReflection,
      gift: formData.gift,
      image: formData.image || undefined,
    };
    const { error } = await createRitualRecordAuto({
      routineType: "morning",
      recordDate: today,
      recordData: recordData as unknown as Json,
    });
    setSubmitting(false);
    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }
    setShowAddRecord(false);
    fetchRecords();
  };

  // 이번 달 통계 계산
  const recordCount = morningRecords.length;
  const averageSleepHours = recordCount > 0
    ? (morningRecords.reduce((sum, record) => sum + record.sleepHours, 0) / recordCount).toFixed(1)
    : "0";

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return (
        <AddNewMorning
          onCancel={() => setShowAddRecord(false)}
          onBackToHome={onBackToHome}
          onSubmit={handleSubmit}
        />
      );
    }

    // 메인 화면
    return (
      <>
        {/* 네비게이션 */}
        <div className="flex items-center justify-end mb-4">
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
          <p className="text-xs text-gray-400 font-medium mb-0.5">모닝 리추얼</p>
          <h1 className="text-lg font-bold text-gray-900 mb-4">오늘 하루를 시작해요</h1>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{recordCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">기록한 날</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{averageSleepHours}<span className="text-sm font-medium">h</span></p>
              <p className="text-xs text-gray-400 mt-0.5">평균 수면</p>
            </div>
          </div>
        </div>

        {/* 구글밋 링크 */}
        <button
          type="button"
          className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-900">모닝리추얼 구글밋 참여</p>
            <p className="text-xs text-gray-400 mt-0.5">클릭하여 구글 미트에 참여하세요</p>
          </div>
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 기록 추가 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAddRecord(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: "#eab32e" }}
          >
            + 오늘 모닝 기록하기
          </button>
        </div>

        {/* 모닝 기록 섹션 */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <Loader2 size={20} className="animate-spin mx-auto mb-2" />
            <p className="text-xs">기록을 불러오는 중...</p>
          </div>
        ) : (
          <RecordMorning morningRecords={morningRecords} />
        )}
      </>
    );
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {renderContent()}
      </div>
      {submitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
            <Loader2 size={28} className="animate-spin text-yellow-500" />
            <p className="text-sm font-medium text-gray-700">기록 저장 중...</p>
          </div>
        </div>
      )}
    </>
  );
}
