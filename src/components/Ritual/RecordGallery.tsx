"use client";

import React, { useState } from "react";
import { BookText, Dumbbell, BookA, Sun, Languages, CircleDollarSign } from "lucide-react";
import {
  FeedItem,
  RoutineCategory,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
} from "@/types/feed";
import { myGalleryRecords } from "@/mock/ritualmock";

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { color: string; bgColor: string; label: string; icon: React.ReactNode }
> = {
  독서: {
    color: "#6366f1",
    bgColor: "#eef2ff",
    label: "독서",
    icon: <BookText size={14} />,
  },
  운동: {
    color: "#ff8900",
    bgColor: "#fff4e5",
    label: "운동",
    icon: <Dumbbell size={14} />,
  },
  영어: {
    color: "#0ea5e9",
    bgColor: "#f0f9ff",
    label: "영어",
    icon: <BookA size={14} />,
  },
  모닝: {
    color: "#eab32e",
    bgColor: "#fefce8",
    label: "모닝",
    icon: <Sun size={14} />,
  },
  언어: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    label: "언어",
    icon: <Languages size={14} />,
  },
  자산관리: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    label: "자산관리",
    icon: <CircleDollarSign size={14} />,
  },
};

const FILTERS: (RoutineCategory | "전체")[] = [
  "전체",
  "독서",
  "운동",
  "모닝",
  "영어",
  "자산관리",
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

// ── 카드 내용 렌더러 ──

function ReadingCardContent({ data }: { data: ReadingFeedData }) {
  const progress = data.pagesRead && data.totalPages
    ? Math.round((data.pagesRead / data.totalPages) * 100)
    : 0;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-gray-900 text-sm leading-tight">{data.bookTitle}</p>
        <p className="text-xs text-gray-400 mt-0.5">{data.author}</p>
      </div>

      {/* 진행도 바 */}
      {data.pagesRead && data.totalPages && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{data.pagesRead}p / {data.totalPages}p</span>
            <span className="font-medium" style={{ color: "#6366f1" }}>
              +{data.progressAmount}p
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: "#6366f1" }}
            />
          </div>
        </div>
      )}

      {/* 오늘의 문장 */}
      {data.note && (
        <div
          className="rounded-xl p-3 relative"
          style={{ backgroundColor: "#eef2ff" }}
        >
          <span className="absolute -top-1 left-3 text-2xl leading-none" style={{ color: "#6366f1", opacity: 0.4 }}>
            ❝
          </span>
          <p className="text-xs text-gray-600 leading-relaxed pt-1 line-clamp-3">
            {data.note}
          </p>
        </div>
      )}

      {/* 나만의 생각 */}
      {data.thoughts && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{data.thoughts}</p>
      )}
    </div>
  );
}

function ExerciseCardContent({ data }: { data: ExerciseFeedData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-bold"
          style={{ color: "#ff8900" }}
        >
          {data.exerciseName}
        </span>
        <span className="text-xs text-gray-400">·</span>
        <span className="text-xs text-gray-500">{data.duration}분</span>
      </div>

      {/* 시간 시각화 */}
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: Math.min(Math.ceil(data.duration / 10), 10) }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded"
            style={{ backgroundColor: i < Math.floor(data.duration / 10) ? "#ff8900" : "#ffe0b2" }}
          />
        ))}
        <span className="text-xs text-gray-400 self-center ml-1">{data.duration}분</span>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{data.achievement}</p>
    </div>
  );
}

function MorningCardContent({ data }: { data: MorningFeedData }) {
  const conditionColor =
    data.condition >= 80 ? "#10b981" :
    data.condition >= 60 ? "#eab32e" :
    "#f97316";

  return (
    <div className="space-y-3">
      {/* 컨디션 점수 */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: conditionColor }}
        >
          {data.condition}
        </div>
        <div>
          <p className="text-xs text-gray-400">오늘의 컨디션</p>
          <div className="flex mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-1.5 rounded-full mr-0.5"
                style={{
                  backgroundColor: i < Math.round(data.condition / 20) ? conditionColor : "#e5e7eb",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
        {data.successAndReflection}
      </p>

      {data.gift && (
        <div className="flex items-start gap-1.5 bg-amber-50 rounded-xl p-2.5">
          <span className="text-sm">🎁</span>
          <p className="text-xs text-amber-700 leading-relaxed">{data.gift}</p>
        </div>
      )}
    </div>
  );
}

function LanguageCardContent({ data }: { data: LanguageFeedData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-700">{data.achievement}</p>
      <div className="flex flex-wrap gap-1.5">
        {data.expressions.slice(0, 3).map((expr, i) => (
          <div key={i} className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "#f0f9ff" }}>
            <p className="text-xs font-semibold" style={{ color: "#0ea5e9" }}>{expr.word}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{expr.meaning}</p>
          </div>
        ))}
        {data.expressions.length > 3 && (
          <div className="rounded-lg px-2.5 py-1.5 bg-gray-100 flex items-center">
            <p className="text-xs text-gray-400">+{data.expressions.length - 3}개</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceCardContent({ data }: { data: FinanceFeedData }) {
  const allExpenses = data.dailyExpenses.flatMap((d) => d.expenses);
  const total = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const necessary = allExpenses.filter((e) => e.type === "necessary").reduce((s, e) => s + e.amount, 0);
  const emotional = allExpenses.filter((e) => e.type === "emotional").reduce((s, e) => s + e.amount, 0);
  const emotionalPercent = total > 0 ? Math.round((emotional / total) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 지출 요약 */}
      <div>
        <p className="text-lg font-bold text-gray-900">{total.toLocaleString()}원</p>
        <div className="flex gap-3 mt-1">
          <span className="text-xs text-gray-400">필수 <span className="text-gray-600 font-medium">{necessary.toLocaleString()}</span></span>
          <span className="text-xs text-gray-400">감성 <span style={{ color: "#f97316" }} className="font-medium">{emotional.toLocaleString()}</span></span>
        </div>
      </div>

      {/* 감성소비 비율 바 */}
      <div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${emotionalPercent}%`, backgroundColor: "#f97316" }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">감성소비 {emotionalPercent}%</p>
      </div>

      {data.studyContent && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{data.studyContent}</p>
      )}
    </div>
  );
}

// ── 갤러리 카드 ──

function GalleryCard({ item }: { item: FeedItem }) {
  const config = CATEGORY_CONFIG[item.routineCategory];

  const renderContent = () => {
    switch (item.routineCategory) {
      case "독서":
        return <ReadingCardContent data={item.routineData as ReadingFeedData} />;
      case "운동":
        return <ExerciseCardContent data={item.routineData as ExerciseFeedData} />;
      case "모닝":
        return <MorningCardContent data={item.routineData as MorningFeedData} />;
      case "영어":
      case "언어":
        return <LanguageCardContent data={item.routineData as LanguageFeedData} />;
      case "자산관리":
        return <FinanceCardContent data={item.routineData as FinanceFeedData} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${config.color}` }}
    >
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon}
          {config.label}
        </span>
        <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
      </div>

      {/* 카드 내용 */}
      {item.routineData && renderContent()}
    </div>
  );
}

// ── 메인 갤러리 ──

export default function RecordGallery() {
  const [activeFilter, setActiveFilter] = useState<RoutineCategory | "전체">("전체");

  const filtered =
    activeFilter === "전체"
      ? myGalleryRecords
      : myGalleryRecords.filter((r) => r.routineCategory === activeFilter);

  return (
    <div>
      {/* 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4 scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f;
          const config = f !== "전체" ? CATEGORY_CONFIG[f] : null;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={
                isActive
                  ? {
                      backgroundColor: config ? config.color : "#eab32e",
                      color: "#fff",
                    }
                  : {
                      backgroundColor: "#f3f4f6",
                      color: "#6b7280",
                    }
              }
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* 기록 수 */}
      <p className="text-xs text-gray-400 mb-3 px-1">
        총 <span className="font-semibold text-gray-600">{filtered.length}</span>개의 기록
      </p>

      {/* 2열 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm">아직 기록이 없어요</p>
          <p className="text-xs mt-1">리추얼을 완료하면 기록이 쌓여요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
