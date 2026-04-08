"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Dumbbell, BookA, BookText, Sun, CircleDollarSign, Languages, Flame, Loader2 } from "lucide-react";
import {
  financeInsightData,
  exerciseInsightData,
  morningInsightData,
  languageInsightData,
  secondLanguageInsightData,
  myRoutineStats,
} from "@/mock/ritualmock";
import { getMyRecordsForDisplay } from "@/api/ritual-records-display";
import { getBooksAuto } from "@/api/book";
import type { RoutineTypeDB } from "@/types/supabase";
import type {
  FeedItem,
  RoutineCategory,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
} from "@/types/feed";

// ─────────────────────────────
// 달성 카드 (공통)
// ─────────────────────────────
function AchievementCard({ name, color }: { name: string; color: string }) {
  const stat = myRoutineStats.find((r) => r.name === name);
  if (!stat) return null;
  const { streak, totalDays } = stat;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        이달의 {name} 리추얼 달성
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={`${(totalDays / 30) * 188.5} 188.5`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-800">{totalDays}</span>
            <span className="text-[10px] text-gray-400">/ 30일</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Flame size={14} style={{ color }} />
            <span className="text-xs text-gray-600">
              현재{" "}
              <span className="font-bold" style={{ color }}>
                {streak}일
              </span>{" "}
              연속 중
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            이달 목표 30일 중 {totalDays}일 달성!
            <br />
            {30 - totalDays}일 남았어요 💪
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 독서 인사이트
// ─────────────────────────────
function ReadingInsight() {
  const [books, setBooks] = useState<{ id: string; title: string; author: string; currentValue: number; totalValue: number; trackingType: string; coverImageUrl: string | null; isCompleted: boolean }[]>([]);
  const [totalSentences, setTotalSentences] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [booksResult, recordsResult] = await Promise.all([
        getBooksAuto("reading"),
        getMyRecordsForDisplay({ routineType: "reading" }),
      ]);

      if (booksResult.data) {
        setBooks(booksResult.data.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          currentValue: b.current_value,
          totalValue: b.total_value,
          trackingType: b.tracking_type,
          coverImageUrl: b.cover_image_url,
          isCompleted: b.is_completed,
        })));
      }

      // 기록 수 = 문장 수
      setTotalSentences(recordsResult.data?.length ?? 0);
      setLoading(false);
    }
    fetchData();
  }, []);

  const completedCount = books.filter((b) => b.isCompleted).length;
  const currentBooks = books.filter((b) => !b.isCompleted);

  if (loading) {
    return (
      <div className="space-y-4">
        <AchievementCard name="독서" color="#6366f1" />
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AchievementCard name="독서" color="#6366f1" />
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "완독", value: `${completedCount}권`, color: "#6366f1" },
          {
            label: "기록 문장",
            value: `${totalSentences}개`,
            color: "#a78bfa",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-lg font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 현재 읽는 책 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          읽는 중인 책
        </h3>
        {currentBooks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            현재 읽고 있는 책이 없어요
          </p>
        ) : (
          <div className="space-y-4">
            {currentBooks.map((book) => {
              const percent = book.totalValue > 0
                ? Math.round((book.currentValue / book.totalValue) * 100)
                : 0;
              return (
                <div key={book.id} className="flex gap-3">
                  {/* 책 표지 */}
                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    {book.coverImageUrl ? (
                      <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center">
                        <span className="text-white text-[7px]">표지</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {book.title}
                        </p>
                        <p className="text-xs text-gray-400">{book.author}</p>
                      </div>
                      <span className="text-sm font-bold text-indigo-500 flex-shrink-0 ml-2">
                        {percent}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-indigo-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {book.trackingType === "percent"
                        ? `${book.currentValue}% 진행`
                        : `${book.currentValue}p / ${book.totalValue}p`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 완독한 책 */}
      {completedCount > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            완독한 책
          </h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {books.filter((b) => b.isCompleted).map((book) => (
              <div key={book.id} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className="w-12 h-16 rounded-lg overflow-hidden shadow-sm ring-2 ring-indigo-400">
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center">
                      <span className="text-white text-[7px]">완독</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 max-w-[60px] truncate">{book.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────
// 운동 인사이트
// ─────────────────────────────
function ExerciseInsight() {
  const { totalMinutes, totalSessions, avgMinutes, exercises, last4Weeks } =
    exerciseInsightData;

  return (
    <div className="space-y-4">
      <AchievementCard name="운동" color="#ff8900" />
      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "총 운동 횟수",
            value: `${totalSessions}회`,
            color: "#ff8900",
          },
          {
            label: "총 운동 시간",
            value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
            color: "#ff9c28",
          },
          { label: "평균 시간", value: `${avgMinutes}분`, color: "#ffb15a" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 운동 종류 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          운동 종류별 현황
        </h3>
        <div className="space-y-3">
          {exercises.map((ex) => {
            const maxMinutes = exercises[0].totalMinutes;
            const percent = Math.round((ex.totalMinutes / maxMinutes) * 100);
            return (
              <div key={ex.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{ex.name}</span>
                  <span className="text-gray-400">
                    {ex.count}회 · {ex.totalMinutes}분
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: "#ff8900" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 모닝 인사이트
// ─────────────────────────────
function MorningInsight() {
  const { avgCondition, sleepTrend, avgSleepHours } = morningInsightData;

  const conditionLevel =
    avgCondition >= 80 ? "상" : avgCondition >= 60 ? "중" : "하";
  const conditionColor =
    avgCondition >= 80 ? "#10b981" : avgCondition >= 60 ? "#eab32e" : "#f97316";

  return (
    <div className="space-y-4">
      <AchievementCard name="모닝" color="#eab32e" />

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "평균 컨디션",
            value: conditionLevel,
            color: conditionColor,
          },
          { label: "평균 수면", value: avgSleepHours, color: "#f3c75c" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 수면 시간 트렌드 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Sun size={15} style={{ color: "#eab32e" }} />
          <h3 className="text-sm font-semibold text-gray-700">
            수면 시간 트렌드
          </h3>
        </div>

        {/* 라인 차트 (SVG) */}
        <div className="h-32 relative">
          <svg
            viewBox={`0 0 ${sleepTrend.length * 20} 80`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* 그리드 라인 (6h / 7h / 8h) */}
            {[6, 7, 8].map((h) => (
              <line
                key={h}
                x1="0"
                y1={80 - ((h - 5) / 5) * 72}
                x2={sleepTrend.length * 20}
                y2={80 - ((h - 5) / 5) * 72}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* 영역 채우기 */}
            <defs>
              <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab32e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#eab32e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={[
                `0,80`,
                ...sleepTrend.map(
                  (v: number, i: number) =>
                    `${i * 20 + 10},${80 - ((v - 5) / 5) * 72}`,
                ),
                `${(sleepTrend.length - 1) * 20 + 10},80`,
              ].join(" ")}
              fill="url(#sleepGrad)"
            />

            {/* 라인 */}
            <polyline
              points={sleepTrend
                .map(
                  (v: number, i: number) =>
                    `${i * 20 + 10},${80 - ((v - 5) / 5) * 72}`,
                )
                .join(" ")}
              fill="none"
              stroke="#eab32e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 포인트 */}
            {sleepTrend.map((v: number, i: number) => (
              <circle
                key={i}
                cx={i * 20 + 10}
                cy={80 - ((v - 5) / 5) * 72}
                r="3"
                fill="white"
                stroke="#eab32e"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-300">
            {(() => {
              const d = new Date();
              d.setDate(d.getDate() - sleepTrend.length + 1);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            })()}
          </span>
          <span className="text-[10px] text-gray-300">
            {(() => {
              const d = new Date();
              return `${d.getMonth() + 1}/${d.getDate()}`;
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 영어 인사이트
// ─────────────────────────────
function LanguageInsight() {
  const { totalExpressions, streak, totalDays, recentExpressions } =
    languageInsightData;

  return (
    <div className="space-y-4">
      <AchievementCard name="영어" color="#0ea5e9" />
      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "학습 표현",
            value: `${totalExpressions}개`,
            color: "#0ea5e9",
          },
          { label: "총 학습일", value: `${totalDays}일`, color: "#7dd3fc" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 최근 학습 표현 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <BookA size={15} style={{ color: "#0ea5e9" }} />
          <h3 className="text-sm font-semibold text-gray-700">
            최근 학습 표현
          </h3>
        </div>
        <div className="space-y-2.5">
          {recentExpressions.map((expr, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ backgroundColor: "#f0f9ff" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "#0ea5e9" }}
              >
                {i + 1}
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#0369a1" }}
                >
                  {expr.word}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{expr.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 제2외국어 인사이트
// ─────────────────────────────
function SecondLanguageInsight() {
  const { totalExpressions, totalDays, language, recentExpressions } =
    secondLanguageInsightData;

  return (
    <div className="space-y-4">
      <AchievementCard name="제2외국어" color="#8b5cf6" />
      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "학습 표현",
            value: `${totalExpressions}개`,
            color: "#8b5cf6",
          },
          { label: "총 학습일", value: `${totalDays}일`, color: "#a78bfa" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 최근 학습 표현 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <BookA size={15} style={{ color: "#8b5cf6" }} />
          <h3 className="text-sm font-semibold text-gray-700">
            최근 {language} 학습 표현
          </h3>
        </div>
        <div className="space-y-2.5">
          {recentExpressions.map((expr, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ backgroundColor: "#f5f3ff" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "#8b5cf6" }}
              >
                {i + 1}
              </span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#6d28d9" }}
                >
                  {expr.word}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{expr.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 자산관리 인사이트
// ─────────────────────────────
function FinanceInsight() {
  const { currentMonth, weeklySpending } = financeInsightData;
  const emotionalPercent = Math.round(
    (currentMonth.emotional / currentMonth.total) * 100,
  );
  const necessaryPercent = 100 - emotionalPercent;
  const maxWeekly = Math.max(...weeklySpending.map((w) => w.amount));

  return (
    <div className="space-y-4">
      <AchievementCard name="자산관리" color="#10b981" />
      {/* 이달 지출 요약 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <CircleDollarSign size={15} style={{ color: "#10b981" }} />
          <h3 className="text-sm font-semibold text-gray-700">
            이달 소비 현황
          </h3>
        </div>
        <p className="text-2xl font-bold text-gray-900 mb-1">
          {currentMonth.total.toLocaleString()}
          <span className="text-base font-medium text-gray-400 ml-1">원</span>
        </p>
        <div className="flex gap-4 text-xs text-gray-500 mb-4">
          <span>
            필수 소비{" "}
            <span className="font-semibold text-gray-700">
              {currentMonth.necessary.toLocaleString()}원
            </span>
          </span>
          <span>
            감성 소비{" "}
            <span className="font-semibold" style={{ color: "#f97316" }}>
              {currentMonth.emotional.toLocaleString()}원
            </span>
          </span>
        </div>

        {/* 필수/감성 비율 바 */}
        <div className="h-3 rounded-full overflow-hidden flex">
          <div
            className="h-full"
            style={{
              width: `${necessaryPercent}%`,
              backgroundColor: "#10b981",
            }}
          />
          <div
            className="h-full"
            style={{
              width: `${emotionalPercent}%`,
              backgroundColor: "#f97316",
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1 text-gray-400">
          <span>필수 {necessaryPercent}%</span>
          <span>감성 {emotionalPercent}%</span>
        </div>
      </div>

      {/* 주간 지출 바 차트 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          주간 지출 추이
        </h3>
        <div className="flex items-end gap-3 justify-around h-28">
          {weeklySpending.map((w) => {
            const heightPercent = (w.amount / maxWeekly) * 100;
            const isHighest = w.amount === maxWeekly;
            return (
              <div
                key={w.week}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: isHighest ? "#f97316" : "#10b981" }}
                >
                  {(w.amount / 10000).toFixed(0)}만
                </span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${heightPercent * 0.8}px`,
                    minHeight: "8px",
                    backgroundColor: isHighest ? "#f97316" : "#6ee7b7",
                  }}
                />
                <span className="text-[10px] text-gray-400">{w.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 카테고리 분석 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          카테고리별 지출
        </h3>
        <div className="space-y-3">
          {currentMonth.categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <span className="text-gray-400">
                  {cat.amount.toLocaleString()}원 · {cat.percent}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cat.percent}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 탭 → routine_type 매핑
// ─────────────────────────────
const TAB_TO_ROUTINE: Record<string, RoutineTypeDB> = {
  독서: "reading",
  운동: "exercise",
  모닝: "morning",
  영어: "english",
  제2외국어: "second_language",
  자산관리: "finance",
};

const CATEGORY_CONFIG: Record<
  RoutineCategory,
  { color: string; bgColor: string; icon: React.ReactNode }
> = {
  독서: { color: "#6366f1", bgColor: "#eef2ff", icon: <BookText size={13} /> },
  운동: { color: "#ff8900", bgColor: "#fff4e5", icon: <Dumbbell size={13} /> },
  영어: { color: "#0ea5e9", bgColor: "#f0f9ff", icon: <BookA size={13} /> },
  모닝: { color: "#eab32e", bgColor: "#fefce8", icon: <Sun size={13} /> },
  제2외국어: { color: "#8b5cf6", bgColor: "#f5f3ff", icon: <Languages size={13} /> },
  자산관리: { color: "#10b981", bgColor: "#ecfdf5", icon: <CircleDollarSign size={13} /> },
};

// 최근 기록 카드 (리추얼별)
function RecordPreviewCard({ item }: { item: FeedItem }) {
  const config = CATEGORY_CONFIG[item.routineCategory];
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}.${day}`;
  };

  const renderSummary = () => {
    if (!item.routineData) return null;
    switch (item.routineCategory) {
      case "독서": {
        const d = item.routineData as ReadingFeedData;
        return (
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-gray-800">{d.bookTitle}</p>
            {d.progressAmount && (
              <p className="text-xs" style={{ color: config.color }}>+{d.progressAmount}p 읽음</p>
            )}
            {d.note && <p className="text-xs text-gray-500 line-clamp-2">{d.note}</p>}
          </div>
        );
      }
      case "운동": {
        const d = item.routineData as ExerciseFeedData;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: config.color }}>{d.exerciseName}</span>
              <span className="text-xs text-gray-400">{d.duration}분</span>
            </div>
            {d.achievement && <p className="text-xs text-gray-500 line-clamp-2">{d.achievement}</p>}
          </div>
        );
      }
      case "모닝": {
        const d = item.routineData as MorningFeedData;
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">수면 {d.sleepHours}h</span>
              <span className="text-xs text-gray-400">컨디션 {d.condition}</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{d.successAndReflection}</p>
          </div>
        );
      }
      case "영어":
      case "제2외국어": {
        const d = item.routineData as LanguageFeedData;
        return (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">{d.achievement}</p>
            {d.expressions?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.expressions.slice(0, 2).map((expr, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: config.bgColor, color: config.color }}>
                    {expr.word}
                  </span>
                ))}
                {d.expressions.length > 2 && (
                  <span className="text-[10px] text-gray-400">+{d.expressions.length - 2}개</span>
                )}
              </div>
            )}
          </div>
        );
      }
      case "자산관리": {
        const d = item.routineData as FinanceFeedData;
        const total = d.dailyExpenses?.flatMap((e) => e.expenses).reduce((s, e) => s + e.amount, 0) ?? 0;
        return (
          <div className="space-y-1.5">
            {total > 0 && <p className="text-sm font-semibold text-gray-800">{total.toLocaleString()}원</p>}
            {d.studyContent && <p className="text-xs text-gray-500 line-clamp-2">{d.studyContent}</p>}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white rounded-xl p-3 border border-gray-100"
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400">{formatDate(item.date)}</span>
      </div>
      {renderSummary()}
    </div>
  );
}

// 최근 기록 리스트 컴포넌트
function RecentRecords({ routineType, tabName }: { routineType: RoutineTypeDB; tabName: string }) {
  const [records, setRecords] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      const { data } = await getMyRecordsForDisplay({
        routineType,
        limit: 5,
      });
      setRecords(data);
      setLoading(false);
    }
    fetchRecords();
  }, [routineType]);

  const config = CATEGORY_CONFIG[tabName as RoutineCategory];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 기록</h3>
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">기록을 불러오는 중...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-xs">아직 기록이 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <RecordPreviewCard key={String(record.id)} item={record} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────
interface RoutineInsightsProps {
  activeTab: string;
}

export default function RoutineInsights({ activeTab }: RoutineInsightsProps) {
  const routineType = TAB_TO_ROUTINE[activeTab];

  const renderInsight = () => {
    switch (activeTab) {
      case "독서":
        return <ReadingInsight />;
      case "운동":
        return <ExerciseInsight />;
      case "모닝":
        return <MorningInsight />;
      case "제2외국어":
        return <SecondLanguageInsight />;
      case "영어":
        return <LanguageInsight />;
      case "자산관리":
        return <FinanceInsight />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {renderInsight()}
      {routineType && <RecentRecords routineType={routineType} tabName={activeTab} />}
    </div>
  );
}
