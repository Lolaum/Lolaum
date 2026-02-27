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
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
      {/* 유저 정보 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 rounded-full px-2.5 py-1 flex-shrink-0">
          <Flame size={12} className="text-yellow-500" />
          <span className="text-xs font-bold text-yellow-500">12일</span>
        </div>
      </div>

      {/* 오늘의 진행률 */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400 font-medium">오늘의 달성률</span>
          <span className="text-xs font-semibold text-gray-500">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-lg font-bold text-gray-900 mt-2">{progressPercent}%</p>
      </div>
    </div>
  );
}
