import React from "react";
import Link from "next/link";
import { User, BookText, Dumbbell, BookA, Sun, Languages, CircleDollarSign } from "lucide-react";
import {
  FeedItem as FeedItemType,
  RoutineCategory,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
} from "@/types/feed";

interface FeedItemProps {
  item: FeedItemType;
}

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { color: string; bgColor: string; icon: React.ReactNode }
> = {
  독서:      { color: "#6366f1", bgColor: "#eef2ff", icon: <BookText size={13} /> },
  운동:      { color: "#ff8900", bgColor: "#fff4e5", icon: <Dumbbell size={13} /> },
  영어:      { color: "#0ea5e9", bgColor: "#f0f9ff", icon: <BookA size={13} /> },
  모닝:      { color: "#eab32e", bgColor: "#fefce8", icon: <Sun size={13} /> },
  제2외국어: { color: "#10b981", bgColor: "#ecfdf5", icon: <Languages size={13} /> },
  자산관리:  { color: "#10b981", bgColor: "#ecfdf5", icon: <CircleDollarSign size={13} /> },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

// 각 루틴 타입별 미리보기 텍스트 추출
function getPreviewText(item: FeedItemType): string | null {
  if (!item.routineData) return null;
  const data = item.routineData;

  switch (item.routineCategory) {
    case "독서": {
      const d = data as ReadingFeedData;
      return d.note || d.thoughts || null;
    }
    case "운동": {
      const d = data as ExerciseFeedData;
      return d.achievement || null;
    }
    case "모닝": {
      const d = data as MorningFeedData;
      return d.successAndReflection || null;
    }
    case "영어":
    case "제2외국어": {
      const d = data as LanguageFeedData;
      return d.achievement || null;
    }
    case "자산관리": {
      const d = data as FinanceFeedData;
      return d.studyContent || null;
    }
    default:
      return null;
  }
}

// 루틴별 서브텍스트 (종목, 책 제목 등)
function getSubText(item: FeedItemType): string | null {
  if (!item.routineData) return null;
  const data = item.routineData;

  switch (item.routineCategory) {
    case "독서": {
      const d = data as ReadingFeedData;
      if (d.bookTitle) {
        const progress = d.pagesRead && d.totalPages
          ? ` · ${d.pagesRead}/${d.totalPages}p`
          : "";
        return `${d.bookTitle}${progress}`;
      }
      return null;
    }
    case "운동": {
      const d = data as ExerciseFeedData;
      return d.exerciseName ? `${d.exerciseName} · ${d.duration}분` : null;
    }
    case "모닝": {
      const d = data as MorningFeedData;
      return d.condition != null ? `컨디션 ${d.condition}점` : null;
    }
    case "영어":
    case "제2외국어": {
      const d = data as LanguageFeedData;
      return d.expressions?.length ? `표현 ${d.expressions.length}개 학습` : null;
    }
    case "자산관리": {
      const d = data as FinanceFeedData;
      const total = d.dailyExpenses.flatMap((e) => e.expenses).reduce((s, e) => s + e.amount, 0);
      return total > 0 ? `오늘 지출 ${total.toLocaleString()}원` : null;
    }
    default:
      return null;
  }
}

export default function FeedItem({ item }: FeedItemProps) {
  const config = CATEGORY_CONFIG[item.routineCategory];
  const previewText = getPreviewText(item);
  const subText = getSubText(item);

  return (
    <Link
      href={`/feeds/${item.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {/* 상단: 카테고리 뱃지 + 날짜 */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon}
          {item.routineCategory}
        </span>
        <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
      </div>

      {/* 유저 + 서브텍스트 */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{item.userName}</p>
          {subText && (
            <p className="text-xs font-medium mt-0.5" style={{ color: config.color }}>
              {subText}
            </p>
          )}
        </div>
      </div>

      {/* 미리보기 텍스트 */}
      {previewText && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 pl-0.5">
          {previewText}
        </p>
      )}

      {/* 댓글 수 */}
      {item.comments && item.comments.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1 text-xs text-gray-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>댓글 {item.comments.length}개</span>
        </div>
      )}
    </Link>
  );
}
