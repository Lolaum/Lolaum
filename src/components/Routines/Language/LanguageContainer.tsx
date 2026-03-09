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

  const isEnglish = languageType === "영어";
  const accentColor = isEnglish ? "#0ea5e9" : "#10b981";
  const accentBg = isEnglish ? "#f0f9ff" : "#ecfdf5";

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

  // 이번 달 학습한 날 & 총 표현 수 계산
  const studiedDays = languageRecords.length;
  const totalExpressions = languageRecords.reduce(
    (sum, r) => sum + r.expressionCount,
    0,
  );

  const renderContent = () => {
    // 새 기록 추가하기 화면
    if (showAddRecord) {
      return (
        <AddNewLanguage
          onCancel={() => setShowAddRecord(false)}
          onBackToHome={onBackToHome}
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
            <svg
              className="h-4 w-4"
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
            타이머로
          </button>
          <button
            type="button"
            onClick={onBackToHome}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
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
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            {isEnglish ? "영어 리추얼" : "제2외국어 리추얼"}
          </p>
          <h1 className="text-lg font-bold text-gray-900 mb-4">
            {isEnglish ? "영어 학습 기록" : "제2외국어 학습 기록"}
          </h1>
          <div className="flex gap-3">
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: accentBg }}
            >
              <p className="text-2xl font-bold text-gray-900">{studiedDays}</p>
              <p className="text-xs text-gray-400 mt-0.5">이번 달 학습일</p>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: accentBg }}
            >
              <p className="text-2xl font-bold text-gray-900">
                {totalExpressions}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">공부한 표현</p>
            </div>
          </div>
        </div>

        {/* 단어 카드 복습 */}
        <button
          type="button"
          onClick={() => setShowStudyPhrase(true)}
          className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isEnglish ? "#f0f9ff" : "#ecfdf5" }}
            >
              <Grid3x3
                className="w-5 h-5"
                style={{ color: isEnglish ? "#0ea5e9" : "#10b981" }}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">
                단어 카드로 복습하기
              </p>
              <p className="text-xs text-gray-400 mt-0.5">14개의 표현</p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-gray-300"
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

        {/* 기록 추가 버튼 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAddRecord(true)}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            + 오늘 학습 기록하기
          </button>
        </div>

        {/* 학습 기록 섹션 */}
        <RecordStudy languageRecords={languageRecords} />
      </>
    );
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        {renderContent()}
      </div>
      {showStudyPhrase && (
        <StudyPhrase
          languageRecords={languageRecords}
          onClose={() => setShowStudyPhrase(false)}
          accentColor={accentColor}
        />
      )}
    </>
  );
}
