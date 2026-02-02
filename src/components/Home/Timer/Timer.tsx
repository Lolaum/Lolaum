"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronsRight } from "lucide-react";

interface TimerProps {
  taskTitle: string;
  color: string; // hex 값 (예: "#60A5FA")
  onClose: () => void;
}

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

export default function Timer({ taskTitle, color, onClose }: TimerProps) {
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
    // TODO: 다음 루틴으로 이동하는 로직
    console.log("다음으로 이동");
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-white px-4">
      {/* 뒤로가기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute left-4 top-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
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

      <div className="w-full max-w-sm text-center">
        {/* 태스크 제목 */}
        <h1 className="mb-8 text-lg font-medium" style={{ color: color }}>
          {taskTitle}
        </h1>

        {/* 원형 프로그레스 + 타이머 */}
        <div className="relative mb-12 flex items-center justify-center">
          <CircularProgress seconds={seconds} color={color} />
          {/* 중앙 타이머 표시 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-5xl font-bold text-gray-900">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        {seconds === 0 && !isRunning ? (
          // 시작 전 상태
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleStartPause}
              className="rounded-full px-12 py-3 text-base font-bold text-white transition-colors hover:bg-orange-600"
              style={{
                backgroundColor: color,
                opacity: isRunning ? 1 : 0.9,
              }}
            >
              시작
            </button>
          </div>
        ) : (
          // 진행 중 또는 일시중지 상태
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStartPause}
                className="rounded-full px-12 py-3 text-base font-bold text-white transition-colors"
                style={{
                  backgroundColor: color,
                  opacity: isRunning ? 1 : 0.9,
                }}
              >
                {isRunning ? "일시중지" : "계속하기"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full bg-gray-200 px-8 py-3 text-base font-bold text-gray-600 transition-colors hover:bg-gray-300"
              >
                초기화
              </button>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1 text-base font-medium text-gray-500 hover:text-gray-700 underline mt-5"
            >
              다음으로
              <ChevronsRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
