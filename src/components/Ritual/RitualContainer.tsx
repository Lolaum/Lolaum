"use client";

import React, { useState } from "react";
import { Flame, Calendar, TrendingUp } from "lucide-react";
import { myRitualStats, myRoutineStats } from "@/mock/ritualmock";
import RecordGallery from "./RecordGallery";
import RoutineInsights from "./RoutineInsights";

type TabId = "갤러리" | "독서" | "운동" | "모닝" | "영어" | "자산관리";

const TABS: TabId[] = ["갤러리", "독서", "운동", "모닝", "영어", "자산관리"];

const TAB_COLORS: Record<TabId, string> = {
  갤러리: "#eab32e",
  독서: "#6366f1",
  운동: "#ff8900",
  모닝: "#eab32e",
  영어: "#0ea5e9",
  자산관리: "#10b981",
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export default function RitualContainer() {
  const [activeTab, setActiveTab] = useState<TabId>("갤러리");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* ── 헤더 섹션 ── */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs text-gray-400 font-medium mb-0.5">나의 리추얼 여정</p>
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          {myRitualStats.currentStreak}일째 꾸준히
        </h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">
              <Calendar size={14} className="text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{myRitualStats.totalRecords}</p>
            <p className="text-xs text-gray-400 mt-0.5">총 기록</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">
              <Flame size={14} className="text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{myRitualStats.currentStreak}</p>
            <p className="text-xs text-gray-400 mt-0.5">연속 달성</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp size={14} className="text-yellow-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{myRitualStats.completionRate}%</p>
            <p className="text-xs text-gray-400 mt-0.5">완료율</p>
          </div>
        </div>
      </div>

      {/* ── 루틴별 카드 ── */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          루틴 현황
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {myRoutineStats.map((routine) => (
            <button
              key={routine.id}
              onClick={() => setActiveTab(routine.name as TabId)}
              className="flex-shrink-0 rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: routine.bgColor,
                minWidth: "130px",
                border: activeTab === routine.name ? `2px solid ${routine.color}` : "2px solid transparent",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: routine.color }}
                >
                  {routine.name}
                </span>
                <span className="text-xs text-gray-500">{routine.totalDays}일</span>
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
                <span className="text-xs font-medium" style={{ color: routine.color }}>
                  {routine.streak}일 연속
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 탭 네비게이션 ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-5 scrollbar-hide">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={
                isActive
                  ? {
                      backgroundColor: TAB_COLORS[tab],
                      color: "#fff",
                    }
                  : {
                      backgroundColor: "#f3f4f6",
                      color: "#6b7280",
                    }
              }
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {activeTab === "갤러리" ? (
        <RecordGallery />
      ) : (
        <RoutineInsights activeTab={activeTab} />
      )}
    </div>
  );
}
