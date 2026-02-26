"use client";

import React, { useState } from "react";
import FeedItem from "./FeedItem";
import FeedDetail from "./FeedDetail";
import { FeedItem as FeedItemType, RoutineCategory, Comment } from "@/types/feed";
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

export default function FeedContainer() {
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>("전체");
  const [feedData, setFeedData] = useState<FeedItemType[]>(feed_mock);
  const [selectedFeed, setSelectedFeed] = useState<FeedItemType | null>(null);

  // 댓글 추가 핸들러
  const handleCommentAdd = (feedId: number, comment: Comment) => {
    setFeedData((prev) =>
      prev.map((feed) =>
        feed.id === feedId
          ? { ...feed, comments: [...(feed.comments ?? []), comment] }
          : feed
      )
    );
    // 현재 열린 피드도 업데이트
    if (selectedFeed?.id === feedId) {
      setSelectedFeed((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments ?? []), comment] }
          : prev
      );
    }
  };

  // 상세 뷰 표시 중일 때
  if (selectedFeed) {
    return (
      <FeedDetail
        item={selectedFeed}
        onBack={() => setSelectedFeed(null)}
        onCommentAdd={handleCommentAdd}
      />
    );
  }

  // 필터링된 피드 데이터
  const filteredFeeds =
    selectedFilter === "전체"
      ? feedData
      : feedData.filter((feed) => feed.routineCategory === selectedFilter);

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
                onClick={() => setSelectedFilter(category)}
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
              {filteredFeeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  item={feed}
                  onClick={() => setSelectedFeed(feed)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
