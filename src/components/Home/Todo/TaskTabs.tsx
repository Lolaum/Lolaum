"use client";

import React, { useState } from "react";
import TodoList from "./TodoList";
import RoutineList from "./RoutineList";
import Timer from "../Timer/Timer";

type TabType = "routine" | "todo";

interface TaskTabsProps {
  selectedDate: Date;
}

export default function TaskTabs({ selectedDate }: TaskTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("todo");
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

  return (
    <div className="rounded-lg border">
      {/* 탭 헤더 */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab("routine")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "routine"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          루틴
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("todo")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "todo"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          할 일
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="p-4">
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
