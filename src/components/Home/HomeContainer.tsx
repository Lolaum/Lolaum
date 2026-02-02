"use client";

import React, { useState, useEffect } from "react";
import HomCalendar from "./HomeCalendar";
import TaskTabs from "./Todo/TaskTabs";
import MemberProfile from "./Profile/MemberProfile";
import Profile from "./Profile/Profile";

export default function HomeContainer() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now);
    setMounted(true);
  }, []);

  // 마운트 전에는 로딩 상태 표시
  if (!mounted || !today || !selectedDate) {
    return (
      <div className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <div className="w-full md:w-1/2 lg:w-5/12">
              <div className="rounded-lg border p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-32"></div>
                <div className="h-48 bg-gray-100 rounded"></div>
              </div>
            </div>
            <div className="w-full md:w-1/2 lg:w-7/12">
              <div className="rounded-lg border p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-24"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-8 lg:px-12">
      {/* 모바일: 세로 배치, md 이상: 가로 배치 */}
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          {/* 캘린더 섹션 */}
          <div className="w-full md:w-1/2 lg:w-5/12">
            <MemberProfile
              selectedMemberId={selectedMemberId}
              onSelectMember={(id) =>
                setSelectedMemberId((prev) => (prev === id ? undefined : id))
              }
            />
            <Profile />
            <HomCalendar
              today={today}
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
