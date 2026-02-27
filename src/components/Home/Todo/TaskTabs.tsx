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
  // 루틴이 먼저 보이도록 기본값을 routine으로
  const [activeTab, setActiveTab] = useState<TabType>("routine");

  const handleTaskClick = (title: string, color: string) => {
    onTaskClick?.(title, color);
  };

  // 토글 스위치 스타일
  return (
    <div className="rounded-3xl bg-white shadow-sm border border-gray-100 p-5">
      {/* 날짜 + 탭 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">{formatDateDisplay(selectedDate)}</p>
          <h2 className="text-base font-bold text-gray-800">{getWeekRangeText(selectedDate)}</h2>
        </div>

        {/* 탭 토글 */}
        <div className="flex items-center bg-gray-100 rounded-2xl p-1">
          {(["routine", "todo"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={
                activeTab === tab
                  ? { backgroundColor: "#eab32e", color: "#fff", boxShadow: "0 1px 4px rgba(234,179,46,0.4)" }
                  : { color: "#9ca3af" }
              }
            >
              {tab === "routine" ? "루틴" : "투두"}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
        {activeTab === "routine" ? (
          <RoutineList selectedDate={selectedDate} onTaskClick={handleTaskClick} />
        ) : (
          <TodoList selectedDate={selectedDate} onTaskClick={handleTaskClick} />
        )}
      </div>
    </div>
  );
}
