"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MidReview, MidReviewCondition } from "@/types/routines/midReview";
import { RoutineType } from "@/types/routines/declaration";
import { getMyMidReviews, getChallengerMidReviews } from "@/api/mid-review";

const PAGE_SIZE = 8;

const routineEmojis: Record<RoutineType, string> = {
  모닝리추얼: "🌅",
  운동리추얼: "💪",
  독서리추얼: "📚",
  영어리추얼: "🇺🇸",
  제2외국어리추얼: "🌍",
  기록리추얼: "✍️",
  자산관리리추얼: "💰",
  원서읽기리추얼: "📖",
};

const allRoutineTypes = Object.keys(routineEmojis) as RoutineType[];

function ConditionChip({ label }: { label: MidReviewCondition }) {
  return (
    <span
      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
    >
      {label}
    </span>
  );
}

function MidReviewCard({ review }: { review: MidReview }) {
  return (
    <div className="rounded-3xl p-5 bg-white shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
          {review.userEmoji ?? "👤"}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{review.userName}</p>
          <p className="text-xs text-gray-400">
            {routineEmojis[review.routineType]} {review.routineType}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* 잘 됐던 조건 */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">잘 됐던 조건</p>
          <div className="flex flex-col gap-1.5">
            {review.goodConditions.map((c) => (
              <div key={c}>
                <ConditionChip label={c} />
                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                  {review.goodConditionDetails[c]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 어려웠던 조건 */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">걸림돌</p>
          <div className="flex flex-col gap-1.5">
            {review.hardConditions.map((c) => (
              <div key={c}>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                  {c}
                </span>
                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                  {review.hardConditionDetails[c]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 초심 */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 mb-0.5">앞으로의 방향</p>
          <p className="text-xs text-gray-600">
            <span className="font-medium text-green-600">유지 ·</span> {review.keepDoing}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium text-blue-500">변화 ·</span> {review.willChange}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MidReviewContainer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoutineType | "전체">("전체");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [myReviews, setMyReviews] = useState<MidReview[]>([]);
  const [challengerReviews, setChallengerReviews] = useState<MidReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      const [mineRes, challengerRes] = await Promise.all([
        getMyMidReviews(),
        getChallengerMidReviews(),
      ]);
      setMyReviews(mineRes.data ?? []);
      setChallengerReviews(challengerRes.data ?? []);
      setLoading(false);
    }
    fetchReviews();
  }, []);

  const availableTypes = allRoutineTypes.filter((type) =>
    [...myReviews, ...challengerReviews].some((r) => r.routineType === type)
  );

  const filteredChallengers =
    activeTab === "전체"
      ? challengerReviews
      : challengerReviews.filter((r) => r.routineType === activeTab);

  // 내가 작성한 회고: 전체 탭에선 작성한 모든 리추얼, 그 외엔 해당 루틴만
  const filteredMine: MidReview[] =
    activeTab === "전체"
      ? myReviews
      : myReviews.filter((r) => r.routineType === activeTab);
  const hasNoMyReview = myReviews.length === 0;

  const visibleChallengers = filteredChallengers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredChallengers.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800">중간 회고</h1>
          <p className="text-xs text-gray-400">10~13일차 · 챌린저들의 중간 점검</p>
        </div>
        <button
          onClick={() => router.push("/mid-review/write")}
          className="px-4 py-2 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md flex items-center gap-1.5"
          style={{ backgroundColor: "#eab32e" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          작성하기
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={24} className="animate-spin mb-3" />
          <p className="text-sm">중간 회고를 불러오는 중...</p>
        </div>
      )}

      {!loading && <>
      {/* 탭 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveTab("전체")}
          className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
            activeTab === "전체"
              ? "text-white"
              : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
          style={activeTab === "전체" ? { backgroundColor: "#eab32e" } : {}}
        >
          전체
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
              activeTab === type
                ? "text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
            style={activeTab === type ? { backgroundColor: "#eab32e" } : {}}
          >
            {routineEmojis[type]} {type.replace("리추얼", "")}
          </button>
        ))}
      </div>

      {/* 나의 중간 회고 */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          나의 중간 회고
        </h2>

        {filteredMine.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredMine.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl p-5 bg-white shadow-sm"
                style={{ border: "2px solid #eab32e" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{routineEmojis[review.routineType]}</span>
                  <span className="text-base font-bold text-gray-800">{review.routineType}</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">잘 됐던 조건</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {review.goodConditions.map((c) => (
                        <ConditionChip key={c} label={c} />
                      ))}
                    </div>
                    {review.goodConditions.map((c) => (
                      <div key={c} className="mb-1">
                        <span className="text-[10px] text-gray-400">{c} · </span>
                        <span className="text-xs text-gray-700">{review.goodConditionDetails[c]}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">걸림돌</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {review.hardConditions.map((c) => (
                        <span
                          key={c}
                          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-400"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    {review.hardConditions.map((c) => (
                      <div key={c} className="mb-1">
                        <span className="text-[10px] text-gray-400">{c} · </span>
                        <span className="text-xs text-gray-700">{review.hardConditionDetails[c]}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">초심 점검</p>
                    <p className="text-xs text-gray-600 mb-1">{review.whyStarted}</p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-green-600">유지 ·</span> {review.keepDoing}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-blue-500">변화 ·</span> {review.willChange}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hasNoMyReview ? (
          <div
            className="rounded-3xl p-5 bg-white border-2 border-dashed flex flex-col items-center gap-3 py-8"
            style={{ borderColor: "#eab32e" }}
          >
            <span className="text-3xl">✍️</span>
            <p className="text-sm font-semibold text-gray-500">아직 중간 회고를 작성하지 않았어요</p>
            <button
              onClick={() => router.push("/mid-review/write")}
              className="px-5 py-2 rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: "#eab32e" }}
            >
              지금 작성하기
            </button>
          </div>
        ) : (
          <div className="rounded-3xl p-5 bg-white border border-gray-100 flex flex-col items-center gap-2 py-8">
            <p className="text-sm text-gray-400">선택한 리추얼 타입의 회고가 없어요</p>
          </div>
        )}
      </section>

      {/* 챌린저 중간 회고 */}
      {filteredChallengers.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            챌린저 중간 회고
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleChallengers.map((review) => (
              <MidReviewCard key={review.id} review={review} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-8" />

          {hasMore && (
            <div className="flex justify-center py-4">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ backgroundColor: "#eab32e", animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {filteredChallengers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <span className="text-4xl mb-3">💭</span>
          <p className="text-sm font-medium">아직 중간 회고가 없어요</p>
        </div>
      )}
      </>}
    </div>
  );
}
