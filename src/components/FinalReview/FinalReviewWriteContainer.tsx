"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContinuationChoice } from "@/types/routines/finalReview";
import { createFinalReview } from "@/api/final-review";

const TOTAL_STEPS = 4;

export default function FinalReviewWriteContainer() {
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
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              이번 달 하루 10분-30분 리추얼을 통해 만들어낸
              <br />
              눈에 보이는 결과물/행동 수치를 적어주세요.
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              - 이번 달 내가 남긴 것
              <br />
              ex) 책 ___권 / 기록 ___개 / 운동 ___회 / 공부 ___회 등
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
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              리추얼을 통해 실제 삶에서
              <br />
              바뀐 점이 있다면?
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              ex) 실제 성과, 생산성, 감정, 에너지, 집중력 등
              <br />
              <br />
              챌린지 첫 날 적었던 리추얼 선언을 읽어보고,
              <br />
              기대하는 변화에 가까워지기 위해 노력한 스스로를 칭찬해주세요!
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
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              이 리추얼을 지금 방식 그대로
              <br />
              1달 더 한다면?
            </h2>
          </div>

          <div className="flex flex-col gap-2 mb-5">
            {[
              { value: "keep" as const, label: "유지하고 싶다" },
              { value: "adjust" as const, label: "조정이 필요하다" },
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

          {continuationChoice === "adjust" && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                무엇을 바꾸면 나아질까요?
              </label>
              <textarea
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="조정하고 싶은 점을 적어주세요"
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
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              리추얼챌린지는 여러분의 의견을 받으며
              <br />
              쑥쑥 자랍니다 💛
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
              placeholder="자유롭게 의견을 남겨주세요 (선택사항)"
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
