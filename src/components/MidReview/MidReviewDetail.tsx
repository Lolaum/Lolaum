"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MidReview, MidReviewCondition } from "@/types/routines/midReview";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import UserAvatar from "@/components/common/UserAvatar";

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
}: {
  title: string;
  conditions: MidReviewCondition[];
  details: Partial<Record<MidReviewCondition, string>>;
  chipBg: string;
  chipColor: string;
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
            {details[c] && (
              <p className="text-sm text-gray-700 leading-relaxed">{details[c]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MidReviewDetail({ review, isMine }: MidReviewDetailProps) {
  const router = useRouter();
  const config = ROUTINE_CONFIG[review.routineType];

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
        <span
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon(16)}
          {review.routineType}
        </span>
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
          {/* 잘 됐던 조건 */}
          <ConditionSection
            title="잘 됐던 조건"
            conditions={review.goodConditions}
            details={review.goodConditionDetails}
            chipBg="#fef3c7"
            chipColor="#d97706"
          />

          {/* 어려웠던 조건 */}
          <ConditionSection
            title="걸림돌"
            conditions={review.hardConditions}
            details={review.hardConditionDetails}
            chipBg="#fef2f2"
            chipColor="#ef4444"
          />

          {/* 초심 점검 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">초심 점검</p>
            <div className="space-y-2">
              {review.whyStarted && (
                <div className="rounded-xl p-4" style={{ backgroundColor: config.bgColor }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: config.color }}>
                    시작한 이유
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.whyStarted}</p>
                </div>
              )}
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-600 mb-1">유지할 것</p>
                <p className="text-sm text-gray-700 leading-relaxed">{review.keepDoing}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-500 mb-1">변화할 것</p>
                <p className="text-sm text-gray-700 leading-relaxed">{review.willChange}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
