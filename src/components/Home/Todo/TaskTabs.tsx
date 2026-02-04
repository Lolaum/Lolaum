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
    <div className="rounded-2xl bg-white shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        {/* 주간 날짜 정보 */}
        <div className="flex flex-col">
          <div className="mb-2 text-xl text-gray-900 font-bold">
            {getWeekRangeText(selectedDate)}
          </div>
          {/* 오늘 날짜 */}
          <div className="mb-2 text-base text-gray-400 font-semibold">
            {formatDateDisplay(selectedDate)}
          </div>
        </div>

        {/* 토글 스위치 */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center bg-gray-100 rounded-lg px-1 py-1 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("routine")}
              className={`px-5 py-1.5 rounded-lg text-base font-semibold transition-colors duration-150 ${
                activeTab === "routine"
                  ? "bg-white text-yellow-500 shadow border border-gray-200"
                  : "text-gray-400"
              }`}
              style={{ minWidth: 70 }}
            >
              루틴
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("todo")}
              className={`px-5 py-1.5 rounded-lg text-base font-semibold transition-colors duration-150 ${
                activeTab === "todo"
                  ? "bg-white text-yellow-500 shadow  border border-gray-200"
                  : "text-gray-400"
              }`}
              style={{ minWidth: 70 }}
            >
              투두
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {activeTab === "routine" ? (
          <RoutineList
            selectedDate={selectedDate}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <TodoList selectedDate={selectedDate} onTaskClick={handleTaskClick} />
        )}
      </div>
    </div>
  );
}
