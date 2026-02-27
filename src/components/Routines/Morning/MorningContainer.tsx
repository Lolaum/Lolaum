"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import RecordMorning from "./RecordMorning";
import AddNewMorning from "./AddNewMorning";
import { MorningRecord, MorningContainerProps } from "@/types/routines/morning";

export default function MorningContainer({
  onBackToTimer,
  onBackToHome,
}: MorningContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);

  // 모닝 리추얼 기록 데이터
  const morningRecords: MorningRecord[] = [
    {
      id: 1,
      date: "1월 21일",
      image: "",
      condition: 85,
      successAndReflection: "아침 일찍 일어나서 상쾌한 하루를 시작했다.",
      gift: "좋아하는 커피 한 잔",
    },
    {
      id: 2,
      date: "1월 20일",
      image: "",
      condition: 70,
      successAndReflection: "어제보다 일찍 일어났다. 작은 성공!",
      gift: "오후에 산책하기",
    },
    {
      id: 3,
      date: "1월 19일",
      image: "",
      condition: 90,
      successAndReflection: "명상과 스트레칭으로 몸과 마음을 깨웠다.",
      gift: "맛있는 브런치",
    },
  ];

  // 이번 달 통계 계산
  const recordCount = morningRecords.length;
  const averageCondition = Math.round(
    morningRecords.reduce((sum, record) => sum + record.condition, 0) /
      morningRecords.length,
  );

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return (
        <AddNewMorning
          onCancel={() => setShowAddRecord(false)}
          onBackToHome={onBackToHome}
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

        {/* 히어로 헤더 */}
        <div
          className="rounded-3xl p-5 mb-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #c99315 0%, #eab32e 60%, #ff9c28 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">모닝 리추얼</p>
            <h1 className="text-xl font-bold mb-4">🌅 오늘 하루를 시작해요</h1>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{recordCount}</p>
                <p className="text-white/75 text-xs mt-0.5">기록한 날</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{averageCondition}<span className="text-sm font-medium">%</span></p>
                <p className="text-white/75 text-xs mt-0.5">평균 컨디션</p>
              </div>
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
            style={{ background: "linear-gradient(135deg, #c99315 0%, #eab32e 100%)" }}
          >
            + 오늘 모닝 기록하기
          </button>
        </div>

        {/* 모닝 기록 섹션 */}
        <RecordMorning morningRecords={morningRecords} />
      </>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {renderContent()}
    </div>
  );
}
