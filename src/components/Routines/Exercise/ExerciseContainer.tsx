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
  onBackToHome,
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
      return <AddNewExercise onCancel={() => setShowAddRecord(false)} onBackToHome={onBackToHome} />;
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

        {/* 히어로 헤더 */}
        <div
          className="rounded-3xl p-5 mb-5 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e07800 0%, #ff8900 60%, #ffa040 100%)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">운동 리추얼</p>
            <h1 className="text-xl font-bold mb-4">운동 기록 관리</h1>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{exerciseCount}</p>
                <p className="text-white/75 text-xs mt-0.5">이번 달 횟수</p>
              </div>
              <div className="bg-white/20 rounded-2xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{totalMinutes}<span className="text-sm font-medium ml-0.5">분</span></p>
                <p className="text-white/75 text-xs mt-0.5">총 운동 시간</p>
              </div>
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
        <RecordExercise exerciseRecords={exerciseRecords} />
      </>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      {renderContent()}
    </div>
  );
}
