"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { RoutineType } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { createRoutineAuto } from "@/api/routine";
import { createDeclaration } from "@/api/declaration";
import { ROUTINE_TYPE_MAP } from "@/types/supabase";

interface GenerateRoutineProps {
  onClose: () => void;
  onCreated?: () => void;
}

const routineOptions: { type: RoutineType; emoji: string }[] = [
  { type: "모닝리추얼", emoji: "🌅" },
  { type: "운동리추얼", emoji: "💪" },
  { type: "독서리추얼", emoji: "📚" },
  { type: "기록리추얼", emoji: "✍️" },
  { type: "영어리추얼", emoji: "🇺🇸" },
  { type: "제2외국어리추얼", emoji: "🌍" },
  { type: "자산관리리추얼", emoji: "💰" },
  { type: "원서읽기리추얼", emoji: "📖" },
];

export default function GenerateRoutine({
  onClose,
  onCreated,
}: GenerateRoutineProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType | "">("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 시 애니메이션 트리거
    requestAnimationFrame(() => setVisible(true));
    // 바텀시트 열릴 때 스크롤 잠금
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 250);
  };

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

    const declarationAnswers = questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id]?.trim() ?? "",
    }));

    const { error: declError } = await createDeclaration({
      routineType,
      answers: declarationAnswers,
    });

    if (declError) {
      setErrorMsg(`루틴은 생성되었지만 선언 저장 실패: ${declError}`);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setVisible(false);
    setTimeout(() => onCreated?.(), 250);
  };

  // 루틴 이름에서 "리추얼" 제거한 짧은 라벨
  const shortLabel = (type: RoutineType) => type.replace("리추얼", "");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={handleClose}
    >
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 transition-opacity duration-250"
        style={{
          backgroundColor: visible ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)",
        }}
      />

      {/* 바텀시트 */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transition-transform duration-250 ease-out max-h-[85vh] flex flex-col"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들바 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">새 루틴 만들기</h2>
          <div className="flex items-center gap-3">
            {/* 단계 인디케이터 */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: step === 1 ? "#eab32e" : "#d1d5db",
                }}
              />
              <div
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor: step === 2 ? "#eab32e" : "#d1d5db",
                }}
              />
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 성공 화면 */}
        {showSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8 pt-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "#fef9ec" }}
            >
              <svg
                className="w-8 h-8"
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
            <h3 className="text-base font-bold text-gray-800 mb-1">
              루틴이 생성되었어요!
            </h3>
            <p className="text-sm text-gray-500 mb-1">{selectedRoutine}</p>
            {(startDate || endDate) && (
              <p className="text-xs text-gray-300 mb-6">
                {startDate || "—"} ~ {endDate || "계속"}
              </p>
            )}
            {!(startDate || endDate) && <div className="mb-6" />}
            <button
              onClick={handleSuccessClose}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              style={{ backgroundColor: "#eab32e" }}
            >
              확인
            </button>
          </div>
        ) : (
          /* 스크롤 가능한 폼 영역 */
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {step === 1 ? (
              <>
                {/* 루틴 선택 - 칩 그리드 */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    루틴 선택 <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {routineOptions.map(({ type, emoji }) => {
                      const isSelected = selectedRoutine === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setSelectedRoutine(type)}
                          className="flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.97]"
                          style={{
                            borderColor: isSelected ? "#eab32e" : "#f3f4f6",
                            backgroundColor: isSelected ? "#fefce8" : "#fafafa",
                          }}
                        >
                          <span className="text-lg flex-shrink-0">{emoji}</span>
                          <span
                            className="text-sm font-medium truncate"
                            style={{
                              color: isSelected ? "#92700c" : "#6b7280",
                            }}
                          >
                            {shortLabel(type)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-300">
                    매일 반복할 습관을 선택해주세요
                  </p>
                </div>

                {/* 기간 설정 - 가로 배치 */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    기간 설정
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
                        placeholder="시작일"
                      />
                      <span className="block text-[10px] text-gray-300 mt-1 pl-1">
                        시작일
                      </span>
                    </div>
                    <div className="flex items-start pt-3 text-gray-300 text-sm">
                      ~
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
                        placeholder="종료일"
                      />
                      <span className="block text-[10px] text-gray-300 mt-1 pl-1">
                        종료일 (미설정 시 계속)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!selectedRoutine}
                    className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#eab32e" }}
                  >
                    다음
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* 2단계: 선언 폼 */}
                <p className="text-sm text-gray-400 mb-4">
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
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                        placeholder={q.placeholder}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all"
                      />
                    </div>
                  ))}
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-500 mb-3 px-1">{errorMsg}</p>
                )}

                {/* 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!allAnswersFilled || submitting}
                    className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#eab32e" }}
                  >
                    {submitting ? "생성 중..." : "루틴 추가"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
