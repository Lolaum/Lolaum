"use client";

import React, { useState } from "react";
import TodoList from "./TodoList";
import RoutineList from "./RoutineList";
import Timer from "../Timer/Timer";
import ReadingContainer from "@/components/Routines/Reading/ReadingContainer";
import {
  formatDateDisplay,
  getWeekRangeText,
} from "@/modules/Common/dateModules";

type TabType = "routine" | "todo";

interface TaskTabsProps {
  selectedDate: Date;
}

export default function TaskTabs({ selectedDate }: TaskTabsProps) {
  // 루틴이 먼저 보이도록 기본값을 routine으로
  const [activeTab, setActiveTab] = useState<TabType>("routine");
  const [selectedTask, setSelectedTask] = useState<{
    title: string;
    color: string;
  } | null>(null);
  const [showReading, setShowReading] = useState(false);

  const handleTaskClick = (title: string, color: string) => {
    setSelectedTask({ title, color });
  };

  const handleCloseTimer = () => {
    setSelectedTask(null);
  };

  const handleNext = () => {
    // 독서리추얼인 경우 ReadingContainer 표시
    if (selectedTask?.title === "독서리추얼") {
      setShowReading(true);
    }
  };

  const handleCloseReading = () => {
    setShowReading(false);
    // selectedTask는 유지하여 타이머로 돌아가도록 함
  };

  // 타이머가 선택되면 타이머만 표시
  if (selectedTask) {
    return (
      <>
        {/* 타이머는 항상 렌더링하되, ReadingContainer가 표시될 때는 숨김 */}
        <div style={{ display: showReading ? "none" : "block" }}>
          <Timer
            taskTitle={selectedTask.title}
            color={selectedTask.color}
            onClose={handleCloseTimer}
            onNext={handleNext}
          />
        </div>

        {/* ReadingContainer 표시 */}
        {showReading && (
          <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-white">
            {/* 뒤로가기 버튼 */}
            <button
              type="button"
              onClick={handleCloseReading}
              className="absolute left-4 top-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 z-10"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm">돌아가기</span>
            </button>
            <div className="pt-16 px-4">
              <ReadingContainer />
            </div>
          </div>
        )}
      </>
    );
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
