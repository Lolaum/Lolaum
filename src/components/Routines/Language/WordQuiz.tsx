"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { Check, RotateCcw, X } from "lucide-react";

interface QuizCard {
  word: string;
  meaning: string;
  example: string;
}

interface QuizQuestion {
  card: QuizCard;
  options: string[];
}

interface WordQuizProps {
  cards: QuizCard[];
  title: string;
  accentColor: string;
  onClose: () => void;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function buildQuestions(cards: QuizCard[]): QuizQuestion[] {
  const validCards = cards.filter(
    (card) => card.word.trim() && card.meaning.trim(),
  );

  return shuffle(validCards).map((card) => {
    const wrongOptions = shuffle(
      validCards
        .filter((candidate) => candidate.meaning !== card.meaning)
        .map((candidate) => candidate.meaning),
    ).slice(0, 2);

    return {
      card,
      options: shuffle([card.meaning, ...wrongOptions]),
    };
  });
}

export default function WordQuiz({
  cards,
  title,
  accentColor,
  onClose,
}: WordQuizProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const [questions, setQuestions] = useState(() => buildQuestions(cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isAnswered = selectedOption !== null;

  const restart = () => {
    setQuestions(buildQuestions(cards));
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setIsFinished(false);
  };

  const handleSelect = (option: string) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(option);
    if (option === currentQuestion.card.meaning) {
      setCorrectCount((count) => count + 1);
    }
  };

  const handleNext = () => {
    if (!isAnswered) return;
    if (currentIndex >= totalQuestions - 1) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelectedOption(null);
  };

  if (totalQuestions < 3 || !currentQuestion) {
    return (
      <QuizShell title={title} onClose={onClose}>
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <p className="text-base font-semibold text-gray-900 mb-2">
            퀴즈를 만들 표현이 부족해요
          </p>
          <p className="text-sm text-gray-500 mb-6">
            단어와 뜻이 등록된 표현이 3개 이상일 때 퀴즈를 풀 수 있어요.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            닫기
          </button>
        </div>
      </QuizShell>
    );
  }

  if (isFinished) {
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    return (
      <QuizShell title={title} onClose={onClose}>
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}1A` }}
          >
            <Check className="h-8 w-8" style={{ color: accentColor }} />
          </div>
          <p className="text-sm font-semibold text-gray-400 mb-1">퀴즈 결과</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {correctCount} / {totalQuestions}개 정답
          </h2>
          <p className="text-sm text-gray-500 mb-7">정답률 {percentage}%</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restart}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              다시 풀기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              완료
            </button>
          </div>
        </div>
      </QuizShell>
    );
  }

  return (
    <QuizShell title={title} onClose={onClose}>
      <div className="rounded-3xl bg-white p-5 shadow-xl sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-400">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
          >
            단어 퀴즈
          </span>
        </div>

        <div className="mb-6 rounded-2xl bg-gray-50 px-5 py-10 text-center">
          <p className="text-xs font-semibold text-gray-400 mb-3">
            뜻을 고르세요
          </p>
          <h2 className="break-words text-3xl font-bold text-gray-900 sm:text-4xl">
            {currentQuestion.card.word}
          </h2>
          {currentQuestion.card.example && (
            <p className="mt-5 border-t border-gray-200 pt-4 text-sm italic text-gray-500">
              {currentQuestion.card.example}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {currentQuestion.options.map((option, optionIndex) => {
            const isCorrect = option === currentQuestion.card.meaning;
            const isSelected = option === selectedOption;
            const showCorrect = isAnswered && isCorrect;
            const showWrong = isAnswered && isSelected && !isCorrect;

            return (
              <button
                key={`${option}-${optionIndex}`}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={isAnswered}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-colors ${
                  showCorrect
                    ? "border-green-500 bg-green-50 text-green-700"
                    : showWrong
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                } disabled:cursor-default`}
              >
                <span className="break-words">{option}</span>
                {showCorrect && <Check className="h-5 w-5 shrink-0" />}
                {showWrong && <X className="h-5 w-5 shrink-0" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={!isAnswered}
          className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:bg-gray-300"
          style={isAnswered ? { backgroundColor: accentColor } : undefined}
        >
          {currentIndex === totalQuestions - 1 ? "결과 보기" : "다음 문제"}
        </button>
      </div>
    </QuizShell>
  );
}

function QuizShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto overscroll-contain">
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
