"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { RoutineType } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { createRoutineAuto } from "@/api/routine";
import { createDeclaration } from "@/api/declaration";
import { getCurrentPeriod } from "@/api/challenge";
import { ROUTINE_TYPE_MAP } from "@/types/supabase";

interface GenerateRoutineProps {
  onClose: () => void;
  onCreated?: () => void;
  existingTypes?: string[]; // 이미 등록된 리추얼의 RoutineType 목록
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
  existingTypes = [],
}: GenerateRoutineProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType | "">("");
  const [period, setPeriod] = useState<{
    start_date: string;
    end_date: string;
    label: string | null;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [alarmConfirmed, setAlarmConfirmed] = useState(false);
  const [certConfirmed, setCertConfirmed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 마운트 시 애니메이션 트리거
    requestAnimationFrame(() => setVisible(true));
    // 바텀시트 열릴 때 스크롤 잠금
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // 활성 챌린지 기간 조회 (사용자 입력 대신 어드민이 정한 기간 표시)
  useEffect(() => {
    let cancelled = false;
    getCurrentPeriod().then((res) => {
      if (cancelled) return;
      if (res.period) {
        setPeriod({
          start_date: res.period.start_date,
          end_date: res.period.end_date,
          label: res.period.label,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 250);
  };

  const questions = selectedRoutine
    ? declarationQuestions[selectedRoutine]
    : [];
  const allAnswersFilled =
    questions.length > 0 &&
    questions.every((q) =>
      q.isConfirmation
        ? certConfirmed
        : q.readOnly || answers[q.id]?.trim(),
    );

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
      setErrorMsg("잘못된 리추얼 타입입니다.");
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
      answer: q.readOnly
        ? (q.defaultValue ?? "")
        : (answers[q.id]?.trim() ?? ""),
    }));

    const { error: declError } = await createDeclaration({
      routineType,
      answers: declarationAnswers,
    });

    if (declError) {
      setErrorMsg(`리추얼은 생성되었지만 선언 저장 실패: ${declError}`);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    router.refresh();
    setShowSuccess(false);
    setVisible(false);
    setTimeout(() => onCreated?.(), 250);
  };

  // 리추얼 이름에서 "리추얼" 제거한 짧은 라벨
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
          <h2 className="text-lg font-bold text-gray-800">새 리추얼 만들기</h2>
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
              리추얼이 생성되었어요!
            </h3>
            <p className="text-sm text-gray-500 mb-1">{selectedRoutine}</p>
            {period ? (
              <p className="text-xs text-gray-300 mb-6">
                {period.start_date} ~ {period.end_date}
              </p>
            ) : (
              <div className="mb-6" />
            )}
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
                {/* 리추얼 선택 - 칩 그리드 */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    리추얼 선택 <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {routineOptions
                      .filter(({ type }) => {
                        const dbType = ROUTINE_TYPE_MAP[type];
                        return !existingTypes.includes(dbType);
                      })
                      .map(({ type, emoji }) => {
                        const isSelected = selectedRoutine === type;
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedRoutine(type)}
                            className="flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.97]"
                            style={{
                              borderColor: isSelected ? "#eab32e" : "#f3f4f6",
                              backgroundColor: isSelected
                                ? "#fefce8"
                                : "#fafafa",
                            }}
                          >
                            <span className="text-lg flex-shrink-0">
                              {emoji}
                            </span>
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

                {/* 챌린지 기간 안내 (읽기 전용 - 어드민이 정함) */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    챌린지 기간
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl">
                    {period ? (
                      <>
                        <p className="text-sm font-semibold text-gray-700">
                          {period.start_date} ~ {period.end_date}
                        </p>
                        {period.label && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {period.label}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">
                        기간 정보를 불러오는 중...
                      </p>
                    )}
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
                  <span className="font-semibold" style={{ color: "#eab32e" }}>
                    {selectedRoutine}
                  </span>{" "}
                  선언을 작성해주세요
                </p>

                <div className="flex flex-col gap-4 mb-5">
                  {questions.map((q) => (
                    <div key={q.id}>
                      <label className="block text-sm font-bold text-gray-800 mb-0.5 whitespace-pre-line leading-relaxed">
                        {q.label} <span className="text-red-400">*</span>
                      </label>
                      {q.description && (
                        <p className="text-xs text-gray-400 mb-2 leading-relaxed whitespace-pre-line">
                          {q.description}
                        </p>
                      )}
                      {q.isConfirmation ? (
                        <>
                          <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-gray-700 whitespace-pre-line leading-relaxed mb-2.5">
                            {q.defaultValue}
                          </div>
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={certConfirmed}
                              onChange={(e) =>
                                setCertConfirmed(e.target.checked)
                              }
                              className="w-4 h-4 rounded border-gray-300 accent-[#eab32e] flex-shrink-0 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">
                              네, 확인했습니다
                            </span>
                          </label>
                        </>
                      ) : (
                        <textarea
                          value={
                            q.readOnly
                              ? (q.defaultValue ?? "")
                              : (answers[q.id] ?? "")
                          }
                          onChange={(e) =>
                            handleAnswerChange(q.id, e.target.value)
                          }
                          placeholder={q.placeholder}
                          rows={q.readOnly ? 6 : 3}
                          disabled={q.readOnly}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30 focus:border-[var(--gold-400)] focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* 알람 설정 확인 */}
                <div className="mb-5">
                  <p className="block text-sm font-bold text-gray-800 mb-2">
                    내가 설정한 리추얼 시간에 알람설정을 완료해주세요{" "}
                    <span className="text-red-400">*</span>
                  </p>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={alarmConfirmed}
                      onChange={(e) => setAlarmConfirmed(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-[#eab32e] flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">
                      네, 완료했습니다
                    </span>
                  </label>
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
                    disabled={
                      !allAnswersFilled || !alarmConfirmed || submitting
                    }
                    className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#eab32e" }}
                  >
                    {submitting ? "생성 중..." : "리추얼 추가"}
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
