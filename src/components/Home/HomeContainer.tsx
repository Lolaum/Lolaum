"use client";

import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation"; // 중간 회고 알림 숨김으로 미사용
import HomCalendar from "./HomeCalendar";
import TaskTabs from "./Todo/TaskTabs";
import MemberProfile from "./Profile/MemberProfile";
import Profile from "./Profile/Profile";
import Timer from "./Timer/Timer";
import ReadingContainer from "@/components/Routines/Reading/ReadingContainer";
import LanguageContainer from "@/components/Routines/Language/LanguageContainer";
import ExerciseContainer from "@/components/Routines/Exercise/ExerciseContainer";
import MorningContainer from "@/components/Routines/Morning/MorningContainer";
import FinanceContainer from "@/components/Routines/Finance/FinanceContainer";
import RecordingContainer from "@/components/Routines/Recording/RecordingContainer";
import PhotoCertification from "@/components/Ritual/PhotoCertification";
import { getHomeStats, MyPageStats, CompletionRateStats, CalendarDayMarker } from "@/api/ritual-stats";

type RitualStep = "pre_photo" | "timer" | "post_photo" | "record";

// 중간 회고 작성 기간 알림 — 숨김 처리
// const CURRENT_DAY: number = 11;
// const IS_MID_REVIEW_PERIOD = CURRENT_DAY >= 10 && CURRENT_DAY <= 13;
// const IS_LAST_DAY = CURRENT_DAY === 13;
// const DAYS_LEFT = 13 - CURRENT_DAY;

// 시작/종료 인증 사진이 필요한 리추얼 목록
const NEEDS_PHOTO_FLOW = [
  "운동리추얼",
  "영어리추얼",
  "독서리추얼",
  "제2외국어리추얼",
  "자산관리리추얼",
  "원서읽기리추얼",
  "기록리추얼",
];

export default function HomeContainer() {
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

  // 리추얼 진행 단계 상태 머신
  const [ritualStep, setRitualStep] = useState<RitualStep | null>(null);
  const [startPhoto, setStartPhoto] = useState<string | null>(null);
  const [endPhoto, setEndPhoto] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [myPageStats, setMyPageStats] = useState<MyPageStats | null>(null);
  const [completionRate, setCompletionRate] = useState<CompletionRateStats | null>(null);
  const [calendarMarkers, setCalendarMarkers] = useState<Record<string, CalendarDayMarker>>({});
  const [routineCompletionMap, setRoutineCompletionMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now);
    setMounted(true);
  }, []);

  // Profile + TaskTabs가 같은 데이터를 쓰므로 컨테이너에서 한 번만 호출
  // (myPage stats + completion rate를 단일 server action으로 통합)
  useEffect(() => {
    getHomeStats().then((res) => {
      if (res.myPage) setMyPageStats(res.myPage);
      if (res.completion) setCompletionRate(res.completion);
      if (res.calendarMarkers) setCalendarMarkers(res.calendarMarkers);
      if (res.routineCompletionMap) setRoutineCompletionMap(res.routineCompletionMap);
    });
  }, []);

  // 선택된 날짜가 오늘 이전인지 확인
  const isPastDate = selectedDate && today
    ? selectedDate.toDateString() !== today.toDateString() && selectedDate < today
    : false;

  const handleTaskClick = (title: string, color: string) => {
    if (isPastDate) return; // 지난 날짜에서는 루틴 진행 불가
    setSelectedTask({ title, color });
    if (title === "모닝리추얼" || title === "원서읽기리추얼") {
      // 타이머 없이 바로 기록폼
      setRitualStep("record");
      return;
    }
    if (NEEDS_PHOTO_FLOW.includes(title)) {
      setRitualStep("pre_photo");
    } else {
      setRitualStep("timer");
    }
  };

  const handleCloseTimer = () => {
    setSelectedTask(null);
    setRitualStep(null);
    setStartPhoto(null);
    setEndPhoto(null);
    setElapsedSeconds(0);
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

  // 리추얼 진행 화면 렌더링
  if (selectedTask && ritualStep) {
    const certPhotos =
      startPhoto && endPhoto ? [startPhoto, endPhoto] : [];

    const wrap = (children: React.ReactNode) => (
      <div className="w-full px-4 py-3 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    );

    // STEP 1: 시작 인증 사진
    if (ritualStep === "pre_photo") {
      return wrap(
        <PhotoCertification
          mode="start"
          taskTitle={selectedTask.title}
          color={selectedTask.color}
          onPhotoTaken={(photo) => {
            setStartPhoto(photo);
            setRitualStep("timer");
          }}
          onClose={handleCloseTimer}
        />
      );
    }

    // STEP 2: 타이머
    if (ritualStep === "timer") {
      return wrap(
        <Timer
          taskTitle={selectedTask.title}
          color={selectedTask.color}
          startPhoto={startPhoto ?? undefined}
          onClose={handleCloseTimer}
          onNext={(seconds) => {
            setElapsedSeconds(seconds);
            if (NEEDS_PHOTO_FLOW.includes(selectedTask.title)) {
              setRitualStep("post_photo");
            } else {
              setRitualStep("record");
            }
          }}
        />
      );
    }

    // STEP 3: 종료 인증 사진
    if (ritualStep === "post_photo") {
      return wrap(
        <PhotoCertification
          mode="end"
          taskTitle={selectedTask.title}
          color={selectedTask.color}
          elapsedSeconds={elapsedSeconds}
          onPhotoTaken={(photo) => {
            setEndPhoto(photo);
            setRitualStep("record");
          }}
          onClose={handleCloseTimer}
        />
      );
    }

    // STEP 4: 기록 추가 컨테이너
    if (ritualStep === "record") {
      if (selectedTask.title === "모닝리추얼") {
        return wrap(
          <MorningContainer
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
          />
        );
      }

      if (selectedTask.title === "독서리추얼") {
        return wrap(
          <ReadingContainer
            certificationPhotos={certPhotos}
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
          />
        );
      }

      if (selectedTask.title === "원서읽기리추얼") {
        return wrap(
          <ReadingContainer
            certificationPhotos={certPhotos}
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
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
            certificationPhotos={certPhotos}
            elapsedSeconds={elapsedSeconds}
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
            languageType={
              selectedTask.title === "영어리추얼" ? "영어" : "제2외국어"
            }
          />
        );
      }

      if (selectedTask.title === "운동리추얼") {
        return wrap(
          <ExerciseContainer
            certificationPhotos={certPhotos}
            elapsedSeconds={elapsedSeconds}
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
          />
        );
      }

      if (selectedTask.title === "자산관리리추얼") {
        return wrap(
          <FinanceContainer
            certificationPhotos={certPhotos}
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
          />
        );
      }

      if (selectedTask.title === "기록리추얼") {
        return wrap(
          <RecordingContainer
            certificationPhotos={certPhotos}
            elapsedSeconds={elapsedSeconds}
            onBackToTimer={handleCloseTimer}
            onBackToHome={handleCloseTimer}
          />
        );
      }
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
            />
            <Profile stats={myPageStats} completionRate={completionRate} />
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

          {/* 태스크 탭 섹션 (루틴/투두) */}
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
