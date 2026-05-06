"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HomCalendar from "./HomeCalendar";
import TaskTabs from "./Todo/TaskTabs";
import MemberProfile from "./Profile/MemberProfile";
import Profile from "./Profile/Profile";
import {
  type MyPageStats,
  type CompletionRateStats,
  type CalendarDayMarker,
} from "@/api/ritual-stats";

interface HomeInitialData {
  myPage?: MyPageStats;
  completion?: CompletionRateStats;
  calendarMarkers?: Record<string, CalendarDayMarker>;
  routineCompletionMap?: Record<string, number>;
  totalRoutineDays?: number;
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

  const [myPageStats] = useState<MyPageStats | null>(
    initialData.myPage ?? null,
  );
  const [completionRate] = useState<CompletionRateStats | null>(
    initialData.completion ?? null,
  );
  const [calendarMarkers] = useState<Record<string, CalendarDayMarker>>(
    initialData.calendarMarkers ?? {},
  );
  const [routineCompletionMap] = useState<Record<string, number>>(
    initialData.routineCompletionMap ?? {},
  );
  const [totalRoutineDays] = useState<number | undefined>(
    initialData.totalRoutineDays,
  );
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now);
    setMounted(true);
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
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
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
          <div className="w-full md:w-1/2 lg:w-5/12">
            <MemberProfile
              selectedMemberId={selectedMemberId}
              onSelectMember={(id) =>
                setSelectedMemberId((prev) => (prev === id ? undefined : id))
              }
              refreshKey={memberRefreshKey}
            />
            <Profile
              stats={myPageStats}
              completionRate={completionRate}
              period={period}
              onProfileUpdated={() => setMemberRefreshKey((k) => k + 1)}
            />
            <div className="sticky top-0 z-10 static">
              <HomCalendar
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                markers={calendarMarkers}
              />
            </div>
          </div>

          {/* 태스크 탭 섹션 (리추얼/투두) */}
          <div className="w-full md:w-1/2 lg:w-7/12">
            <TaskTabs
              selectedDate={selectedDate}
              onTaskClick={handleTaskClick}
              stats={myPageStats}
              completionRate={completionRate}
              isPastDate={isPastDate}
              isOutsidePeriod={isOutsidePeriod}
              routineCompletionMap={routineCompletionMap}
              totalRoutineDays={totalRoutineDays}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
