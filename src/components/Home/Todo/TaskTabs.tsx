"use client";

import { useRouter } from "next/navigation";
import {
  Flame,
  TrendingUp,
  CheckCircle2,
  Flag,
  ClipboardCheck,
  Trophy,
} from "lucide-react";
import RoutineList from "./RoutineList";
import { formatDateDisplay, getWeekRangeText } from "@/lib/date";
import { MyPageStats } from "@/api/ritual-stats";
import type { ChallengeRegistration } from "@/types/supabase";

interface TaskTabsProps {
  selectedDate: Date;
  onTaskClick?: (title: string, color: string) => void;
  stats?: MyPageStats | null;
  isPastDate?: boolean;
  isOutsidePeriod?: boolean;
  routineCompletionMap?: Record<string, number>;
  totalRoutineDays?: number;
  initialRoutines?: ChallengeRegistration[];
}

export default function TaskTabs({
  selectedDate,
  onTaskClick,
  stats,
  isPastDate,
  isOutsidePeriod,
  routineCompletionMap,
  totalRoutineDays,
  initialRoutines,
}: TaskTabsProps) {
  const router = useRouter();

  const handleTaskClick = (title: string, color: string) => {
    onTaskClick?.(title, color);
  };

  return (
    <div className="contents md:flex md:flex-col md:gap-4">
      {/* 통계 카드 */}
      <div className="order-5 grid w-full grid-cols-3 gap-3 md:order-1">
        {[
          {
            value: String(stats?.currentStreak ?? 0),
            label: "연속 실천",
            icon: Flame,
            color: "#ff8900",
          },
          {
            value: String(stats?.longestStreak ?? 0),
            label: "최장 기록",
            icon: TrendingUp,
            color: "#6366f1",
          },
          {
            value: String(stats?.totalCompletions ?? 0),
            label: "총 완료",
            icon: CheckCircle2,
            color: "#10b981",
          },
        ].map(({ value, label, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center gap-1"
          >
            <Icon className="w-4 h-4 mb-1" style={{ color }} strokeWidth={2} />
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-xs text-gray-400 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="order-6 grid w-full grid-cols-3 gap-3 md:order-2">
        {[
          {
            label: "리추얼선언",
            icon: Flag,
            onClick: () => router.push("/declaration"),
          },
          {
            label: "중간회고",
            icon: ClipboardCheck,
            onClick: () => router.push("/mid-review"),
          },
          {
            label: "최종회고",
            icon: Trophy,
            onClick: () => router.push("/final-review"),
          },
        ].map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center gap-1.5 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <Icon className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 리추얼 카드 */}
      <div className="order-2 w-full rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:order-3">
        {/* 날짜 */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            {formatDateDisplay(selectedDate)}
          </p>
          <h2 className="text-base font-bold text-gray-800">
            {getWeekRangeText(selectedDate)}
          </h2>
        </div>

        {/* 콘텐츠 */}
        <RoutineList
          selectedDate={selectedDate}
          onTaskClick={handleTaskClick}
          initialRoutines={initialRoutines}
          routineCompletionMap={routineCompletionMap}
          isPastDate={isPastDate}
          isOutsidePeriod={isOutsidePeriod}
          totalRoutineDays={totalRoutineDays}
        />
      </div>
    </div>
  );
}
