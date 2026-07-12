"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3, X } from "lucide-react";
import { RoutineType } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { createRoutineAuto } from "@/api/routine";
import { createDeclaration } from "@/api/declaration";
import { getCurrentPeriod } from "@/api/challenge";
import { ROUTINE_TYPE_MAP } from "@/types/supabase";
import ExampleTooltip from "@/components/common/ExampleTooltip";

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
  { type: "정돈리추얼", emoji: "🧹" },
];

type TimePeriod = "AM" | "PM" | "";

interface TimeParts {
  period: TimePeriod;
  hour: string;
  minute: string;
}

const EMPTY_TIME_PARTS: TimeParts = {
  period: "",
  hour: "",
  minute: "",
};

const MORNING_START_PARTS: TimeParts = {
  period: "AM",
  hour: "07",
  minute: "00",
};

const MORNING_END_PARTS: TimeParts = {
  period: "AM",
  hour: "07",
  minute: "30",
};

interface RoutineFormState {
  answers: Record<string, string>;
  alarmConfirmed: boolean;
  certConfirmed: boolean;
  routineStartTime: string;
  routineEndTime: string;
  routineStartParts: TimeParts;
  routineEndParts: TimeParts;
}

const EMPTY_ROUTINE_FORM: RoutineFormState = {
  answers: {},
  alarmConfirmed: false,
  certConfirmed: false,
  routineStartTime: "",
  routineEndTime: "",
  routineStartParts: EMPTY_TIME_PARTS,
  routineEndParts: EMPTY_TIME_PARTS,
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

function toTimeValue(parts: TimeParts) {
  if (!parts.period || !parts.hour || !parts.minute) return "";
  let hour = Number(parts.hour);
  if (parts.period === "AM" && hour === 12) hour = 0;
  if (parts.period === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${parts.minute}`;
}

function formatTimeLabel(parts: TimeParts) {
  if (!parts.period || !parts.hour || !parts.minute) return "--:--";
  return `${parts.period === "AM" ? "오전" : "오후"} ${parts.hour}:${parts.minute}`;
}

function TimePickerField({
  label,
  parts,
  isOpen,
  align = "left",
  onToggle,
  onChange,
  onConfirm,
}: {
  label: string;
  parts: TimeParts;
  isOpen: boolean;
  align?: "left" | "right";
  onToggle: () => void;
  onChange: (patch: Partial<TimeParts>) => void;
  onConfirm: () => void;
}) {
  const isComplete = Boolean(parts.period && parts.hour && parts.minute);

  return (
    <div className="relative">
      <span className="mb-1 block text-xs font-medium text-gray-400">
        {label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-800 transition-all focus:border-[var(--gold-400)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold-400)]/30"
      >
        <span>{formatTimeLabel(parts)}</span>
        <Clock3 size={18} className="shrink-0 text-gray-500" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full z-[80] mt-2 grid w-[18rem] grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="max-h-56 overflow-y-auto">
            {[
              { value: "AM", label: "오전" },
              { value: "PM", label: "오후" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({ period: option.value as TimePeriod })
                }
                className={`mb-1 w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  parts.period === option.value
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto">
            {HOUR_OPTIONS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => onChange({ hour })}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  parts.hour === hour
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {hour}
              </button>
            ))}
          </div>
          <div className="max-h-56 overflow-y-auto">
            {MINUTE_OPTIONS.map((minute) => (
              <button
                key={minute}
                type="button"
                onClick={() => onChange({ minute })}
                className={`mb-1 w-full rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                  parts.minute === minute
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {minute}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isComplete}
            className="col-span-3 rounded-xl bg-[#eab32e] px-3 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}

export default function GenerateRoutine({
  onClose,
  onCreated,
  existingTypes = [],
}: GenerateRoutineProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRoutines, setSelectedRoutines] = useState<RoutineType[]>([]);
  const [currentRoutineIndex, setCurrentRoutineIndex] = useState(0);
  const [period, setPeriod] = useState<{
    start_date: string;
    end_date: string;
    label: string | null;
  } | null>(null);
  const [formsByRoutine, setFormsByRoutine] = useState<
    Partial<Record<RoutineType, RoutineFormState>>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [openTimePicker, setOpenTimePicker] = useState<"start" | "end" | null>(
    null,
  );
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

  const currentRoutine = selectedRoutines[currentRoutineIndex] ?? "";
  const currentForm = currentRoutine
    ? (formsByRoutine[currentRoutine] ?? EMPTY_ROUTINE_FORM)
    : EMPTY_ROUTINE_FORM;
  const questions = currentRoutine ? declarationQuestions[currentRoutine] : [];
  const allAnswersFilled =
    questions.length > 0 &&
    questions.every((q) =>
      q.isConfirmation
        ? currentForm.certConfirmed
        : q.readOnly || currentForm.answers[q.id]?.trim(),
    );

  const setRoutineForm = (
    routineType: RoutineType,
    updater: (prev: RoutineFormState) => RoutineFormState,
  ) => {
    setFormsByRoutine((prev) => ({
      ...prev,
      [routineType]: updater(prev[routineType] ?? EMPTY_ROUTINE_FORM),
    }));
  };

  const toggleSelectedRoutine = (routineType: RoutineType) => {
    const isSelecting = !selectedRoutines.includes(routineType);

    if (isSelecting && routineType === "모닝리추얼") {
      setRoutineForm(routineType, (form) => ({
        ...form,
        routineStartTime: "07:00",
        routineEndTime: "07:30",
        routineStartParts: MORNING_START_PARTS,
        routineEndParts: MORNING_END_PARTS,
      }));
    }

    setSelectedRoutines((prev) =>
      prev.includes(routineType)
        ? prev.filter((type) => type !== routineType)
        : [...prev, routineType],
    );
    setErrorMsg(null);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    if (!currentRoutine) return;
    setRoutineForm(currentRoutine, (prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  };

  const updateTimeParts = (
    target: "start" | "end",
    patch: Partial<TimeParts>,
  ) => {
    if (!currentRoutine) return;
    setRoutineForm(currentRoutine, (prev) => {
      const currentParts =
        target === "start" ? prev.routineStartParts : prev.routineEndParts;
      const nextParts = { ...currentParts, ...patch };
      const nextTime = toTimeValue(nextParts);

      return target === "start"
        ? {
            ...prev,
            routineStartParts: nextParts,
            routineStartTime: nextTime,
          }
        : {
            ...prev,
            routineEndParts: nextParts,
            routineEndTime: nextTime,
          };
    });
    setErrorMsg(null);
  };

  const handleNextStep = () => {
    if (selectedRoutines.length === 0) return;
    setErrorMsg(null);
    setCurrentRoutineIndex(0);
    setStep(2);
  };

  const getMissingFormLabel = () => {
    for (const routineType of selectedRoutines) {
      const form = formsByRoutine[routineType] ?? EMPTY_ROUTINE_FORM;
      const routineQuestions = declarationQuestions[routineType];
      const isFilled =
        routineQuestions.length > 0 &&
        routineQuestions.every((q) =>
          q.isConfirmation
            ? form.certConfirmed
            : q.readOnly || form.answers[q.id]?.trim(),
        ) &&
        form.routineStartTime &&
        form.routineEndTime &&
        form.alarmConfirmed;

      if (!isFilled) return routineType;
    }

    return null;
  };

  const handlePreviousForm = () => {
    setErrorMsg(null);
    setOpenTimePicker(null);
    if (currentRoutineIndex === 0) {
      setStep(1);
      return;
    }
    setCurrentRoutineIndex((prev) => prev - 1);
  };

  const handleNextForm = () => {
    setErrorMsg(null);
    setOpenTimePicker(null);
    setCurrentRoutineIndex((prev) =>
      Math.min(selectedRoutines.length - 1, prev + 1),
    );
  };

  const handleCreate = async () => {
    if (selectedRoutines.length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);

    const missingRoutine = getMissingFormLabel();
    if (missingRoutine) {
      setErrorMsg(`${missingRoutine} 선언을 모두 입력해주세요.`);
      setCurrentRoutineIndex(selectedRoutines.indexOf(missingRoutine));
      setSubmitting(false);
      return;
    }

    for (const selectedRoutine of selectedRoutines) {
      const routineType = ROUTINE_TYPE_MAP[selectedRoutine];
      const form = formsByRoutine[selectedRoutine] ?? EMPTY_ROUTINE_FORM;
      const routineQuestions = declarationQuestions[selectedRoutine];

      if (!routineType) {
        setErrorMsg("잘못된 리추얼 타입입니다.");
        setSubmitting(false);
        return;
      }

      const { error } = await createRoutineAuto(routineType, {
        routineStartTime: form.routineStartTime,
        routineEndTime: form.routineEndTime,
      });

      if (error) {
        setErrorMsg(`${selectedRoutine} 생성 실패: ${error}`);
        setSubmitting(false);
        return;
      }

      const declarationAnswers = routineQuestions.map((q) => ({
        questionId: q.id,
        answer: q.readOnly
          ? (q.defaultValue ?? "")
          : (form.answers[q.id]?.trim() ?? ""),
      }));

      const { error: declError } = await createDeclaration({
        routineType,
        answers: declarationAnswers,
      });

      if (declError) {
        setErrorMsg(`${selectedRoutine}은 생성되었지만 선언 저장 실패: ${declError}`);
        setSubmitting(false);
        return;
      }
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
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-4 sm:items-end sm:pt-0">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 transition-opacity duration-250"
        onClick={handleClose}
        style={{
          backgroundColor: visible ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)",
        }}
      />

      {/* 바텀시트 */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-b-3xl rounded-t-3xl sm:rounded-b-none shadow-2xl transition-transform duration-250 ease-out max-h-[calc(100vh-1rem)] sm:max-h-[85vh] flex flex-col ${
          visible ? "translate-y-0" : "-translate-y-full sm:translate-y-full"
        }`}
        onCopy={(event) => event.stopPropagation()}
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
            <p className="text-sm text-gray-500 mb-1">
              {selectedRoutines.map(shortLabel).join(", ")}
            </p>
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
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2.5">
                    리추얼 선택 <span className="text-red-400">*</span>
                  </label>
                  <p className="mb-2.5 text-xs font-bold text-[#92700c]">
                    신청한 리추얼을 모두 선택해주세요
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {routineOptions
                      .filter(({ type }) => {
                        const dbType = ROUTINE_TYPE_MAP[type];
                        return !existingTypes.includes(dbType);
                      })
                      .map(({ type, emoji }) => {
                        const isSelected = selectedRoutines.includes(type);
                        return (
                          <button
                            key={type}
                            onClick={() => toggleSelectedRoutine(type)}
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
                </div>

                {/* 챌린지 기간 안내 (읽기 전용 - 어드민이 정함) */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
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
                    disabled={selectedRoutines.length === 0}
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
                    {currentRoutine}
                  </span>{" "}
                  선언을 작성해주세요
                  {selectedRoutines.length > 1 && (
                    <span className="ml-1 text-xs text-gray-300">
                      {currentRoutineIndex + 1}/{selectedRoutines.length}
                    </span>
                  )}
                </p>

                {/* 리추얼 시간 */}
                <div className="mb-5">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    리추얼 시간 <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <TimePickerField
                      label="시작"
                      parts={currentForm.routineStartParts}
                      isOpen={openTimePicker === "start"}
                      onToggle={() =>
                        setOpenTimePicker((current) =>
                          current === "start" ? null : "start",
                        )
                      }
                      onChange={(patch) => updateTimeParts("start", patch)}
                      onConfirm={() => setOpenTimePicker(null)}
                    />
                    <TimePickerField
                      label="종료"
                      parts={currentForm.routineEndParts}
                      isOpen={openTimePicker === "end"}
                      align="right"
                      onToggle={() =>
                        setOpenTimePicker((current) =>
                          current === "end" ? null : "end",
                        )
                      }
                      onChange={(patch) => updateTimeParts("end", patch)}
                      onConfirm={() => setOpenTimePicker(null)}
                    />
                  </div>
                  {currentRoutine !== "모닝리추얼" && (
                    <p className="mt-2 text-xs text-gray-400">
                      하루 10분, 내가 매일 리추얼을 유지할 수 있는 시간을
                      선택해주세요.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4 mb-5">
                  {questions.map((q) => {
                    const labelLines = q.label.split("\n");
                    const tipIdx =
                      q.exampleLineIndex ?? labelLines.length - 1;
                    return (
                    <div key={q.id}>
                      <label className="block text-sm font-bold text-gray-800 mb-0.5 leading-relaxed">
                        {labelLines.map((line, i) => (
                          <span key={i} className="block">
                            {line}
                            {q.example && i === tipIdx && (
                              <span className="ml-1 align-middle">
                                <ExampleTooltip content={q.example} />
                              </span>
                            )}
                            {i === labelLines.length - 1 && (
                              <span className="text-red-400 ml-1">*</span>
                            )}
                          </span>
                        ))}
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
                              checked={currentForm.certConfirmed}
                              onChange={(e) => {
                                if (!currentRoutine) return;
                                setRoutineForm(currentRoutine, (prev) => ({
                                  ...prev,
                                  certConfirmed: e.target.checked,
                                }));
                              }}
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
                              : (currentForm.answers[q.id] ?? "")
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
                    );
                  })}
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
                      checked={currentForm.alarmConfirmed}
                      onChange={(e) => {
                        if (!currentRoutine) return;
                        setRoutineForm(currentRoutine, (prev) => ({
                          ...prev,
                          alarmConfirmed: e.target.checked,
                        }));
                      }}
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
                    onClick={handlePreviousForm}
                    className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    이전
                  </button>
                  {currentRoutineIndex < selectedRoutines.length - 1 ? (
                    <button
                      onClick={handleNextForm}
                      disabled={
                        !allAnswersFilled ||
                        !currentForm.routineStartTime ||
                        !currentForm.routineEndTime ||
                        !currentForm.alarmConfirmed
                      }
                      className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#eab32e" }}
                    >
                      다음 선언
                    </button>
                  ) : (
                    <button
                      onClick={handleCreate}
                      disabled={
                        !allAnswersFilled ||
                        !currentForm.routineStartTime ||
                        !currentForm.routineEndTime ||
                        !currentForm.alarmConfirmed ||
                        submitting
                      }
                      className="flex-[2] py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#eab32e" }}
                    >
                      {submitting ? "생성 중..." : "리추얼 추가"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
