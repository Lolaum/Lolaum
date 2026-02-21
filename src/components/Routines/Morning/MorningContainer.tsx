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
        {/* 뒤로가기 버튼 및 x버튼 */}
        <div className="flex items-center justify-end mb-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">모닝 리추얼</h1>
            <button
              type="button"
              onClick={() => setShowAddRecord(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              기록 추가
            </button>
          </div>

          {/* 구글밋 링크 */}
          <button
            type="button"
            className="w-full flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-xl p-4 mb-4 transition-all duration-200 hover:shadow-md"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-blue-900">
                모닝리추얼 구글밋으로 바로가기
              </p>
              <p className="text-xs text-blue-700">
                클릭하여 구글 미트에 참여하세요
              </p>
            </div>
          </button>

          {/* 이번 달 통계 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-sm">이번 달</span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {recordCount}
                </div>
                <div className="text-sm text-gray-500">기록한 날</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {averageCondition}%
                </div>
                <div className="text-sm text-gray-500">평균 컨디션</div>
              </div>
            </div>
          </div>
        </div>

        {/* 모닝 기록 섹션 */}
        <RecordMorning morningRecords={morningRecords} />
      </>
    );
  };

  return <div className="w-full max-w-4xl mx-auto">{renderContent()}</div>;
}
