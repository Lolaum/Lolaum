"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import RecordExercise from "./RecordExercise";
import AddNewExercise from "./AddNewExercise";
import {
  ExerciseRecord,
  ExerciseContainerProps,
} from "@/types/routines/exercise";

export default function ExerciseContainer({
  onBackToTimer,
}: ExerciseContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);

  // 운동 기록 데이터
  const exerciseRecords: ExerciseRecord[] = [
    {
      id: 1,
      date: "1월 20일",
      exerciseName: "필라테스",
      duration: 50,
      images: [],
      achievement: "코어 강화에 집중. 몸의 중심이 단단해지는 느낌.",
    },
    {
      id: 2,
      date: "1월 17일",
      exerciseName: "달리기",
      duration: 25,
      images: [],
      achievement: "짧지만 집중도 높은 운동.",
    },
    {
      id: 3,
      date: "1월 15일",
      exerciseName: "웨이트 트레이닝",
      duration: 60,
      images: [],
      achievement: "스쿼트와 데드리프트 중심. 자세에 더 신경 써야겠다.",
    },
  ];

  // 이번 달 통계 계산
  const exerciseCount = exerciseRecords.length;
  const totalMinutes = exerciseRecords.reduce(
    (sum, record) => sum + record.duration,
    0,
  );

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return <AddNewExercise onCancel={() => setShowAddRecord(false)} />;
    }

    // 메인 화면
    return (
      <>
        {/* 뒤로가기 버튼 */}
        <button
          type="button"
          onClick={onBackToTimer}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm">타이머로 돌아가기</span>
        </button>

        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">운동 관리</h1>
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
                  {exerciseCount}
                </div>
                <div className="text-sm text-gray-500">운동 횟수</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  {totalMinutes}분
                </div>
                <div className="text-sm text-gray-500">총 운동 시간</div>
              </div>
            </div>
          </div>

          {/* 운동 달력 보기 */}
          <button
            type="button"
            className="w-full flex items-center justify-between bg-gradient-to-r from-[#fef7e6] to-[#fef4dc] rounded-2xl p-6 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fdefc8] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#d4a574]" />
              </div>
              <div className="text-left">
                <div className="text-base font-semibold text-gray-900">
                  운동 달력 보기
                </div>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* 운동 기록 섹션 */}
        <RecordExercise exerciseRecords={exerciseRecords} />
      </>
    );
  };

  return <div className="w-full max-w-4xl mx-auto">{renderContent()}</div>;
}
