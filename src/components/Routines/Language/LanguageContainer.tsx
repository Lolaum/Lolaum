"use client";

import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import RecordStudy from "./RecordStudy";
import AddNewLanguage from "./AddNewLanguage";
import StudyPhrase from "./StudyPhrase";
import {
  LanguageRecord,
  LanguageContainerProps,
} from "@/types/routines/language";

export default function LanguageContainer({
  onBackToTimer,
  onBackToHome,
  languageType = "영어",
}: LanguageContainerProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showStudyPhrase, setShowStudyPhrase] = useState(false);

  // 영어 학습 기록 데이터
  const englishRecords: LanguageRecord[] = [
    {
      id: 1,
      date: "1월 21일",
      achievement: "10문, 2개 표현",
      expressions: [
        {
          word: "profound",
          meaning: "깊은, 심오한",
          example: "The book had a profound impact on my life.",
        },
        {
          word: "elaborate",
          meaning: "정교한, 상세한",
          example: "Could you elaborate on that point?",
        },
      ],
      expressionCount: 2,
    },
    {
      id: 2,
      date: "1월 18일",
      achievement: "15문, 3개 표현",
      expressions: [
        {
          word: "pragmatic",
          meaning: "실용적인, 현실적인",
          example: "We need to take a more pragmatic approach.",
        },
        {
          word: "intrinsic",
          meaning: "본질적인, 고유의",
          example: "The painting has intrinsic value.",
        },
        {
          word: "versatile",
          meaning: "다재다능한, 다용도의",
          example: "She is a versatile actress.",
        },
      ],
      expressionCount: 3,
    },
    {
      id: 3,
      date: "1월 14일",
      achievement: "20문, 2개 표현",
      expressions: [
        {
          word: "resilience",
          meaning: "회복력, 탄력성",
          example: "The team showed great resilience in difficult times.",
        },
        {
          word: "coherent",
          meaning: "일관된, 논리적인",
          example: "She presented a coherent argument.",
        },
      ],
      expressionCount: 2,
    },
  ];

  // 언어 학습 기록 데이터 (예: 일본어, 중국어 등)
  const otherLanguageRecords: LanguageRecord[] = [
    {
      id: 1,
      date: "1월 22일",
      achievement: "30문, 3개 표현",
      expressions: [
        {
          word: "頑張る (がんばる)",
          meaning: "노력하다, 힘내다",
          example: "試験に向けて頑張ります。(시험을 위해 노력합니다.)",
        },
        {
          word: "楽しい (たのしい)",
          meaning: "즐겁다, 재미있다",
          example: "日本語の勉強は楽しいです。(일본어 공부는 즐겁습니다.)",
        },
        {
          word: "素晴らしい (すばらしい)",
          meaning: "훌륭하다, 멋지다",
          example: "素晴らしい景色ですね。(멋진 경치네요.)",
        },
      ],
      expressionCount: 3,
    },
    {
      id: 2,
      date: "1월 20일",
      achievement: "25문, 2개 표현",
      expressions: [
        {
          word: "美味しい (おいしい)",
          meaning: "맛있다",
          example: "このラーメンは美味しいです。(이 라면은 맛있습니다.)",
        },
        {
          word: "難しい (むずかしい)",
          meaning: "어렵다",
          example: "漢字は難しいです。(한자는 어렵습니다.)",
        },
      ],
      expressionCount: 2,
    },
    {
      id: 3,
      date: "1월 17일",
      achievement: "20문, 2개 표현",
      expressions: [
        {
          word: "大切 (たいせつ)",
          meaning: "소중하다, 중요하다",
          example: "家族は大切です。(가족은 소중합니다.)",
        },
        {
          word: "便利 (べんり)",
          meaning: "편리하다",
          example: "このアプリは便利です。(이 앱은 편리합니다.)",
        },
      ],
      expressionCount: 2,
    },
  ];

  // languageType에 따라 데이터 선택
  const languageRecords =
    languageType === "영어" ? englishRecords : otherLanguageRecords;

  // 이번 달 학습한 날 계산
  const studiedDays = 0;

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return <AddNewLanguage onCancel={() => setShowAddRecord(false)} onBackToHome={onBackToHome} />;
    }

    // 메인 화면
    return (
      <>
        {/* 뒤로가기 버튼 및 x버튼 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBackToTimer}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
            <h1 className="text-xl font-bold text-gray-900">
              {languageType === "영어" ? "영어 학습" : "언어 학습"}
            </h1>
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
            onClick={() => setShowStudyPhrase(true)}
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

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">{renderContent()}</div>
      {showStudyPhrase && (
        <StudyPhrase
          languageRecords={languageRecords}
          onClose={() => setShowStudyPhrase(false)}
        />
      )}
    </>
  );
}
