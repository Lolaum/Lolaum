"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dumbbell, BookA, BookText, Sun, CircleDollarSign, Languages, Pen, BookOpen, Flame, Loader2 } from "lucide-react";
import { getMyRecordsForDisplay } from "@/api/ritual-records-display";
import { getBooksAuto } from "@/api/book";
import {
  getExerciseInsight,
  getMorningInsight,
  getLanguageInsight,
  getFinanceInsight,
} from "@/api/ritual-stats";
import type { RoutineCardStats } from "@/api/ritual-stats";
import type { RoutineTypeDB } from "@/types/supabase";
import type {
  FeedItem,
  RoutineCategory,
  ReadingFeedData,
  ExerciseFeedData,
  MorningFeedData,
  LanguageFeedData,
  FinanceFeedData,
  RecordingFeedData,
} from "@/types/feed";

// ─────────────────────────────
// 달성 카드 (공통) — routines prop에서 가져옴
// ─────────────────────────────
function AchievementCard({
  name,
  color,
  routines,
}: {
  name: string;
  color: string;
  routines: RoutineCardStats[];
}) {
  const stat = routines.find((r) => r.name === name);
  const streak = stat?.streak ?? 0;
  const totalDays = stat?.totalDays ?? 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        이달의 {name} 리추얼 달성
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="30" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${(totalDays / 15) * 188.5} 188.5`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-800">{totalDays}</span>
            <span className="text-[10px] text-gray-400">/ 15일</span>
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
            이달 목표 15일 중 {totalDays}일 달성!
            <br />
            {15 - totalDays}일 남았어요
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 로딩 래퍼
// ─────────────────────────────
function InsightLoading({ name, color, routines }: { name: string; color: string; routines: RoutineCardStats[] }) {
  return (
    <div className="space-y-4">
      <AchievementCard name={name} color={color} routines={routines} />
      <div className="text-center py-8 text-gray-400">
        <Loader2 size={20} className="animate-spin mx-auto mb-2" />
        <p className="text-xs">불러오는 중...</p>
      </div>
    </div>
  );
}

// ─────────────────────────────
// 독서 인사이트
// ─────────────────────────────
function ReadingInsight({
  routines,
  refreshKey = 0,
  routineType = "reading",
  tabName = "독서",
  color = "#6366f1",
}: {
  routines: RoutineCardStats[];
  refreshKey?: number;
  routineType?: "reading" | "english_book";
  tabName?: string;
  color?: string;
}) {
  const router = useRouter();
  const [books, setBooks] = useState<{ id: string; title: string; author: string; currentValue: number; totalValue: number; trackingType: string; coverImageUrl: string | null; isCompleted: boolean }[]>([]);
  const [totalSentences, setTotalSentences] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [booksResult, recordsResult] = await Promise.all([
        getBooksAuto(routineType),
        getMyRecordsForDisplay({ routineType }),
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

      setTotalSentences(recordsResult.data?.length ?? 0);
      setLoading(false);
    }
    fetchData();
  }, [refreshKey, routineType]);

  const completedCount = books.filter((b) => b.isCompleted).length;
  const currentBooks = books.filter((b) => !b.isCompleted);

  if (loading) return <InsightLoading name={tabName} color={color} routines={routines} />;

  return (
    <div className="space-y-4">
      <AchievementCard name={tabName} color={color} routines={routines} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "완독", value: `${completedCount}권`, color },
          { label: "기록 문장", value: `${totalSentences}개`, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">읽는 중인 책</h3>
        {currentBooks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">현재 읽고 있는 책이 없어요</p>
        ) : (
          <div className="space-y-4">
            {currentBooks.map((book) => {
              const percent = book.totalValue > 0 ? Math.round((book.currentValue / book.totalValue) * 100) : 0;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => router.push(`/books/${book.id}`)}
                  className="w-full flex gap-3 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                    {book.coverImageUrl ? (
                      <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <span className="text-white text-[7px]">표지</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{book.title}</p>
                        <p className="text-xs text-gray-400">{book.author}</p>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color }}>{percent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {book.trackingType === "percent" ? `${book.currentValue}% 진행` : `${book.currentValue}p / ${book.totalValue}p`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {completedCount > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">완독한 책</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {books.filter((b) => b.isCompleted).map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => router.push(`/books/${book.id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden shadow-sm">
                  {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-white text-[7px]">완독</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 max-w-[60px] truncate">{book.title}</span>
              </button>
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
function ExerciseInsightView({ routines, refreshKey = 0 }: { routines: RoutineCardStats[]; refreshKey?: number }) {
  const [data, setData] = useState<{ totalMinutes: number; totalSessions: number; avgMinutes: number; exercises: { name: string; count: number; totalMinutes: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const result = await getExerciseInsight();
      if (result.data) setData(result.data);
      setLoading(false);
    }
    fetch();
  }, [refreshKey]);

  if (loading || !data) return <InsightLoading name="운동" color="#ff8900" routines={routines} />;

  return (
    <div className="space-y-4">
      <AchievementCard name="운동" color="#ff8900" routines={routines} />
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "총 운동 횟수", value: `${data.totalSessions}회`, color: "#ff8900" },
          { label: "총 운동 시간", value: `${Math.floor(data.totalMinutes / 60)}h ${data.totalMinutes % 60}m`, color: "#ff9c28" },
          { label: "평균 시간", value: `${data.avgMinutes}분`, color: "#ffb15a" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {data.exercises.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">운동 종류별 현황</h3>
          <div className="space-y-3">
            {data.exercises.map((ex) => {
              const maxMinutes = data.exercises[0].totalMinutes || 1;
              const percent = Math.round((ex.totalMinutes / maxMinutes) * 100);
              return (
                <div key={ex.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{ex.name}</span>
                    <span className="text-gray-400">{ex.count}회 · {ex.totalMinutes}분</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: "#ff8900" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────
// 모닝 인사이트
// ─────────────────────────────
function MorningInsightView({ routines, refreshKey = 0 }: { routines: RoutineCardStats[]; refreshKey?: number }) {
  const [data, setData] = useState<{ avgCondition: number; avgSleepHours: string; sleepTrend: { date: string; value: number }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const result = await getMorningInsight();
      if (result.data) setData(result.data);
      setLoading(false);
    }
    fetch();
  }, [refreshKey]);

  if (loading || !data) return <InsightLoading name="모닝" color="#eab32e" routines={routines} />;

  const conditionLevel = data.avgCondition >= 80 ? "상" : data.avgCondition >= 60 ? "중" : "하";
  const conditionColor = data.avgCondition >= 80 ? "#10b981" : data.avgCondition >= 60 ? "#eab32e" : "#f97316";

  return (
    <div className="space-y-4">
      <AchievementCard name="모닝" color="#eab32e" routines={routines} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "평균 컨디션", value: conditionLevel, color: conditionColor },
          { label: "평균 수면", value: data.avgSleepHours, color: "#f3c75c" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {data.sleepTrend.length > 0 && (() => {
        const MIN_DAYS = 18;
        const trend = data.sleepTrend;
        const totalSlots = Math.max(MIN_DAYS, trend.length);
        const slotW = 20;
        const chartW = totalSlots * slotW;
        const chartH = 80;
        const labelH = 14;
        const totalH = chartH + labelH;
        const toY = (v: number) => chartH - ((v - 5) / 5) * 72;
        // 데이터 포인트 — 왼쪽(index 0)부터 시작
        const realPoints = trend.map((item, i) => ({
          x: i * slotW + slotW / 2,
          y: toY(item.value),
          v: item.value,
        }));
        // 날짜 라벨 (M/D 형식, 3칸 간격 + 첫날/마지막날)
        const dateLabels = trend
          .map((item, i) => {
            if (i !== 0 && i !== trend.length - 1 && i % 3 !== 0) return null;
            const d = new Date(item.date);
            return { x: i * slotW + slotW / 2, label: `${d.getMonth() + 1}/${d.getDate()}` };
          })
          .filter(Boolean) as { x: number; label: string }[];

        return (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Sun size={15} style={{ color: "#eab32e" }} />
              <h3 className="text-sm font-semibold text-gray-700">수면 시간 트렌드</h3>
            </div>
            <div className="h-36 relative overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${totalH}`} className="w-full h-full" preserveAspectRatio="none">
                {[6, 7, 8].map((h) => (
                  <line key={h} x1="0" y1={toY(h)} x2={chartW} y2={toY(h)} stroke="#f3f4f6" strokeWidth="1" />
                ))}
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab32e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#eab32e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {realPoints.length > 1 && (
                  <polygon
                    points={[
                      `${realPoints[0].x},${chartH}`,
                      ...realPoints.map((p) => `${p.x},${p.y}`),
                      `${realPoints[realPoints.length - 1].x},${chartH}`,
                    ].join(" ")}
                    fill="url(#sleepGrad)"
                  />
                )}
                <polyline
                  points={realPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none" stroke="#eab32e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                {realPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#eab32e" strokeWidth="1.5" />
                ))}
                {/* 날짜 라벨 */}
                {dateLabels.map((dl, i) => (
                  <text key={i} x={dl.x} y={totalH - 1} textAnchor="middle" fontSize="7" fill="#9ca3af">
                    {dl.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────
// 영어 인사이트
// ─────────────────────────────
function LanguageInsightView({ routines, routineType, tabName, color, refreshKey = 0 }: { routines: RoutineCardStats[]; routineType: "english" | "second_language"; tabName: string; color: string; refreshKey?: number }) {
  const [data, setData] = useState<{ totalExpressions: number; totalDays: number; recentExpressions: { word: string; meaning: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const result = await getLanguageInsight(routineType);
      if (result.data) setData(result.data);
      setLoading(false);
    }
    fetch();
  }, [routineType, refreshKey]);

  if (loading || !data) return <InsightLoading name={tabName} color={color} routines={routines} />;

  const bgColor = routineType === "english" ? "#f0f9ff" : "#f5f3ff";
  const textColor = routineType === "english" ? "#0369a1" : "#6d28d9";

  return (
    <div className="space-y-4">
      <AchievementCard name={tabName} color={color} routines={routines} />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "학습 표현", value: `${data.totalExpressions}개`, color },
          { label: "총 학습일", value: `${data.totalDays}일`, color: routineType === "english" ? "#7dd3fc" : "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {data.recentExpressions.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <BookA size={15} style={{ color }} />
            <h3 className="text-sm font-semibold text-gray-700">최근 학습 표현</h3>
          </div>
          <div className="space-y-2.5">
            {data.recentExpressions.map((expr, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: bgColor }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5" style={{ backgroundColor: color }}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: textColor }}>{expr.word}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{expr.meaning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────
// 자산관리 인사이트
// ─────────────────────────────
function FinanceInsightView({ routines, refreshKey = 0 }: { routines: RoutineCardStats[]; refreshKey?: number }) {
  const [data, setData] = useState<{
    currentMonth: { total: number; necessary: number; emotional: number; value: number; categories: { name: string; amount: number; color: string; percent: number }[] };
    weeklySpending: { week: string; amount: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const result = await getFinanceInsight();
      if (result.data) setData(result.data);
      setLoading(false);
    }
    fetch();
  }, [refreshKey]);

  if (loading || !data) return <InsightLoading name="자산관리" color="#10b981" routines={routines} />;

  const { currentMonth, weeklySpending } = data;
  const necessaryPercent = currentMonth.total > 0 ? Math.round((currentMonth.necessary / currentMonth.total) * 100) : 0;
  const emotionalPercent = currentMonth.total > 0 ? Math.round((currentMonth.emotional / currentMonth.total) * 100) : 0;
  const valuePercent = currentMonth.total > 0
    ? Math.max(0, 100 - necessaryPercent - emotionalPercent)
    : 0;
  const maxWeekly = Math.max(...weeklySpending.map((w) => w.amount), 1);

  return (
    <div className="space-y-4">
      <AchievementCard name="자산관리" color="#10b981" routines={routines} />

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <CircleDollarSign size={15} style={{ color: "#10b981" }} />
          <h3 className="text-sm font-semibold text-gray-700">이달 소비 현황</h3>
        </div>
        {currentMonth.total === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">아직 지출 기록이 없어요</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {currentMonth.total.toLocaleString()}<span className="text-base font-medium text-gray-400 ml-1">원</span>
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-4">
              <span>필수 소비 <span className="font-semibold text-gray-700">{currentMonth.necessary.toLocaleString()}원</span></span>
              <span>감성 소비 <span className="font-semibold" style={{ color: "#f97316" }}>{currentMonth.emotional.toLocaleString()}원</span></span>
              <span>가치 소비 <span className="font-semibold" style={{ color: "#8b5cf6" }}>{currentMonth.value.toLocaleString()}원</span></span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="h-full" style={{ width: `${necessaryPercent}%`, backgroundColor: "#10b981" }} />
              <div className="h-full" style={{ width: `${emotionalPercent}%`, backgroundColor: "#f97316" }} />
              <div className="h-full" style={{ width: `${valuePercent}%`, backgroundColor: "#8b5cf6" }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1 text-gray-400">
              <span>필수 {necessaryPercent}%</span>
              <span>감성 {emotionalPercent}%</span>
              <span>가치 {valuePercent}%</span>
            </div>
          </>
        )}
      </div>

      {weeklySpending.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">주간 지출 추이</h3>
          <div className="flex items-end gap-3 justify-around h-28">
            {weeklySpending.map((w) => {
              const heightPercent = (w.amount / maxWeekly) * 100;
              const isHighest = w.amount === maxWeekly;
              return (
                <div key={w.week} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] font-semibold" style={{ color: isHighest ? "#f97316" : "#10b981" }}>
                    {(w.amount / 10000).toFixed(0)}만
                  </span>
                  <div
                    className="w-full rounded-t-lg"
                    style={{ height: `${heightPercent * 0.8}px`, minHeight: "8px", backgroundColor: isHighest ? "#f97316" : "#6ee7b7" }}
                  />
                  <span className="text-[10px] text-gray-400">{w.week}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentMonth.categories.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">카테고리별 지출</h3>
          <div className="space-y-3">
            {currentMonth.categories.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <span className="text-gray-400">{cat.amount.toLocaleString()}원 · {cat.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
  기록: "recording",
  자산관리: "finance",
  원서읽기: "english_book",
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
  기록: { color: "#8b5cf6", bgColor: "#f5f3ff", icon: <Pen size={13} /> },
  자산관리: { color: "#10b981", bgColor: "#ecfdf5", icon: <CircleDollarSign size={13} /> },
  원서읽기: { color: "#ec4899", bgColor: "#fdf2f8", icon: <BookOpen size={13} /> },
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
            <p className="text-xs text-gray-500 line-clamp-2">{d.reflection || d.success}</p>
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
      case "기록": {
        const d = item.routineData as RecordingFeedData;
        return (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 line-clamp-3">{d.content}</p>
          </div>
        );
      }
      case "원서읽기": {
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
      default:
        return null;
    }
  };

  return (
    <Link
      href={`/feeds/${item.odOriginalId ?? item.id}`}
      className="block bg-white rounded-xl p-3 border border-gray-100 transition-shadow hover:shadow-md active:opacity-80"
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400">{formatDate(item.date)}</span>
      </div>
      {renderSummary()}
    </Link>
  );
}

// 최근 기록 리스트 컴포넌트
function RecentRecords({ routineType, tabName, refreshKey = 0 }: { routineType: RoutineTypeDB; tabName: string; refreshKey?: number }) {
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
  }, [routineType, refreshKey]);

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
  routines: RoutineCardStats[];
  refreshKey?: number;
}

export default function RoutineInsights({ activeTab, routines, refreshKey = 0 }: RoutineInsightsProps) {
  const routineType = TAB_TO_ROUTINE[activeTab];

  const renderInsight = () => {
    switch (activeTab) {
      case "독서":
        return <ReadingInsight routines={routines} refreshKey={refreshKey} />;
      case "원서읽기":
        return (
          <ReadingInsight
            routines={routines}
            refreshKey={refreshKey}
            routineType="english_book"
            tabName="원서읽기"
            color="#ec4899"
          />
        );
      case "운동":
        return <ExerciseInsightView routines={routines} refreshKey={refreshKey} />;
      case "모닝":
        return <MorningInsightView routines={routines} refreshKey={refreshKey} />;
      case "제2외국어":
        return <LanguageInsightView routines={routines} routineType="second_language" tabName="제2외국어" color="#8b5cf6" refreshKey={refreshKey} />;
      case "영어":
        return <LanguageInsightView routines={routines} routineType="english" tabName="영어" color="#0ea5e9" refreshKey={refreshKey} />;
      case "자산관리":
        return <FinanceInsightView routines={routines} refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {renderInsight()}
      {routineType && <RecentRecords routineType={routineType} tabName={activeTab} refreshKey={refreshKey} />}
    </div>
  );
}
