"use client";

import React, { useState } from "react";
import TodoList from "./TodoList";
import RoutineList from "./RoutineList";
import {
  formatDateDisplay,
  getWeekRangeText,
} from "@/modules/Common/dateModules";

type TabType = "routine" | "todo";

interface TaskTabsProps {
  selectedDate: Date;
  onTaskClick?: (title: string, color: string) => void;
}

export default function TaskTabs({ selectedDate, onTaskClick }: TaskTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("routine");

  const handleTaskClick = (title: string, color: string) => {
    onTaskClick?.(title, color);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "3", label: "연속 실천" },
          { value: "7", label: "최장 기록" },
          { value: "24", label: "총 완료" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center gap-1"
          >
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-xs text-gray-400 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* 루틴/투두 카드 */}
      <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-5">
        {/* 날짜 */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            {formatDateDisplay(selectedDate)}
          </p>
          <h2 className="text-base font-bold text-gray-800">
            {getWeekRangeText(selectedDate)}
          </h2>
        </div>

        {/* 세그먼트 컨트롤 — 슬라이딩 pill */}
        <div className="relative flex bg-gray-100 rounded-2xl p-1 mb-5">
          {/* 슬라이딩 active 배경 */}
          <div
            className="absolute inset-y-1 rounded-xl"
            style={{
              width: "calc(50% - 4px)",
              left: activeTab === "routine" ? 4 : "calc(50%)",
              backgroundColor: "#eab32e",
              boxShadow: "0 2px 8px rgba(234,179,46,0.35)",
              transition: "left 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {(["routine", "todo"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="relative z-10 flex-1 py-2.5 text-sm font-semibold flex items-center justify-center"
              style={{
                color: activeTab === tab ? "#fff" : "#9ca3af",
                transition: "color 0.18s ease",
              }}
            >
              {tab === "routine" ? "루틴" : "투두"}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
          {activeTab === "routine" ? (
            <RoutineList selectedDate={selectedDate} onTaskClick={handleTaskClick} />
          ) : (
            <TodoList selectedDate={selectedDate} onTaskClick={handleTaskClick} />
          )}
        </div>
      </div>

      {/* 회고 버튼 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "리추얼선언" },
          { label: "중간회고" },
          { label: "최종회고" },
        ].map(({ label }) => (
          <button
            key={label}
            type="button"
            className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center gap-1 text-gray-400 font-semibold text-sm hover:bg-yellow-50 hover:text-yellow-500 hover:border-yellow-100 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
