"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MidReviewCondition } from "@/types/routines/midReview";

const CONDITIONS: MidReviewCondition[] = [
  "시간대",
  "장소",
  "습관",
  "컨디션",
  "감정",
  "전날 행동",
];

const CONDITION_PROMPTS: Record<MidReviewCondition, string> = {
  시간대: "어떤 시간대였나요?",
  장소: "어떤 장소였나요?",
  습관: "어떤 습관이 도움이 됐나요?",
  컨디션: "컨디션이 어땠나요?",
  감정: "어떤 감정 상태였나요?",
  "전날 행동": "전날 어떤 행동이 영향을 줬나요?",
};

export default function MidReviewWriteContainer() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  // Step 1
  const [goodConditions, setGoodConditions] = useState<MidReviewCondition[]>([]);
  const [goodDetails, setGoodDetails] = useState<Partial<Record<MidReviewCondition, string>>>({});

  // Step 2
  const [hardConditions, setHardConditions] = useState<MidReviewCondition[]>([]);
  const [hardDetails, setHardDetails] = useState<Partial<Record<MidReviewCondition, string>>>({});

  // Step 3
  const [whyStarted, setWhyStarted] = useState("");
  const [keepDoing, setKeepDoing] = useState("");
  const [willChange, setWillChange] = useState("");

  const toggleCondition = (
    condition: MidReviewCondition,
    selected: MidReviewCondition[],
    setSelected: (v: MidReviewCondition[]) => void,
    setDetails: (v: Partial<Record<MidReviewCondition, string>>) => void,
    details: Partial<Record<MidReviewCondition, string>>,
    max: number
  ) => {
    if (selected.includes(condition)) {
      setSelected(selected.filter((c) => c !== condition));
      const next = { ...details };
      delete next[condition];
      setDetails(next);
    } else if (selected.length < max) {
      setSelected([...selected, condition]);
    }
  };

  const canNext1 = goodConditions.length >= 2 && goodConditions.every((c) => goodDetails[c]?.trim());
  const canNext2 = hardConditions.length >= 1 && hardConditions.every((c) => hardDetails[c]?.trim());
  const canSubmit = whyStarted.trim() && keepDoing.trim() && willChange.trim();

  const handleSubmit = () => {
    // TODO: 실제 서버 저장 로직
    setDone(true);
    setTimeout(() => {
      router.push("/mid-review");
    }, 2000);
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-4xl"
          style={{ backgroundColor: "#fef3c7", border: "3px solid #eab32e" }}
        >
          ✅
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">중간 회고 완료!</h2>
        <p className="text-sm text-gray-400">다른 챌린저들의 회고를 확인해보세요</p>
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">중간 회고</h1>
      </div>

      {/* 진행 바 */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ backgroundColor: step >= s ? "#eab32e" : "#e5e7eb" }}
            />
          </div>
        ))}
        <span className="text-xs text-gray-400 font-medium flex-shrink-0">{step}/3</span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <div className="mb-6">
            <span
              className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              패턴 점검
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              리추얼이 가장 잘 작동했던 날,
              <br />
              어떤 조건이 갖춰져 있었나요?
            </h2>
            <p className="text-xs text-gray-400 mt-1">2~3가지를 선택해주세요</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {CONDITIONS.map((c) => {
              const selected = goodConditions.includes(c);
              const disabled = !selected && goodConditions.length >= 3;
              return (
                <button
                  key={c}
                  onClick={() =>
                    toggleCondition(c, goodConditions, setGoodConditions, setGoodDetails, goodDetails, 3)
                  }
                  disabled={disabled}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors border ${
                    selected
                      ? "text-white border-transparent"
                      : disabled
                      ? "bg-gray-50 border-gray-100 text-gray-300"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                  style={selected ? { backgroundColor: "#eab32e", borderColor: "#eab32e" } : {}}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {goodConditions.length > 0 && (
            <div className="flex flex-col gap-4 mb-6">
              {goodConditions.map((c) => (
                <div key={c}>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                    {CONDITION_PROMPTS[c]}
                  </label>
                  <textarea
                    value={goodDetails[c] ?? ""}
                    onChange={(e) => setGoodDetails({ ...goodDetails, [c]: e.target.value })}
                    placeholder="구체적으로 적어주세요"
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
                  />
                </div>
              ))}
            </div>
          )}

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
              패턴 점검
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              리추얼이 가장 힘들었던 날,
              <br />
              무엇이 걸림돌이 됐나요?
            </h2>
            <p className="text-xs text-gray-400 mt-1">1~2가지를 선택해주세요</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {CONDITIONS.map((c) => {
              const selected = hardConditions.includes(c);
              const disabled = !selected && hardConditions.length >= 2;
              return (
                <button
                  key={c}
                  onClick={() =>
                    toggleCondition(c, hardConditions, setHardConditions, setHardDetails, hardDetails, 2)
                  }
                  disabled={disabled}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors border ${
                    selected
                      ? "text-white border-transparent"
                      : disabled
                      ? "bg-gray-50 border-gray-100 text-gray-300"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                  style={selected ? { backgroundColor: "#eab32e", borderColor: "#eab32e" } : {}}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {hardConditions.length > 0 && (
            <div className="flex flex-col gap-4 mb-6">
              {hardConditions.map((c) => (
                <div key={c}>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                    {CONDITION_PROMPTS[c]}
                  </label>
                  <textarea
                    value={hardDetails[c] ?? ""}
                    onChange={(e) => setHardDetails({ ...hardDetails, [c]: e.target.value })}
                    placeholder="구체적으로 적어주세요"
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
                  />
                </div>
              ))}
            </div>
          )}

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
              초심 점검
            </span>
            <h2 className="text-base font-bold text-gray-800 leading-relaxed">
              시작 이유를 돌아보고
              <br />
              남은 기간의 방향을 잡아보세요
            </h2>
          </div>

          <div className="flex flex-col gap-5 mb-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                나는 왜 이 리추얼을 시작했나요?
              </label>
              <textarea
                value={whyStarted}
                onChange={(e) => setWhyStarted(e.target.value)}
                placeholder="처음 다짐했던 이유를 떠올려보세요"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-yellow-300 bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                남은 기간 동안 유지할 것 1가지
              </label>
              <input
                type="text"
                value={keepDoing}
                onChange={(e) => setKeepDoing(e.target.value)}
                placeholder="예: 기상 직후 물 한 잔"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-yellow-300 bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                남은 기간 동안 바꿀 것 1가지
              </label>
              <input
                type="text"
                value={willChange}
                onChange={(e) => setWillChange(e.target.value)}
                placeholder="예: 스트레칭 5분 → 10분으로 늘리기"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-yellow-300 bg-white"
              />
            </div>
          </div>

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
            중간 회고 완료하기
          </button>
        </div>
      )}
    </div>
  );
}
