"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ContinuationChoice, FinalReview } from "@/types/routines/finalReview";
import UserAvatar from "@/components/common/UserAvatar";
import { updateFinalReview } from "@/api/final-review";

interface FinalReviewDetailProps {
  review: FinalReview;
  isMine: boolean;
}

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function FinalReviewDetail({ review, isMine }: FinalReviewDetailProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(review.results);
  const [lifeChanges, setLifeChanges] = useState(review.lifeChanges);
  const [continuationChoice, setContinuationChoice] =
    useState<ContinuationChoice>(review.continuationChoice);
  const [adjustmentNote, setAdjustmentNote] = useState(review.adjustmentNote);
  const [feedback, setFeedback] = useState(review.feedback);

  const handleCancel = () => {
    setResults(review.results);
    setLifeChanges(review.lifeChanges);
    setContinuationChoice(review.continuationChoice);
    setAdjustmentNote(review.adjustmentNote);
    setFeedback(review.feedback);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateFinalReview(review.id, {
      results,
      lifeChanges,
      continuationChoice,
      adjustmentNote: continuationChoice === "adjust" ? adjustmentNote : "",
      feedback,
    });
    setSaving(false);
    if (error) {
      alert(`수정 실패: ${error}`);
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const choiceLabel =
    continuationChoice === "keep" ? "유지하고 싶다" : "조정이 필요하다";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">최종 회고</h1>
        {isMine && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            수정
          </button>
        )}
      </div>

      {/* 본문 카드 */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        {/* 유저 정보 */}
        <div className="flex items-center gap-3 mb-5">
          <UserAvatar avatarUrl={review.avatarUrl} emoji={review.userEmoji} size={48} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-gray-900">{review.userName}</p>
              {isMine && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: "#eab32e" }}
                >
                  나
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{formatFullDate(review.createdAt)}</p>
          </div>
        </div>

        {/* 회고 내용 */}
        <div className="space-y-5">
          {/* 결과물 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              이번 달 내가 남긴 것
            </p>
            <div className="rounded-xl p-4" style={{ backgroundColor: "#fef3c7" }}>
              {editing ? (
                <textarea
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {results}
                </p>
              )}
            </div>
          </div>

          {/* 변화 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              실제 삶에서 바뀐 점
            </p>
            <div className="bg-green-50 rounded-xl p-4">
              {editing ? (
                <textarea
                  value={lifeChanges}
                  onChange={(e) => setLifeChanges(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lifeChanges}
                </p>
              )}
            </div>
          </div>

          {/* 방향 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">
              한 달 더 한다면
            </p>
            <div className="bg-blue-50 rounded-xl p-4">
              {editing ? (
                <>
                  <div className="flex flex-col gap-2 mb-3">
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
                          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
                            selected
                              ? "text-white border-transparent"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                          style={
                            selected
                              ? {
                                  backgroundColor: "#eab32e",
                                  borderColor: "#eab32e",
                                }
                              : {}
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {continuationChoice === "adjust" && (
                    <textarea
                      value={adjustmentNote}
                      onChange={(e) => setAdjustmentNote(e.target.value)}
                      rows={3}
                      placeholder="조정하고 싶은 점을 적어주세요"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                    />
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-blue-500 mb-1.5">
                    {choiceLabel}
                  </p>
                  {continuationChoice === "adjust" && adjustmentNote && (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {adjustmentNote}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 의견 */}
          {(editing || feedback) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">
                보내주신 의견
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                {editing ? (
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="자유롭게 의견을 남겨주세요"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {feedback}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 편집 액션 */}
        {editing && (
          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-all"
              style={{ backgroundColor: "#eab32e" }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
