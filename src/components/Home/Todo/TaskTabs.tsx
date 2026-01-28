"use client";

import React, { useState } from "react";
import TodoList from "./TodoList";
import RoutineList from "./RoutineList";
import Timer from "../Timer/Timer";
import {
  formatDateDisplay,
  getWeekRangeText,
} from "@/components/modules/Common/dateModules";

type TabType = "routine" | "todo";

interface TaskTabsProps {
  selectedDate: Date;
}

export default function TaskTabs({ selectedDate }: TaskTabsProps) {
  // 루틴이 먼저 보이도록 기본값을 routine으로
  const [activeTab, setActiveTab] = useState<TabType>("routine");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const handleTaskClick = (title: string) => {
    setSelectedTask(title);
  };

  const handleCloseTimer = () => {
    setSelectedTask(null);
  };

  // 타이머가 선택되면 타이머만 표시
  if (selectedTask) {
    return <Timer taskTitle={selectedTask} onClose={handleCloseTimer} />;
  }

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
                  ? "bg-white text-yellow-900 shadow border border-gray-200"
                  : "text-gray-400"
              }`}
              style={{ minWidth: 70 }}
            >
              루틴
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("todo")}
              className={`px-5 py-1.5 rounded-full text-base font-semibold transition-colors duration-150 ${
                activeTab === "todo"
                  ? "bg-yellow-400 text-white shadow border border-yellow-300"
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
      <div>
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
