"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TimerProps {
  taskTitle: string;
  onClose: () => void;
}

// 원형 프로그레스 컴포넌트
function CircularProgress({ seconds }: { seconds: number }) {
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
              stroke={isActive ? "#3B82F6" : "#E5E7EB"}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Timer({ taskTitle, onClose }: TimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
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
        <h1 className="mb-8 text-lg font-medium text-blue-500">{taskTitle}</h1>

        {/* 원형 프로그레스 + 타이머 */}
        <div className="relative mb-12 flex items-center justify-center">
          <CircularProgress seconds={seconds} />
          {/* 중앙 타이머 표시 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-5xl font-bold text-gray-900">
              {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleStartPause}
            className="rounded-full border border-blue-400 px-12 py-3 text-sm font-medium text-blue-500 transition-colors hover:bg-blue-50"
          >
            {isRunning ? "일시 중지" : "시작"}
          </button>
        </div>

        {/* 초기화 버튼 */}
        {seconds > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
