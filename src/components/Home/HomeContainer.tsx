"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
// import { useRouter } from "next/navigation"; // 중간 회고 알림 숨김으로 미사용
import HomCalendar from "./HomeCalendar";
import TaskTabs from "./Todo/TaskTabs";
import MemberProfile from "./Profile/MemberProfile";
import Profile from "./Profile/Profile";

const ReadingContainer = dynamic(() => import("@/components/Routines/Reading/ReadingContainer"), { ssr: false });
const LanguageContainer = dynamic(() => import("@/components/Routines/Language/LanguageContainer"), { ssr: false });
const ExerciseContainer = dynamic(() => import("@/components/Routines/Exercise/ExerciseContainer"), { ssr: false });
const MorningContainer = dynamic(() => import("@/components/Routines/Morning/MorningContainer"), { ssr: false });
const FinanceContainer = dynamic(() => import("@/components/Routines/Finance/FinanceContainer"), { ssr: false });
const RecordingContainer = dynamic(() => import("@/components/Routines/Recording/RecordingContainer"), { ssr: false });
import { type MyPageStats, type CompletionRateStats, type CalendarDayMarker } from "@/api/ritual-stats";

interface HomeInitialData {
  myPage?: MyPageStats;
  completion?: CompletionRateStats;
  calendarMarkers?: Record<string, CalendarDayMarker>;
  routineCompletionMap?: Record<string, number>;
  error?: string;
}

export default function HomeContainer({ initialData }: { initialData: HomeInitialData }) {
  // const router = useRouter(); // 중간 회고 알림 숨김으로 미사용
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<
    string | undefined
  >();
  const [selectedTask, setSelectedTask] = useState<{
    title: string;
    color: string;
  } | null>(null);

  const [myPageStats, setMyPageStats] = useState<MyPageStats | null>(initialData.myPage ?? null);
  const [completionRate, setCompletionRate] = useState<CompletionRateStats | null>(initialData.completion ?? null);
  const [calendarMarkers, setCalendarMarkers] = useState<Record<string, CalendarDayMarker>>(initialData.calendarMarkers ?? {});
  const [routineCompletionMap, setRoutineCompletionMap] = useState<Record<string, number>>(initialData.routineCompletionMap ?? {});
  const [memberRefreshKey, setMemberRefreshKey] = useState(0);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now);
    setMounted(true);
  }, []);

  // 선택된 날짜가 오늘 이전인지 확인
  const isPastDate = selectedDate && today
    ? selectedDate.toDateString() !== today.toDateString() && selectedDate < today
    : false;

  const handleTaskClick = (title: string, color: string) => {
    if (isPastDate) return; // 지난 날짜에서는 리추얼 진행 불가
    setSelectedTask({ title, color });
  };

  const handleClose = () => {
    setSelectedTask(null);
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

  // 리추얼 기록 화면 렌더링
  if (selectedTask) {
    const wrap = (children: React.ReactNode) => (
      <div className="w-full px-4 py-3 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    );

    if (selectedTask.title === "모닝리추얼") {
      return wrap(
        <MorningContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
        />
      );
    }

    if (selectedTask.title === "독서리추얼") {
      return wrap(
        <ReadingContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
        />
      );
    }

    if (selectedTask.title === "원서읽기리추얼") {
      return wrap(
        <ReadingContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
          isEnglishBook
        />
      );
    }

    if (
      selectedTask.title === "영어리추얼" ||
      selectedTask.title === "제2외국어리추얼"
    ) {
      return wrap(
        <LanguageContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
          languageType={
            selectedTask.title === "영어리추얼" ? "영어" : "제2외국어"
          }
        />
      );
    }

    if (selectedTask.title === "운동리추얼") {
      return wrap(
        <ExerciseContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
        />
      );
    }

    if (selectedTask.title === "자산관리리추얼") {
      return wrap(
        <FinanceContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
        />
      );
    }

    if (selectedTask.title === "기록리추얼") {
      return wrap(
        <RecordingContainer
          onBackToTimer={handleClose}
          onBackToHome={handleClose}
        />
      );
    }
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 md:px-8 lg:px-12">
      {/* 모바일: 세로 배치, md 이상: 가로 배치 */}
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
              onProfileUpdated={() => setMemberRefreshKey((k) => k + 1)}
            />
            {/* 중간 회고 작성 기간 알림 — 숨김 처리
            {IS_MID_REVIEW_PERIOD && (
              <button
                onClick={() => router.push("/mid-review")}
                className="w-full rounded-2xl p-4 mb-3 text-left transition-opacity hover:opacity-90 active:opacity-80"
                style={{
                  background: IS_LAST_DAY
                    ? "linear-gradient(135deg, #fee2e2, #fecaca)"
                    : "linear-gradient(135deg, #fef3c7, #fde68a)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-bold mb-0.5"
                      style={{ color: IS_LAST_DAY ? "#991b1b" : "#92400e" }}
                    >
                      {IS_LAST_DAY ? "⚠️ 오늘이 마지막 기회예요!" : "✍️ 중간 회고 작성 기간입니다"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: IS_LAST_DAY ? "#b91c1c" : "#b45309" }}
                    >
                      {DAYS_LEFT > 0
                        ? `${DAYS_LEFT}일 뒤 마감 · 지금 바로 작성하기 →`
                        : "오늘 자정까지 작성해주세요 →"}
                    </p>
                  </div>
                  <span className="text-2xl ml-3">📝</span>
                </div>
              </button>
            )}
            */}
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
              routineCompletionMap={routineCompletionMap}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
