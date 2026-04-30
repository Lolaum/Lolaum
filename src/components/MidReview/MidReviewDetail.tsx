"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { MidReview, MidReviewCondition } from "@/types/routines/midReview";
import UserAvatar from "@/components/common/UserAvatar";
import { updateMidReview } from "@/api/mid-review";

interface MidReviewDetailProps {
  review: MidReview;
  isMine: boolean;
}

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

function ConditionSection({
  title,
  conditions,
  details,
  chipBg,
  chipColor,
  editing,
  onChange,
}: {
  title: string;
  conditions: MidReviewCondition[];
  details: Partial<Record<MidReviewCondition, string>>;
  chipBg: string;
  chipColor: string;
  editing: boolean;
  onChange: (c: MidReviewCondition, v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 mb-2">{title}</p>
      <div className="space-y-2">
        {conditions.map((c) => (
          <div key={c} className="bg-gray-50 rounded-xl p-3">
            <span
              className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: chipBg, color: chipColor }}
            >
              {c}
            </span>
            {editing ? (
              <textarea
                value={details[c] ?? ""}
                onChange={(e) => onChange(c, e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
              />
            ) : (
              details[c] && (
                <p className="text-sm text-gray-700 leading-relaxed">{details[c]}</p>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MidReviewDetail({ review, isMine }: MidReviewDetailProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goodDetails, setGoodDetails] = useState(review.goodConditionDetails);
  const [hardDetails, setHardDetails] = useState(review.hardConditionDetails);
  const [whyStarted, setWhyStarted] = useState(review.whyStarted ?? "");
  const [keepDoing, setKeepDoing] = useState(review.keepDoing);
  const [willChange, setWillChange] = useState(review.willChange);

  const handleCancel = () => {
    setGoodDetails(review.goodConditionDetails);
    setHardDetails(review.hardConditionDetails);
    setWhyStarted(review.whyStarted ?? "");
    setKeepDoing(review.keepDoing);
    setWillChange(review.willChange);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateMidReview(review.id, {
      goodConditionDetails: goodDetails,
      hardConditionDetails: hardDetails,
      whyStarted,
      keepDoing,
      willChange,
    });
    setSaving(false);
    if (error) {
      alert(`수정 실패: ${error}`);
      return;
    }
    setEditing(false);
    router.refresh();
  };

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
        <h1 className="text-lg font-bold text-gray-800">중간 회고</h1>
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
          <ConditionSection
            title="잘 됐던 조건"
            conditions={review.goodConditions}
            details={goodDetails}
            chipBg="#fef3c7"
            chipColor="#d97706"
            editing={editing}
            onChange={(c, v) => setGoodDetails((prev) => ({ ...prev, [c]: v }))}
          />

          <ConditionSection
            title="걸림돌"
            conditions={review.hardConditions}
            details={hardDetails}
            chipBg="#fef2f2"
            chipColor="#ef4444"
            editing={editing}
            onChange={(c, v) => setHardDetails((prev) => ({ ...prev, [c]: v }))}
          />

          {/* 초심 점검 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">초심 점검</p>
            <div className="space-y-2">
              {(editing || whyStarted) && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#fef3c7" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#d97706" }}>
                    시작한 이유
                  </p>
                  {editing ? (
                    <textarea
                      value={whyStarted}
                      onChange={(e) => setWhyStarted(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">{whyStarted}</p>
                  )}
                </div>
              )}
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-600 mb-1">유지할 것</p>
                {editing ? (
                  <textarea
                    value={keepDoing}
                    onChange={(e) => setKeepDoing(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{keepDoing}</p>
                )}
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-500 mb-1">변화할 것</p>
                {editing ? (
                  <textarea
                    value={willChange}
                    onChange={(e) => setWillChange(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{willChange}</p>
                )}
              </div>
            </div>
          </div>
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
