"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ContinuationChoice } from "@/types/routines/finalReview";
import {
  createFinalReview,
  getMyFinalReviewRoutineSummaries,
  type FinalReviewRoutineSummary,
} from "@/api/final-review";
import type { PublicReviewQuestion } from "@/api/review-questions";

const TOTAL_STEPS = 4;

function SummaryLoadingDialog() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl border border-gray-100">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-yellow-500" />
        <p className="text-sm font-semibold text-gray-900">
          리추얼 기록을 불러오는 중
        </p>
        <p className="mt-1 text-xs text-gray-400">
          1번 항목의 답변을 자동으로 채우고 있어요
        </p>
      </div>
    </div>
  );
}

function formatRoutineSummaryAnswer(
  summaries: FinalReviewRoutineSummary[],
): string {
  return summaries
    .map((summary) => {
      const metrics = summary.metrics
        .map((metric) => `${metric.label} ${metric.value}`)
        .join(" / ");
      return `${summary.label} ${metrics}`;
    })
    .join("\n");
}

export default function FinalReviewWriteContainer({
  questions = {},
}: {
  questions?: Record<string, PublicReviewQuestion>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [results, setResults] = useState("");
  const [lifeChanges, setLifeChanges] = useState("");
  const [continuationChoice, setContinuationChoice] =
    useState<ContinuationChoice | null>(null);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchSummaries() {
      try {
        const result = await getMyFinalReviewRoutineSummaries();
        if (ignore) return;
        const defaultAnswer = formatRoutineSummaryAnswer(result.data ?? []);
        if (defaultAnswer) {
          setResults((current) => (current.trim() ? current : defaultAnswer));
        }
      } finally {
        if (!ignore) setSummaryLoading(false);
      }
    }

    void fetchSummaries();

    return () => {
      ignore = true;
    };
  }, []);

  const canNext1 = !!results.trim();
  const canNext2 = !!lifeChanges.trim();
  const canNext3 =
    continuationChoice !== null &&
    (continuationChoice === "keep" || !!adjustmentNote.trim());
  const canSubmit = canNext1 && canNext2 && canNext3 && !submitting;

  const handleSubmit = async () => {
    if (!continuationChoice) return;
    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await createFinalReview({
      results: results.trim(),
      lifeChanges: lifeChanges.trim(),
      continuationChoice,
      adjustmentNote: adjustmentNote.trim(),
      feedback: feedback.trim(),
    });

    if (error) {
      setErrorMsg(error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setDone(true);
    setTimeout(() => {
      router.push("/final-review");
    }, 1500);
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          최종 회고 완료!
        </h2>
        <p className="text-sm text-gray-400">한 달 동안 정말 수고하셨어요</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {summaryLoading && <SummaryLoadingDialog />}

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">최종 회고</h1>
      </div>

      {/* 진행 바 */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ backgroundColor: step >= s ? "#eab32e" : "#e5e7eb" }}
            />
          </div>
        ))}
        <span className="text-xs text-gray-400 font-medium flex-shrink-0">
          {step}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              결과물 점검
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed whitespace-pre-line">
              {questions.results?.label ??
                "이번 달 하루 10분-30분 리추얼을 통해 만들어낸\n눈에 보이는 결과물/행동 수치를 적어주세요."}
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed whitespace-pre-line">
              {questions.results?.helperText ||
                "- 이번 달 내가 남긴 것\nex) 책 ___권 / 기록 ___개 / 운동 ___회 / 공부 ___회 등"}
            </p>
          </div>

          <div className="mb-6">
            <textarea
              value={results}
              onChange={(e) => setResults(e.target.value)}
              placeholder="이번 달 내가 남긴 결과물을 적어주세요"
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canNext1}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-colors"
            style={
              canNext1
                ? { backgroundColor: "#eab32e", color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#d1d5db" }
            }
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <div className="mb-6">
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              변화 점검
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed whitespace-pre-line">
              {questions.life_changes?.label ??
                "리추얼을 통해 실제 삶에서\n바뀐 점이 있다면?"}
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed whitespace-pre-line">
              {questions.life_changes?.helperText ||
                "ex) 실제 성과, 생산성, 감정, 에너지, 집중력 등\n\n챌린지 첫 날 적었던 리추얼 선언을 읽어보고,\n기대하는 변화에 가까워지기 위해 노력한 스스로를 칭찬해주세요!"}
            </p>
          </div>

          <div className="mb-6">
            <textarea
              value={lifeChanges}
              onChange={(e) => setLifeChanges(e.target.value)}
              placeholder="실제 삶에서 바뀐 점을 적어주세요"
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
            />
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!canNext2}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-colors"
            style={
              canNext2
                ? { backgroundColor: "#eab32e", color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#d1d5db" }
            }
          >
            다음
          </button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <div className="mb-6">
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              방향 점검
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed whitespace-pre-line">
              {questions.continuation_choice?.label ??
                "이 리추얼을 지금 방식 그대로\n1달 더 한다면?"}
            </h2>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            {[
              { value: "keep" as const, label: "유지하고 싶다" },
              { value: "adjust" as const, label: "조정이 필요하다" },
              { value: "other" as const, label: "기타" },
            ].map(({ value, label }) => {
              const selected = continuationChoice === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setContinuationChoice(value)}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors border ${
                    selected
                      ? "text-white border-transparent"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                  style={
                    selected
                      ? { backgroundColor: "#eab32e", borderColor: "#eab32e" }
                      : {}
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          {continuationChoice !== null && continuationChoice !== "keep" && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                {continuationChoice === "other"
                  ? "기타 내용을 직접 입력해주세요"
                  : (questions.adjustment_note?.label ??
                    "무엇을 바꾸면 나아질까요?")}
              </label>
              <textarea
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder={
                  continuationChoice === "other"
                    ? "예: 다른 방식으로 이어가고 싶어요"
                    : questions.adjustment_note?.helperText ||
                      "조정하고 싶은 점을 적어주세요"
                }
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
              />
            </div>
          )}

          <button
            onClick={() => setStep(4)}
            disabled={!canNext3}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-colors"
            style={
              canNext3
                ? { backgroundColor: "#eab32e", color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#d1d5db" }
            }
          >
            다음
          </button>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div>
          <div className="mb-6">
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              의견 보내기 (선택)
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed whitespace-pre-line">
              {questions.feedback?.label ??
                "리추얼챌린지는 여러분의 의견을 받으며\n쑥쑥 자랍니다 💛"}
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              - 리추얼챌린지에 이런게 있으면 좋을 것 같아요!
              <br />
              - 리추얼챌린지에서 이런건 아쉬워요!
              <br />
              - 리추얼챌린지의 이런점이 너무 좋아요!
              <br />
              <br />
              의견 많이많이 부탁드려요 :)
            </p>
          </div>

          <div className="mb-6">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                questions.feedback?.helperText ||
                "자유롭게 의견을 남겨주세요 (선택사항)"
              }
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 mb-3 px-1">{errorMsg}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-colors"
            style={
              canSubmit
                ? { backgroundColor: "#eab32e", color: "#fff" }
                : { backgroundColor: "#f3f4f6", color: "#d1d5db" }
            }
          >
            {submitting ? "저장 중..." : "최종 회고 완료하기"}
          </button>
        </div>
      )}
    </div>
  );
}
