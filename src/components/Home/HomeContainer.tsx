"use client";

import React, { useState, useEffect } from "react";
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

export default function HomeContainer() {
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
  const [showReading, setShowReading] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [showMorning, setShowMorning] = useState(false);
  const [showFinance, setShowFinance] = useState(false);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setSelectedDate(now);
    setMounted(true);
  }, []);

  const handleTaskClick = (title: string, color: string) => {
    setSelectedTask({ title, color });
    // 모닝 리추얼은 타이머 없이 바로 표시
    if (title === "모닝리추얼") {
      setShowMorning(true);
    }
  };

  const handleCloseTimer = () => {
    setSelectedTask(null);
    setShowReading(false);
    setShowLanguage(false);
    setShowExercise(false);
    setShowMorning(false);
    setShowFinance(false);
  };

  const handleNext = () => {
    if (selectedTask?.title === "독서리추얼") {
      setShowReading(true);
    } else if (
      selectedTask?.title === "영어리추얼" ||
      selectedTask?.title === "언어리추얼"
    ) {
      setShowLanguage(true);
    } else if (selectedTask?.title === "운동리추얼") {
      setShowExercise(true);
    } else if (selectedTask?.title === "자산관리리추얼") {
      setShowFinance(true);
    }
  };

  const handleCloseReading = () => {
    setShowReading(false);
  };

  const handleCloseLanguage = () => {
    setShowLanguage(false);
  };

  const handleCloseExercise = () => {
    setShowExercise(false);
  };

  const handleCloseMorning = () => {
    setShowMorning(false);
  };

  const handleCloseFinance = () => {
    setShowFinance(false);
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

  // Timer 또는 각종 Container가 활성화되면 해당 화면만 표시
  if (selectedTask) {
    return (
      <div className="w-full px-4 py-3 sm:px-6 md:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {showReading ? (
            <div>
              <ReadingContainer onBackToTimer={handleCloseReading} onBackToHome={handleCloseTimer} />
            </div>
          ) : showLanguage ? (
            <div>
              <LanguageContainer
                onBackToTimer={handleCloseLanguage}
                onBackToHome={handleCloseTimer}
                languageType={
                  selectedTask.title === "영어리추얼" ? "영어" : "언어"
                }
              />
            </div>
          ) : showExercise ? (
            <div>
              <ExerciseContainer onBackToTimer={handleCloseExercise} onBackToHome={handleCloseTimer} />
            </div>
          ) : showMorning ? (
            <div>
              <MorningContainer onBackToTimer={handleCloseMorning} onBackToHome={handleCloseTimer} />
            </div>
          ) : showFinance ? (
            <div>
              <FinanceContainer onBackToTimer={handleCloseFinance} onBackToHome={handleCloseTimer} />
            </div>
          ) : (
            <Timer
              taskTitle={selectedTask.title}
              color={selectedTask.color}
              onClose={handleCloseTimer}
              onNext={handleNext}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-3 sm:px-6 md:px-8 lg:px-12">
      {/* 모바일: 세로 배치, md 이상: 가로 배치 */}
      <div className="mx-auto max-w-7xl scale-[0.8] origin-top">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* 캘린더 섹션 */}
          <div className="w-full md:w-1/2 lg:w-5/12">
            <MemberProfile
              selectedMemberId={selectedMemberId}
              onSelectMember={(id) =>
                setSelectedMemberId((prev) => (prev === id ? undefined : id))
              }
            />
            <Profile />
            <div className="sticky top-0 z-10 static">
              <HomCalendar
                today={today}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
          </div>

          {/* 태스크 탭 섹션 (루틴/투두) */}
          <div className="w-full md:w-1/2 lg:w-7/12">
            <TaskTabs
              selectedDate={selectedDate}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
