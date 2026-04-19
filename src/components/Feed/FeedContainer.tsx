"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import FeedItem from "./FeedItem";
import { FeedItem as FeedItemType } from "@/types/feed";
import { getAllRecordsForDisplay } from "@/api/ritual-records-display";
import type { RoutineTypeDB } from "@/types/supabase";

type FilterKey = "all" | RoutineTypeDB;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "reading", label: "독서" },
  { key: "exercise", label: "운동" },
  { key: "morning", label: "모닝" },
  { key: "english", label: "영어" },
  { key: "second_language", label: "제2외국어" },
  { key: "recording", label: "기록" },
  { key: "finance", label: "자산관리" },
  { key: "english_book", label: "원서읽기" },
];

const ITEMS_PER_PAGE = 8;

export default function FeedContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedFilter = (searchParams.get("filter") ?? "all") as FilterKey;
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [feedData, setFeedData] = useState<FeedItemType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    const routineType: RoutineTypeDB | undefined =
      selectedFilter !== "all" ? selectedFilter : undefined;

    const { data, total } = await getAllRecordsForDisplay({
      routineType,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    });
    setFeedData(data);
    setTotalCount(total);
    setLoading(false);
  }, [selectedFilter, currentPage]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const filteredFeeds = feedData;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const pagedFeeds = filteredFeeds;

  const updateParams = (filter: FilterKey, page: number) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (page !== 1) params.set("page", String(page));
    const query = params.toString();
    router.replace(query ? `/feeds?${query}` : "/feeds");
  };

  const handleFilterChange = (key: FilterKey) => {
    updateParams(key, 1);
  };

  const handlePageChange = (page: number) => {
    updateParams(selectedFilter, page);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-8">
      {/* 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs text-gray-400 font-medium mb-0.5">
          팀원들의 기록
        </p>
        <h1 className="text-xl font-bold text-gray-900">인증 피드</h1>
      </div>

      {/* 필터 칩 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              selectedFilter === key
                ? "bg-[var(--gold-400)] text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 피드 목록 */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin mx-auto mb-3" />
            <p className="text-sm">피드를 불러오는 중...</p>
          </div>
        ) : filteredFeeds.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm">아직 피드가 없습니다.</p>
          </div>
        ) : (
          pagedFeeds.map((feed) => (
            <FeedItem key={String(feed.id)} item={feed} />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                currentPage === page
                  ? "bg-[var(--gold-400)] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
