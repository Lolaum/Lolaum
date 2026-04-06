"use client";

import { useState } from "react";
import { RoutineType } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { createRoutineAuto } from "@/api/routine";
import { ROUTINE_TYPE_MAP } from "@/types/supabase";

interface GenerateRoutineProps {
  onClose?: () => void;
  onCreated?: () => void;
}

const routineOptions: RoutineType[] = [
  "모닝리추얼",
  "운동리추얼",
  "독서리추얼",
  "기록리추얼",
  "영어리추얼",
  "제2외국어리추얼",
  "자산관리리추얼",
  "원서읽기리추얼",
];

export default function GenerateRoutine({ onClose, onCreated }: GenerateRoutineProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType | "">("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const questions =
    selectedRoutine ? declarationQuestions[selectedRoutine] : [];
  const allAnswersFilled =
    questions.length > 0 && questions.every((q) => answers[q.id]?.trim());

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextStep = () => {
    if (selectedRoutine) setStep(2);
  };

  const handleCreate = async () => {
    if (!selectedRoutine) return;
    setSubmitting(true);
    setErrorMsg(null);

    const routineType = ROUTINE_TYPE_MAP[selectedRoutine];
    if (!routineType) {
      setErrorMsg("잘못된 루틴 타입입니다.");
      setSubmitting(false);
      return;
    }

    const { error } = await createRoutineAuto(routineType);

    if (error) {
      setErrorMsg(error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    onCreated?.();
  };

  return (
    <>
      {/* 성공 모달 */}
      {showSuccess && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-3xl shadow-xl p-6 mx-4 w-full max-w-sm flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "#fef9ec" }}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="#eab32e"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-1">
              루틴이 생성되었어요!
            </h2>
            <p className="text-sm text-gray-500 mb-1">{selectedRoutine}</p>
            {(startDate || endDate) && (
              <p className="text-xs text-gray-300 mb-5">
                {startDate || "—"} ~ {endDate || "계속"}
              </p>
            )}
            {!(startDate || endDate) && <div className="mb-5" />}
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
              style={{ backgroundColor: "#eab32e" }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        {/* 헤더 + 단계 인디케이터 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">새 루틴 만들기</h2>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full transition-colors"
              style={{ backgroundColor: step === 1 ? "#eab32e" : "#d1d5db" }}
            />
            <div
              className="w-2 h-2 rounded-full transition-colors"
              style={{ backgroundColor: step === 2 ? "#eab32e" : "#d1d5db" }}
            />
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* 루틴 선택 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                루틴 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedRoutine}
                  onChange={(e) =>
                    setSelectedRoutine(e.target.value as RoutineType | "")
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
                >
                  <option value="">루틴을 선택하세요</option>
                  {routineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-300">
                매일 반복할 습관을 선택해주세요
              </p>
            </div>

            {/* 기간 설정 */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
              />
              <p className="mt-1.5 text-xs text-gray-300">
                종료일을 지정하지 않으면 계속 진행됩니다
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              )}
              <button
                onClick={handleNextStep}
                disabled={!selectedRoutine}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#eab32e" }}
              >
                다음 →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 2단계: 선언 폼 */}
            <p className="text-xs text-gray-400 mb-4">
              <span
                className="font-semibold"
                style={{ color: "#eab32e" }}
              >
                {selectedRoutine}
              </span>{" "}
              선언을 작성해주세요
            </p>

            <div className="flex flex-col gap-4 mb-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {q.label} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
                  />
                </div>
              ))}
            </div>

            {/* 에러 메시지 */}
            {errorMsg && (
              <p className="text-xs text-red-500 mb-3 px-1">{errorMsg}</p>
            )}

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ← 이전
              </button>
              <button
                onClick={handleCreate}
                disabled={!allAnswersFilled || submitting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#eab32e" }}
              >
                {submitting ? "생성 중..." : "루틴 추가"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
