"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FinalReview } from "@/types/routines/finalReview";
import { getAllFinalReviews } from "@/api/final-review";
import FinalReviewItem from "./FinalReviewItem";

const PAGE_SIZE = 10;

export default function FinalReviewContainer() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [allReviews, setAllReviews] = useState<FinalReview[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      const res = await getAllFinalReviews();
      setAllReviews(res.data ?? []);
      setCurrentUserId(res.currentUserId ?? "");
      setLoading(false);
    }
    fetchReviews();
  }, []);

  const totalPages = Math.max(1, Math.ceil(allReviews.length / PAGE_SIZE));
  const visible = allReviews.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-8">
      {/* 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">최종 회고</h1>
          </div>
          <button
            onClick={() => router.push("/final-review/write")}
            className="px-4 py-2 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md flex items-center gap-1.5"
            style={{ backgroundColor: "#eab32e" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            작성하기
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin mb-3" />
          <p className="text-sm">최종 회고를 불러오는 중...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* 카드 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {visible.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm font-medium">아직 최종 회고가 없어요</p>
              </div>
            ) : (
              visible.map((review) => (
                <FinalReviewItem
                  key={review.id}
                  review={review}
                  isMine={review.userId === currentUserId}
                />
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-[var(--gold-400)] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
