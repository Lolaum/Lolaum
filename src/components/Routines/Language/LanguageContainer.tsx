"use client";

import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import RecordStudy from "./RecordStudy";
import AddNewLanguage from "./AddNewLanguage";
import {
  LanguageRecord,
  LanguageContainerProps,
} from "@/types/routines/language";

export default function LanguageContainer({
  onBackToTimer,
}: LanguageContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);

  // 임시 학습 기록 데이터
  const languageRecords: LanguageRecord[] = [
    {
      id: 1,
      date: "1월 21일",
      word: "profound",
      meanings: ["깊은", "심오한"],
      examples: [
        "The book had a profound impact on my life.",
        "She gave a profound answer to a difficult question.",
      ],
      expressionCount: 2,
    },
    {
      id: 2,
      date: "1월 21일",
      word: "elaborate",
      meanings: ["정교한", "상세한", "자세히 설명하다"],
      examples: [
        "Could you elaborate on that point?",
        "The plan was elaborate and well thought out.",
      ],
      expressionCount: 3,
    },
    {
      id: 3,
      date: "1월 18일",
      word: "pragmatic",
      meanings: ["실용적인", "현실적인"],
      examples: [
        "We need to take a more pragmatic approach.",
        "She's very pragmatic about her career.",
        "The solution was pragmatic rather than idealistic.",
      ],
      expressionCount: 3,
    },
    {
      id: 4,
      date: "1월 14일",
      word: "intrinsic",
      meanings: ["본질적인", "고유의"],
      examples: [
        "The painting has intrinsic value.",
        "Her intrinsic motivation drives her success.",
        "These rights are intrinsic to all human beings.",
      ],
      expressionCount: 3,
    },
    {
      id: 5,
      date: "1월 14일",
      word: "versatile",
      meanings: ["다재다능한", "다용도의"],
      examples: ["She is a versatile actress.", "This tool is very versatile."],
      expressionCount: 2,
    },
    {
      id: 6,
      date: "1월 11일",
      word: "resilience",
      meanings: ["회복력", "탄력성"],
      examples: [
        "The team showed great resilience in difficult times.",
        "Building resilience is important for mental health.",
        "Her resilience helped her overcome many obstacles.",
        "The city's resilience after the disaster was remarkable.",
      ],
      expressionCount: 4,
    },
  ];

  // 이번 달 학습한 날 계산
  const studiedDays = 0;

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return <AddNewLanguage onCancel={() => setShowAddRecord(false)} />;
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
            <h1 className="text-xl font-bold text-gray-900">언어 학습</h1>
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
            <div className="text-4xl font-bold text-gray-900 mb-1">
              {studiedDays}
            </div>
            <div className="text-sm text-gray-500">학습한 날</div>
          </div>

          {/* 단어 카드로 복습하기 */}
          <button
            type="button"
            className="w-full flex items-center justify-between bg-gradient-to-r from-[#fef7e6] to-[#fef4dc] rounded-2xl p-6 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fdefc8] rounded-xl flex items-center justify-center">
                <Grid3x3 className="w-6 h-6 text-[#d4a574]" />
              </div>
              <div className="text-left">
                <div className="text-base font-semibold text-gray-900 mb-1">
                  단어 카드로 복습하기
                </div>
                <div className="text-sm text-gray-600">14개의 표현</div>
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

        {/* 학습 기록 섹션 */}
        <RecordStudy languageRecords={languageRecords} />
      </>
    );
  };

  return <div className="w-full max-w-4xl mx-auto">{renderContent()}</div>;
}
