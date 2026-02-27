"use client";

import { useState, useMemo } from "react";
import { LanguageRecord } from "@/types/routines/language";

interface StudyPhraseProps {
  languageRecords: LanguageRecord[];
  onClose: () => void;
  accentColor: string;
}

interface FlashCard {
  word: string;
  meaning: string;
  example: string;
}

export default function StudyPhrase({
  languageRecords,
  onClose,
  accentColor,
}: StudyPhraseProps) {
  // 모든 레코드의 expressions를 펼쳐서 하나의 카드 배열로 만듦
  const allCards = useMemo(() => {
    const cards: FlashCard[] = [];
    languageRecords.forEach((record) => {
      record.expressions.forEach((expr) => {
        cards.push({
          word: expr.word,
          meaning: expr.meaning,
          example: expr.example,
        });
      });
    });
    return cards;
  }, [languageRecords]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = allCards[currentIndex];
  const totalCards = allCards.length;

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

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="w-full max-w-2xl mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {totalCards}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
        </div>

        {/* 카드 */}
        <div
          onClick={handleFlip}
          className="bg-white rounded-3xl shadow-xl p-12 min-h-[400px] flex flex-col items-center justify-center cursor-pointer mb-3 transition-all hover:shadow-2xl"
        >
          {!isFlipped ? (
            // 앞면: 단어
            <div className="text-center w-full">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {currentCard.word}
              </h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip();
                }}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                탭하여 의미 보기
              </button>
            </div>
          ) : (
            // 뒷면: 의미와 예문
            <div className="text-center w-full">
              <div className="mb-3">
                <div className="text-3xl font-bold text-[var(--gold-400)] mb-4">
                  {currentCard.meaning}
                </div>
              </div>
              <div className="text-gray-500 text-lg mb-4">
                {currentCard.word}
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
