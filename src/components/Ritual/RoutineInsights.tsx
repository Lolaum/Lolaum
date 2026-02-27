"use client";

import React from "react";
import { BookText, Dumbbell, BookA, Sun, CircleDollarSign, Flame } from "lucide-react";
import {
  readingInsightData,
  financeInsightData,
  exerciseInsightData,
  morningInsightData,
  languageInsightData,
} from "@/mock/ritualmock";

// ─────────────────────────────
// 독서 인사이트
// ─────────────────────────────
function ReadingInsight() {
  const { heatmap, currentBooks, totalPages, totalSentences, completedBooks } =
    readingInsightData;

  // 히트맵: 마지막 63일 (9주)
  const last63 = heatmap.slice(-63);

  const getHeatColor = (pages: number) => {
    if (pages === 0) return "#e5e7eb";
    if (pages <= 20) return "#c4b5fd";
    if (pages <= 35) return "#8b5cf6";
    return "#6d28d9";
  };

  return (
    <div className="space-y-4">
      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "완독", value: `${completedBooks}권`, color: "#6366f1" },
          { label: "총 독서량", value: `${totalPages.toLocaleString()}p`, color: "#8b5cf6" },
          { label: "기록 문장", value: `${totalSentences}개`, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 독서 히트맵 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <BookText size={15} style={{ color: "#6366f1" }} />
          <h3 className="text-sm font-semibold text-gray-700">독서 달력</h3>
          <span className="text-xs text-gray-400 ml-auto">최근 63일</span>
        </div>

        {/* 요일 라벨 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
            <div key={d} className="text-center text-[10px] text-gray-300 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* 히트맵 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {last63.map((day, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm"
              style={{ backgroundColor: getHeatColor(day.pages) }}
              title={`${day.date}: ${day.pages}p`}
            />
          ))}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-gray-400">적게</span>
          {["#e5e7eb", "#c4b5fd", "#8b5cf6", "#6d28d9"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-gray-400">많이</span>
        </div>
      </div>

      {/* 현재 읽는 책 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">읽는 중인 책</h3>
        <div className="space-y-4">
          {currentBooks.map((book, i) => {
            const percent = Math.round((book.currentPage / book.totalPages) * 100);
            return (
              <div key={i}>
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{book.title}</p>
                    <p className="text-xs text-gray-400">{book.author}</p>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: book.color }}
                  >
                    {percent}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percent}%`, backgroundColor: book.color }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {book.currentPage}p / {book.totalPages}p
                </p>
              </div>
            );
          })}
        </div>
      </div>
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
      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "총 운동 횟수", value: `${totalSessions}회`, color: "#ff8900" },
          { label: "총 운동 시간", value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`, color: "#ff9c28" },
          { label: "평균 시간", value: `${avgMinutes}분`, color: "#ffb15a" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 주간 활동 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell size={15} style={{ color: "#ff8900" }} />
          <h3 className="text-sm font-semibold text-gray-700">주간 활동 추이</h3>
        </div>
        <div className="flex items-end gap-3 justify-around h-24">
          {last4Weeks.map((w) => {
            const heightPercent = (w.days / w.max) * 100;
            return (
              <div key={w.week} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-xs font-semibold" style={{ color: "#ff8900" }}>
                  {w.days}일
                </span>
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: "64px" }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${heightPercent}%`,
                      marginTop: `${100 - heightPercent}%`,
                      backgroundColor: w.week === "이번 주" ? "#ff8900" : "#ffcf87",
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{w.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 운동 종류 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">운동 종류별 현황</h3>
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
  const { avgCondition, streak, totalDays, conditionTrend, avgWakeTime } =
    morningInsightData;

  const conditionColor =
    avgCondition >= 80 ? "#10b981" :
    avgCondition >= 60 ? "#eab32e" :
    "#f97316";

  const maxTrend = Math.max(...conditionTrend);

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "평균 컨디션", value: `${avgCondition}점`, color: conditionColor },
          { label: "연속 달성", value: `${streak}일`, color: "#eab32e" },
          { label: "평균 기상", value: avgWakeTime, color: "#f3c75c" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-base font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 컨디션 트렌드 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Sun size={15} style={{ color: "#eab32e" }} />
          <h3 className="text-sm font-semibold text-gray-700">컨디션 트렌드</h3>
          <span className="text-xs text-gray-400 ml-auto">최근 {conditionTrend.length}일</span>
        </div>

        {/* 라인 차트 (SVG) */}
        <div className="h-20 relative">
          <svg
            viewBox={`0 0 ${conditionTrend.length * 20} 80`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* 그리드 라인 */}
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={80 - y * 0.8}
                x2={conditionTrend.length * 20}
                y2={80 - y * 0.8}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* 영역 채우기 */}
            <defs>
              <linearGradient id="morningGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eab32e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#eab32e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={[
                `0,80`,
                ...conditionTrend.map((v, i) => `${i * 20 + 10},${80 - (v / 100) * 72}`),
                `${(conditionTrend.length - 1) * 20 + 10},80`,
              ].join(" ")}
              fill="url(#morningGrad)"
            />

            {/* 라인 */}
            <polyline
              points={conditionTrend
                .map((v, i) => `${i * 20 + 10},${80 - (v / 100) * 72}`)
                .join(" ")}
              fill="none"
              stroke="#eab32e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 포인트 */}
            {conditionTrend.map((v, i) => (
              <circle
                key={i}
                cx={i * 20 + 10}
                cy={80 - (v / 100) * 72}
                r="3"
                fill="white"
                stroke="#eab32e"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-300">{conditionTrend.length}일 전</span>
          <span className="text-[10px] text-gray-300">오늘</span>
        </div>
      </div>

      {/* 달성률 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">이달의 모닝 달성</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="30" fill="none" stroke="#fef3c7" strokeWidth="8" />
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="#eab32e"
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
              <Flame size={14} className="text-amber-400" />
              <span className="text-xs text-gray-600">
                현재 <span className="font-bold text-amber-500">{streak}일</span> 연속 중
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
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "학습 표현", value: `${totalExpressions}개`, color: "#0ea5e9" },
          { label: "연속 달성", value: `${streak}일`, color: "#38bdf8" },
          { label: "총 학습일", value: `${totalDays}일`, color: "#7dd3fc" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
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
          <h3 className="text-sm font-semibold text-gray-700">최근 학습 표현</h3>
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
                <p className="text-sm font-semibold" style={{ color: "#0369a1" }}>
                  {expr.word}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{expr.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 학습 진행 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">이달의 목표 달성</h3>
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">학습 표현 {totalExpressions}개</span>
            <span style={{ color: "#0ea5e9" }} className="font-semibold">목표 200개</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((totalExpressions / 200) * 100, 100)}%`,
                backgroundColor: "#0ea5e9",
              }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          목표까지 <span className="font-semibold text-sky-500">{200 - totalExpressions}개</span> 남았어요
        </p>
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
    (currentMonth.emotional / currentMonth.total) * 100
  );
  const necessaryPercent = 100 - emotionalPercent;
  const maxWeekly = Math.max(...weeklySpending.map((w) => w.amount));

  return (
    <div className="space-y-4">
      {/* 이달 지출 요약 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <CircleDollarSign size={15} style={{ color: "#10b981" }} />
          <h3 className="text-sm font-semibold text-gray-700">이달 소비 현황</h3>
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
            style={{ width: `${necessaryPercent}%`, backgroundColor: "#10b981" }}
          />
          <div
            className="h-full"
            style={{ width: `${emotionalPercent}%`, backgroundColor: "#f97316" }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1 text-gray-400">
          <span>필수 {necessaryPercent}%</span>
          <span>감성 {emotionalPercent}%</span>
        </div>
      </div>

      {/* 주간 지출 바 차트 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">주간 지출 추이</h3>
        <div className="flex items-end gap-3 justify-around h-28">
          {weeklySpending.map((w) => {
            const heightPercent = (w.amount / maxWeekly) * 100;
            const isHighest = w.amount === maxWeekly;
            return (
              <div key={w.week} className="flex flex-col items-center gap-1.5 flex-1">
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
        <h3 className="text-sm font-semibold text-gray-700 mb-3">카테고리별 지출</h3>
        <div className="space-y-3">
          {currentMonth.categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <span className="text-gray-400">{cat.amount.toLocaleString()}원 · {cat.percent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
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
// 메인 컴포넌트
// ─────────────────────────────
interface RoutineInsightsProps {
  activeTab: string;
}

export default function RoutineInsights({ activeTab }: RoutineInsightsProps) {
  const renderInsight = () => {
    switch (activeTab) {
      case "독서":
        return <ReadingInsight />;
      case "운동":
        return <ExerciseInsight />;
      case "모닝":
        return <MorningInsight />;
      case "영어":
        return <LanguageInsight />;
      case "자산관리":
        return <FinanceInsight />;
      default:
        return null;
    }
  };

  return <div>{renderInsight()}</div>;
}
