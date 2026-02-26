"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FeedItem from "./FeedItem";
import { FeedItem as FeedItemType, RoutineCategory } from "@/types/feed";
import feed_mock from "@/mock/feedmock";

type FilterCategory = "전체" | RoutineCategory;

const filterCategories: FilterCategory[] = [
  "전체",
  "독서",
  "운동",
  "영어",
  "모닝",
  "언어",
  "자산관리",
];

const ITEMS_PER_PAGE = 7;

export default function FeedContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedFilter = (searchParams.get("filter") ?? "전체") as FilterCategory;
  const currentPage = Number(searchParams.get("page") ?? "1");

  const feedData: FeedItemType[] = feed_mock;

  // 필터링된 피드 데이터
  const filteredFeeds =
    selectedFilter === "전체"
      ? feedData
      : feedData.filter((feed) => feed.routineCategory === selectedFilter);

  const totalPages = Math.max(1, Math.ceil(filteredFeeds.length / ITEMS_PER_PAGE));
  const pagedFeeds = filteredFeeds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateParams = (filter: FilterCategory, page: number) => {
    const params = new URLSearchParams();
    if (filter !== "전체") params.set("filter", filter);
    if (page !== 1) params.set("page", String(page));
    const query = params.toString();
    router.replace(query ? `/feeds?${query}` : "/feeds");
  };

  const handleFilterChange = (category: FilterCategory) => {
    updateParams(category, 1);
  };

  const handlePageChange = (page: number) => {
    updateParams(selectedFilter, page);
  };

  return (
    <div className="w-full px-4 py-3 sm:px-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl scale-[0.8] origin-top">
        {/* 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6 mt-6">
          인증 피드
        </h1>

        {/* 필터 칩 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  selectedFilter === category
                    ? "bg-[var(--gold-400)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 피드 목록 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {filteredFeeds.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>아직 피드가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pagedFeeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  item={feed}
                />
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === page
                    ? "bg-[var(--gold-400)] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
