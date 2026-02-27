"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronsRight } from "lucide-react";
import { TimerProps } from "@/types/home/timer";

// 원형 프로그레스 컴포넌트
function CircularProgress({
  seconds,
  color,
}: {
  seconds: number;
  color: string;
}) {
  const totalTicks = 60; // 60개의 눈금
  const activeTicks = seconds % 60; // 현재 초에 해당하는 활성 눈금

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-72 w-72" viewBox="0 0 200 200">
        {/* 눈금들 */}
        {Array.from({ length: totalTicks }).map((_, i) => {
          const angle = (i * 360) / totalTicks - 90; // -90도부터 시작 (12시 방향)
          const radian = (angle * Math.PI) / 180;
          const innerRadius = 75;
          const outerRadius = 90;

          const x1 = 100 + innerRadius * Math.cos(radian);
          const y1 = 100 + innerRadius * Math.sin(radian);
          const x2 = 100 + outerRadius * Math.cos(radian);
          const y2 = 100 + outerRadius * Math.sin(radian);

          const isActive = i < activeTicks;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isActive ? color : "#E5E7EB"}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Timer({
  taskTitle,
  color,
  onClose,
  onNext,
}: TimerProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // 경과 시간 계산 함수
  const calculateElapsed = useCallback(() => {
    if (!isRunning || startTime === null) {
      return elapsedBeforePause;
    }
    return elapsedBeforePause + Math.floor((Date.now() - startTime) / 1000);
  }, [isRunning, startTime, elapsedBeforePause]);

  // 타이머 업데이트 (1초마다 + visibility change 시)
  useEffect(() => {
    if (!isRunning) return;

    const updateSeconds = () => {
      setSeconds(calculateElapsed());
    };

    // 1초마다 업데이트
    const interval = setInterval(updateSeconds, 1000);

    // 탭이 다시 활성화될 때 즉시 업데이트
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateSeconds();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, calculateElapsed]);

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const handleStartPause = () => {
    if (isRunning) {
      // 일시정지: 현재까지 경과 시간 저장
      setElapsedBeforePause(calculateElapsed());
      setStartTime(null);
    } else {
      // 시작/재개: 현재 시간을 시작점으로
      setStartTime(Date.now());
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedBeforePause(0);
    setSeconds(0);
  };

  const handleNext = () => {
    // 타이머 일시정지
    if (isRunning) {
      setElapsedBeforePause(calculateElapsed());
      setStartTime(null);
      setIsRunning(false);
    }
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      {/* 닫기 버튼 */}
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 태스크 이름 뱃지 */}
      <div className="text-center mb-8">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {taskTitle}
        </span>
        <p className="text-xs text-gray-400 mt-2">
          {isRunning ? "집중 중..." : seconds > 0 ? "일시정지됨" : "준비되면 시작하세요"}
        </p>
      </div>

      {/* 원형 프로그레스 + 타이머 */}
      <div className="relative mb-8 flex items-center justify-center">
        <CircularProgress seconds={seconds} color={color} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-5xl font-bold text-gray-900 tabular-nums">
            {formatTime(seconds)}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            {Math.floor(seconds / 60)}분 {seconds % 60}초
          </span>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      {seconds === 0 && !isRunning ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleStartPause}
            className="rounded-2xl px-14 py-4 text-base font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
            style={{ backgroundColor: color }}
          >
            시작하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleStartPause}
              className="rounded-2xl px-10 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
              style={{ backgroundColor: color }}
            >
              {isRunning ? "일시정지" : "계속하기"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl bg-gray-100 px-6 py-3.5 text-sm font-bold text-gray-500 transition-all hover:bg-gray-200 active:scale-95"
            >
              초기화
            </button>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors mt-2"
          >
            기록하러 가기
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
