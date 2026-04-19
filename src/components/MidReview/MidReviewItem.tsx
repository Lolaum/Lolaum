import Link from "next/link";
import { MidReview } from "@/types/routines/midReview";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import UserAvatar from "@/components/common/UserAvatar";

interface MidReviewItemProps {
  review: MidReview;
  isMine?: boolean;
}

export default function MidReviewItem({ review, isMine }: MidReviewItemProps) {
  const config = ROUTINE_CONFIG[review.routineType];

  // 미리보기: 잘 됐던 조건 칩 + keepDoing 텍스트
  const previewText = review.keepDoing || review.whyStarted;

  return (
    <Link
      href={`/mid-review/${review.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {/* 컬러 배경 헤더 */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: config.bgColor }}
      >
        <span style={{ color: config.color }}>{config.icon(16)}</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: config.color }}
        >
          {config.label}
        </span>
      </div>

      <div className="p-4">
        {/* 유저 정보 */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <UserAvatar avatarUrl={review.avatarUrl} emoji={review.userEmoji} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {review.userName}
              </p>
              {isMine && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: "#eab32e" }}
                >
                  나
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 조건 칩 미리보기 */}
        <div className="flex flex-wrap gap-1 mb-2">
          {review.goodConditions.slice(0, 2).map((c) => (
            <span
              key={c}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              {c}
            </span>
          ))}
          {review.hardConditions.slice(0, 1).map((c) => (
            <span
              key={c}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-400"
            >
              {c}
            </span>
          ))}
        </div>

        {/* 미리보기 텍스트 */}
        {previewText && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 pl-0.5">
            {previewText}
          </p>
        )}
      </div>
    </Link>
  );
}
