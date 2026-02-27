"use client";

import { ProfileProps } from "@/types/home/profile";
import { Flame } from "lucide-react";

export default function Profile({
  name = "사용자 이름",
  description = "매일 성장하는 습관 만들기",
  completedCount = 3,
  totalCount = 4,
}: ProfileProps) {
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="rounded-3xl p-5 mb-4 text-white relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #c99315 0%, #eab32e 50%, #ff9c28 100%)",
      }}
    >
      {/* 배경 장식 */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative">
        {/* 유저 정보 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{name}</h3>
            <p className="text-xs text-white/70 truncate">{description}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
            <Flame size={12} className="text-white" />
            <span className="text-xs font-bold text-white">12일</span>
          </div>
        </div>

        {/* 오늘의 진행률 */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-white/70">오늘의 달성률</span>
            <span className="text-xs font-bold text-white">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between items-center">
            <p className="text-xl font-bold text-white">{progressPercent}%</p>
            <p className="text-xs text-white/60">완료</p>
          </div>
        </div>
      </div>
    </div>
  );
}
