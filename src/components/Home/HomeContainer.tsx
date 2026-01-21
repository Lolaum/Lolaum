"use client";

import React, { useState } from "react";
import HomCalendar from "./HomCalendar";
import TaskTabs from "./Todo/TaskTabs";

export default function HomeContainer() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-8 lg:px-12">
      {/* 모바일: 세로 배치, md 이상: 가로 배치 */}
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* 캘린더 섹션 */}
          <div className="w-full md:w-1/2 lg:w-5/12">
            <HomCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* 태스크 탭 섹션 (루틴/투두) */}
          <div className="w-full md:w-1/2 lg:w-7/12">
            <TaskTabs selectedDate={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
