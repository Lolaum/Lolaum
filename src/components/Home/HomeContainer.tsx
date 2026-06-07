"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import HomCalendar from "./HomeCalendar";
import TaskTabs from "./Todo/TaskTabs";
import MemberProfile from "./Profile/MemberProfile";
import Profile from "./Profile/Profile";
import { formatDateKey } from "@/lib/date";
import { useKoreaMidnightRefresh } from "@/lib/hooks/useKoreaMidnightRefresh";
import {
  type MyPageStats,
  type CompletionRateStats,
  type CalendarDayMarker,
  type HomeProfile,
} from "@/api/ritual-stats";
import type { ChallengerSummary } from "@/api/user";
import type { ChallengeRegistration } from "@/types/supabase";

interface HomeInitialData {
  myPage?: MyPageStats;
  completion?: CompletionRateStats;
  calendarMarkers?: Record<string, CalendarDayMarker>;
  routineCompletionMap?: Record<string, number>;
  totalRoutineDays?: number;
  profile?: HomeProfile | null;
  challengers?: ChallengerSummary[];
  routines?: ChallengeRegistration[];
  error?: string;
}

interface ActivePeriod {
  start_date: string;
  end_date: string;
  label: string | null;
}

const RITUAL_ROUTES: Record<string, string> = {
  모닝리추얼: "/home/morning",
  독서리추얼: "/home/reading",
  원서읽기리추얼: "/home/english-book",
  영어리추얼: "/home/english",
  제2외국어리추얼: "/home/second-language",
  운동리추얼: "/home/exercise",
  자산관리리추얼: "/home/finance",
  기록리추얼: "/home/recording",
};

export default function HomeContainer({
  initialData,
  period,
}: {
  initialData: HomeInitialData;
  period: ActivePeriod | null;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<
    string | undefined
  >();

  const myPageStats: MyPageStats | null = initialData.myPage ?? null;
  const completionRate: CompletionRateStats | null =
    initialData.completion ?? null;
  const calendarMarkers: Record<string, CalendarDayMarker> =
    initialData.calendarMarkers ?? {};
  const routineCompletionMap: Record<string, number> =
    initialData.routineCompletionMap ?? {};
  const totalRoutineDays = initialData.totalRoutineDays;
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);

  const refreshToday = useCallback(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now);
  }, []);
  useKoreaMidnightRefresh(refreshToday);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const now = new Date();
      setToday(now);
      setSelectedDate(now);
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // 선택된 날짜가 오늘 이전인지 확인
  const isPastDate =
    selectedDate && today
      ? selectedDate.toDateString() !== today.toDateString() &&
        selectedDate < today
      : false;

  // 선택된 날짜가 챌린지 기간 외인지 확인
  const isOutsidePeriod = (() => {
    if (!period || !selectedDate) return false;
    const dateStr = formatDateKey(selectedDate);
    return dateStr < period.start_date || dateStr > period.end_date;
  })();
  const handleTaskClick = (title: string) => {
    if (isPastDate) return; // 지난 날짜에서는 리추얼 진행 불가
    if (isOutsidePeriod) return; // 챌린지 기간 외에는 리추얼 진행 불가
    const route = RITUAL_ROUTES[title];
    if (route) router.push(route);
  };

  // 마운트 전에는 로딩 상태 표시
  if (!mounted || !today || !selectedDate) {
    return (
      <div className="w-full px-4 py-3 sm:px-6 md:px-8 lg:px-12">
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
    <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* 캘린더 섹션 */}
          <div className="contents md:order-1 md:block md:w-1/2 lg:w-5/12">
            <div className="order-4 w-full md:order-none">
              <MemberProfile
                initialMembers={initialData.challengers}
                selectedMemberId={selectedMemberId}
                onSelectMember={(id) =>
                  setSelectedMemberId((prev) => (prev === id ? undefined : id))
                }
                refreshKey={memberRefreshKey}
              />
            </div>
            <div className="order-3 w-full md:order-none">
              <Profile
                initialProfile={initialData.profile}
                stats={myPageStats}
                completionRate={completionRate}
                period={period}
                onProfileUpdated={() => setMemberRefreshKey((k) => k + 1)}
              />
            </div>
            {/* <button
              type="button"
              onClick={() => router.push("/mid-review/write")}
              className="mb-3 w-full rounded-2xl p-4 text-left transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="mb-0.5 text-sm font-bold"
                    style={{ color: "#92400e" }}
                  >
                    중간 회고 작성 기간입니다
                  </p>
                  <p className="text-xs" style={{ color: "#b45309" }}>
                    지금 바로 작성하기
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-800">작성</span>
              </div>
            </button> */}
            <div className="static order-1 z-10 w-full md:sticky md:top-0 md:order-none">
              <HomCalendar
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                markers={calendarMarkers}
              />
            </div>
          </div>

          {/* 태스크 탭 섹션 (리추얼/투두) */}
          <div className="contents md:order-2 md:block md:w-1/2 lg:w-7/12">
            <TaskTabs
              selectedDate={selectedDate}
              onTaskClick={handleTaskClick}
              stats={myPageStats}
              isPastDate={isPastDate}
              isOutsidePeriod={isOutsidePeriod}
              routineCompletionMap={routineCompletionMap}
              totalRoutineDays={totalRoutineDays}
              initialRoutines={initialData.routines}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
