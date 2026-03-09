"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import {
  BookText,
  Dumbbell,
  BookA,
  Sun,
  Languages,
  CircleDollarSign,
} from "lucide-react";
import {
  FeedItem,
  Comment,
  ExerciseFeedData,
  MorningFeedData,
  FinanceFeedData,
  LanguageFeedData,
  ReadingFeedData,
  RoutineCategory,
} from "@/types/feed";
import CommentSection from "./CommentSection";

interface FeedDetailProps {
  item: FeedItem;
}

// 디자인 시스템 기반 카테고리 메타
const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; label: string; hexColor: string; bgColor: string }
> = {
  독서: {
    icon: <BookText className="w-5 h-5" />,
    label: "독서",
    hexColor: "#6366f1",
    bgColor: "#eef2ff",
  },
  운동: {
    icon: <Dumbbell className="w-5 h-5" />,
    label: "운동",
    hexColor: "#ff8900",
    bgColor: "#fff4e5",
  },
  영어: {
    icon: <BookA className="w-5 h-5" />,
    label: "영어",
    hexColor: "#0ea5e9",
    bgColor: "#f0f9ff",
  },
  모닝: {
    icon: <Sun className="w-5 h-5" />,
    label: "모닝 루틴",
    hexColor: "#eab32e",
    bgColor: "#fefce8",
  },
  제2외국어: {
    icon: <Languages className="w-5 h-5" />,
    label: "제2외국어 학습",
    hexColor: "#10b981",
    bgColor: "#ecfdf5",
  },
  자산관리: {
    icon: <CircleDollarSign className="w-5 h-5" />,
    label: "자산관리",
    hexColor: "#10b981",
    bgColor: "#ecfdf5",
  },
};

// 카테고리별 아이콘 & 레이블
const getCategoryMeta = (category: RoutineCategory) => {
  return (
    CATEGORY_META[category] ?? {
      icon: <BookText className="w-5 h-5" />,
      label: category,
      hexColor: "#6b7280",
      bgColor: "#f3f4f6",
    }
  );
};

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

// --- 루틴별 콘텐츠 컴포넌트 ---

function ExerciseContent({ data }: { data: ExerciseFeedData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs text-orange-400 font-medium mb-1">운동 종류</p>
          <p className="text-sm font-semibold text-gray-800">
            {data.exerciseName}
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs text-orange-400 font-medium mb-1">운동 시간</p>
          <p className="text-sm font-semibold text-gray-800">
            {data.duration}분
          </p>
        </div>
      </div>
      {data.achievement && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">오늘의 소감</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.achievement}
          </p>
        </div>
      )}
    </div>
  );
}

function MorningContent({ data }: { data: MorningFeedData }) {
  return (
    <div className="space-y-4">
      {/* 컨디션 바 */}
      <div className="bg-yellow-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-yellow-500 font-medium">오늘의 컨디션</p>
          <p className="text-sm font-bold text-yellow-600">{data.condition}%</p>
        </div>
        <div className="w-full bg-yellow-200 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all"
            style={{ width: `${data.condition}%` }}
          />
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-1">
          오늘의 성공 & 한 줄 회고
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {data.successAndReflection}
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-1">
          오늘 나에게 주는 선물
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.gift}</p>
      </div>
    </div>
  );
}

function FinanceContent({ data }: { data: FinanceFeedData }) {
  const totalNecessary = data.dailyExpenses
    .flatMap((d) => d.expenses.filter((e) => e.type === "necessary"))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalEmotional = data.dailyExpenses
    .flatMap((d) => d.expenses.filter((e) => e.type === "emotional"))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* 소비 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-400 font-medium mb-1">필요소비</p>
          <p className="text-sm font-bold text-blue-600">
            {totalNecessary.toLocaleString()}원
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs text-red-400 font-medium mb-1">감정소비</p>
          <p className="text-sm font-bold text-red-500">
            {totalEmotional.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* 날짜별 소비 내역 */}
      {data.dailyExpenses.map((daily, i) => {
        const dateStr = new Date(daily.date).toLocaleDateString("ko-KR", {
          month: "numeric",
          day: "numeric",
        });
        return (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-2">
              {dateStr}
            </p>
            <div className="space-y-1.5">
              {daily.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        expense.type === "necessary"
                          ? "bg-blue-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      {expense.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {expense.amount.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 공부 내용 & 실천 */}
      {data.studyContent && (
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-500 font-medium mb-1">
            오늘의 자산관리 공부
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.studyContent}
          </p>
        </div>
      )}
      {data.practice && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">
            오늘의 실천 / 다짐
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.practice}
          </p>
        </div>
      )}
    </div>
  );
}

function LanguageContent({ data }: { data: LanguageFeedData }) {
  return (
    <div className="space-y-4">
      {data.achievement && (
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs text-purple-400 font-medium mb-1">
            오늘의 성취
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {data.achievement}
          </p>
        </div>
      )}
      {data.expressions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-2">
            오늘 배운 표현
          </p>
          <div className="space-y-2">
            {data.expressions.map((expr, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">
                    {expr.word}
                  </span>
                  <span className="text-sm text-gray-400">—</span>
                  <span className="text-sm text-gray-600">{expr.meaning}</span>
                </div>
                {expr.example && (
                  <p className="text-xs text-gray-500 italic pl-0">
                    &quot;{expr.example}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReadingContent({ data }: { data: ReadingFeedData }) {
  const isPercent = data.trackingType === "percent";
  const progress =
    data.pagesRead != null && data.totalPages
      ? Math.round((data.pagesRead / data.totalPages) * 100)
      : null;

  return (
    <div className="space-y-4">
      {/* 책 정보 */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-16 h-20 bg-orange-100 rounded-lg flex items-center justify-center">
          <BookText className="w-7 h-7 text-orange-300" />
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-gray-900">{data.bookTitle}</p>
          {data.author && (
            <p className="text-sm text-gray-500 mt-0.5">{data.author}</p>
          )}
          {progress !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">진도</span>
                <span className="text-xs font-semibold text-orange-500">
                  {isPercent
                    ? `${data.pagesRead}% (${progress}%)`
                    : `${data.pagesRead}p / ${data.totalPages}p (${progress}%)`}
                </span>
              </div>
              <div className="w-full bg-orange-100 rounded-full h-1.5">
                <div
                  className="bg-orange-400 h-1.5 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {data.progressAmount != null && (
            <p className="text-xs text-orange-400 mt-1.5 font-medium">
              오늘 +{data.progressAmount}
              {isPercent ? "%" : "p"} 읽었어요
            </p>
          )}
        </div>
      </div>

      {/* 오늘의 문장 */}
      {data.note && data.noteType === "sentence" && (
        <div className="bg-orange-50 border-l-2 border-orange-300 rounded-xl p-4">
          <p className="text-xs text-orange-400 font-medium mb-1">
            오늘의 문장
          </p>
          <p className="text-sm text-gray-700 leading-relaxed italic">
            &ldquo;{data.note}&rdquo;
          </p>
        </div>
      )}

      {/* 내용 요약 */}
      {data.note && data.noteType === "summary" && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">내용 요약</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.note}</p>
        </div>
      )}

      {/* 나만의 생각 */}
      {data.thoughts && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">나만의 생각</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.thoughts}
          </p>
        </div>
      )}

      {/* 기존 notes 필드 (하위 호환) */}
      {data.notes && !data.note && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">독서 노트</p>
          <p className="text-sm text-gray-700 leading-relaxed">{data.notes}</p>
        </div>
      )}
    </div>
  );
}

// 타입 가드 함수들
function isExerciseData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is ExerciseFeedData {
  return category === "운동" && "exerciseName" in data;
}
function isMorningData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is MorningFeedData {
  return category === "모닝" && "condition" in data;
}
function isFinanceData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is FinanceFeedData {
  return category === "자산관리" && "dailyExpenses" in data;
}
function isLanguageData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is LanguageFeedData {
  return (
    (category === "영어" || category === "제2외국어") && "expressions" in data
  );
}
function isReadingData(
  data: NonNullable<FeedItem["routineData"]>,
  category: RoutineCategory,
): data is ReadingFeedData {
  return category === "독서" && "bookTitle" in data;
}

export default function FeedDetail({ item }: FeedDetailProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(item.comments ?? []);
  const meta = getCategoryMeta(item.routineCategory);

  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: Date.now(),
      userId: 0,
      userName: "나",
      text,
      date: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      <div>
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
            style={{ backgroundColor: meta.bgColor, color: meta.hexColor }}
          >
            {meta.icon}
            {meta.label}
          </span>
        </div>

        {/* 본문 카드 */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* 유저 정보 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                {item.userName}
              </p>
              <p className="text-xs text-gray-400">
                {formatFullDate(item.date)}
              </p>
            </div>
          </div>

          {/* 루틴 콘텐츠 */}
          {item.routineData ? (
            <>
              {isExerciseData(item.routineData, item.routineCategory) && (
                <ExerciseContent data={item.routineData} />
              )}
              {isMorningData(item.routineData, item.routineCategory) && (
                <MorningContent data={item.routineData} />
              )}
              {isFinanceData(item.routineData, item.routineCategory) && (
                <FinanceContent data={item.routineData} />
              )}
              {isLanguageData(item.routineData, item.routineCategory) && (
                <LanguageContent data={item.routineData} />
              )}
              {isReadingData(item.routineData, item.routineCategory) && (
                <ReadingContent data={item.routineData} />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">기록 내용이 없습니다.</p>
          )}

          {/* 구분선 */}
          <div className="border-t border-gray-100 mt-6" />

          {/* 댓글 섹션 */}
          <CommentSection comments={comments} onAddComment={handleAddComment} />
        </div>
      </div>
    </div>
  );
}
