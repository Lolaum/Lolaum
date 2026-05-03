import Link from "next/link";
import { FinalReview } from "@/types/routines/finalReview";
import UserAvatar from "@/components/common/UserAvatar";

interface FinalReviewItemProps {
  review: FinalReview;
  isMine?: boolean;
}

export default function FinalReviewItem({ review, isMine }: FinalReviewItemProps) {
  const previewText = review.results || review.lifeChanges;
  const choiceLabel =
    review.continuationChoice === "keep" ? "유지하고 싶다" : "조정이 필요하다";
  const choiceBg =
    review.continuationChoice === "keep" ? "#dcfce7" : "#dbeafe";
  const choiceColor =
    review.continuationChoice === "keep" ? "#16a34a" : "#2563eb";

  return (
    <Link
      href={`/final-review/${review.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: "3px solid #eab32e" }}
    >
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

        {/* 선택 칩 */}
        <div className="flex flex-wrap gap-1 mb-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: choiceBg, color: choiceColor }}
          >
            {choiceLabel}
          </span>
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
