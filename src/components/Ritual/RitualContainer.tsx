"use client";

import React, { useState, useEffect } from "react";
import { Flame, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { getRitualPageData } from "@/api/ritual-stats";
import type { RitualOverallStats, RoutineCardStats } from "@/api/ritual-stats";
import RecordGallery from "./RecordGallery";
import RoutineInsights from "./RoutineInsights";

type TabId = "아카이빙" | "독서" | "운동" | "모닝" | "영어" | "제2외국어" | "원서읽기" | "자산관리" | "기록";

const TABS: TabId[] = ["아카이빙", "독서", "운동", "모닝", "영어", "제2외국어", "원서읽기", "자산관리", "기록"];

const TAB_COLORS: Record<TabId, string> = {
  아카이빙: "#eab32e",
  독서: "#6366f1",
  운동: "#ff8900",
  모닝: "#eab32e",
  영어: "#0ea5e9",
  제2외국어: "#10b981",
  원서읽기: "#8b5cf6",
  자산관리: "#10b981",
  기록: "#f43f5e",
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function RitualContainer() {
  const [activeTab, setActiveTab] = useState<TabId>("아카이빙");
  const [overall, setOverall] = useState<RitualOverallStats | null>(null);
  const [routines, setRoutines] = useState<RoutineCardStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  // 페이지에 다시 돌아올 때 자동 갱신
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setRefreshKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const result = await getRitualPageData();
      if (result.overall) {
        setOverall({
          ...result.overall,
          completionRate: result.completion?.rate ?? result.overall.completionRate,
        });
      }
      if (result.routines) setRoutines(result.routines);
      setLoading(false);
    }
    fetchStats();
  }, [refreshKey]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* ── 헤더 섹션 ── */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs text-gray-400 font-medium mb-0.5">
          나의 리추얼 여정
        </p>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : overall ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-4">
              {overall.currentStreak > 0
                ? `${overall.currentStreak}일째 꾸준히`
                : "오늘부터 시작해요"}
            </h1>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <Calendar size={14} className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {overall.totalRecords}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">총 기록</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <Flame size={14} className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {overall.currentStreak}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">연속 달성</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">
                  <TrendingUp size={14} className="text-yellow-500" />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {overall.completionRate}%
                </p>
                <p className="text-xs text-gray-400 mt-0.5">완료율</p>
              </div>
            </div>
          </>
        ) : (
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            오늘부터 시작해요
          </h1>
        )}
      </div>

      {/* ── 루틴별 카드 ── */}
      {routines.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            루틴 현황
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {routines.map((routine) => (
              <button
                key={routine.id}
                onClick={() => setActiveTab(routine.name as TabId)}
                className="flex-shrink-0 rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: routine.bgColor,
                  minWidth: "130px",
                  border:
                    activeTab === routine.name
                      ? `2px solid ${routine.color}`
                      : "2px solid transparent",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: routine.color }}
                  >
                    {routine.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {routine.totalDays}일
                  </span>
                </div>

                {/* 이번 주 활동 도트 */}
                <div className="flex gap-1 mb-2">
                  {routine.weekActivity.map((active, i) => (
                    <div
                      key={i}
                      title={DAY_LABELS[i]}
                      className="w-3.5 h-3.5 rounded-full"
                      style={{
                        backgroundColor: active ? routine.color : "#e5e7eb",
                        opacity: active ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Flame size={12} style={{ color: routine.color }} />
                  <span
                    className="text-xs font-medium"
                    style={{ color: routine.color }}
                  >
                    {routine.streak}일 연속
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 탭 네비게이션 ── */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 mb-5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px"
              style={{
                color: isActive ? TAB_COLORS[tab] : "#9ca3af",
                borderBottomColor: isActive ? TAB_COLORS[tab] : "transparent",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {activeTab === "아카이빙" ? (
        <RecordGallery refreshKey={refreshKey} />
      ) : (
        <RoutineInsights activeTab={activeTab} routines={routines} refreshKey={refreshKey} />
      )}
    </div>
  );
}
