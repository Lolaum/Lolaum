"use client";

import { useState } from "react";
import type { LanguageRecord } from "@/types/routines/language";

interface StudyPhraseProps {
  cards?: FlashCard[];
  languageRecords?: LanguageRecord[];
  onClose: () => void;
  accentColor: string;
  maxCards?: number;
  title?: string;
}

interface FlashCard {
  word: string;
  meaning: string;
  example: string;
}

type ReviewMode = "word-to-meaning" | "meaning-to-word";

export default function StudyPhrase({
  cards,
  languageRecords,
  onClose,
  accentColor,
  maxCards,
  title,
}: StudyPhraseProps) {
  const resolvedCards =
    cards ??
    languageRecords?.flatMap((record) =>
      record.expressions.map((expression) => ({
        word: expression.word,
        meaning: expression.meaning,
        example: expression.example,
      })),
    ) ??
    [];
  const visibleCards =
    typeof maxCards === "number"
      ? resolvedCards.slice(0, maxCards)
      : resolvedCards;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("word-to-meaning");

  const totalCards = visibleCards.length;
  const currentCard = visibleCards[currentIndex];
  const isMeaningToWord = reviewMode === "meaning-to-word";
  const frontText = isMeaningToWord ? currentCard.meaning : currentCard.word;
  const backPrimaryText = isMeaningToWord
    ? currentCard.word
    : currentCard.meaning;
  const backSecondaryText = isMeaningToWord
    ? currentCard.meaning
    : currentCard.word;
  const flipHint = isMeaningToWord ? "탭하여 단어 보기" : "탭하여 의미 보기";

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleReviewMode = () => {
    setReviewMode((current) =>
      current === "word-to-meaning" ? "meaning-to-word" : "word-to-meaning",
    );
    setIsFlipped(false);
  };

  if (totalCards === 0) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        <div className="w-full max-w-md mx-4 bg-white rounded-3xl p-8 text-center">
          <p className="text-base font-semibold text-gray-900 mb-2">
            아직 기록된 표현이 없어요
          </p>
          <p className="text-sm text-gray-500 mb-6">
            오늘 학습 기록을 추가하고 단어 카드로 복습해보세요!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110"
            style={{ backgroundColor: accentColor }}
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="w-full max-w-2xl mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
            )}
            <div className="text-sm text-gray-200">
              {currentIndex + 1} / {totalCards}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400">학습 유형</p>
            <p className="text-sm font-bold text-gray-900 break-keep">
              {isMeaningToWord ? "뜻 보고 단어 맞추기" : "단어 보고 뜻 맞추기"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isMeaningToWord}
            aria-label="학습 유형 전환"
            onClick={toggleReviewMode}
            className="relative inline-flex h-8 w-16 shrink-0 items-center rounded-full p-1 transition-colors"
            style={{
              backgroundColor: isMeaningToWord ? accentColor : "#e5e7eb",
            }}
          >
            <span
              className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                isMeaningToWord ? "translate-x-8" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 카드 */}
        <div
          onClick={handleFlip}
          className="bg-white rounded-3xl shadow-xl p-12 min-h-[400px] flex flex-col items-center justify-center cursor-pointer mb-3 transition-all hover:shadow-2xl"
        >
          {!isFlipped ? (
            <div className="text-center w-full">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 break-words">
                {frontText}
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                {flipHint}
              </button>
            </div>
          ) : (
            <div className="text-center w-full">
              <div className="mb-3">
                <div className="text-2xl sm:text-3xl font-bold text-[var(--gold-400)] mb-4 break-words">
                  {backPrimaryText}
                </div>
              </div>
              <div className="text-gray-500 text-base sm:text-lg mb-4 break-words">
                {backSecondaryText}
              </div>
              {currentCard.example && (
                <div className="text-sm text-gray-600 italic mt-4 pt-4 border-t border-gray-200">
                  {currentCard.example}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === totalCards - 1}
            className="flex-1 py-2 rounded-xl text-white text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
