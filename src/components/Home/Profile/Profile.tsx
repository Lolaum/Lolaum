"use client";

interface ProfileProps {
  name?: string;
  description?: string;
  completedCount?: number;
  totalCount?: number;
}

export default function Profile({
  name = "사용자 이름",
  description = "매일 성장하는 습관 만들기",
  completedCount = 3,
  totalCount = 4,
}: ProfileProps) {
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white shadow-md p-5 mb-4">
      <div className="flex items-center gap-4">
        {/* 프로필 아이콘 */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-7 h-7 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        {/* 사용자 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {name}
          </h3>
          <p className="text-sm text-gray-500 truncate">{description}</p>
        </div>
      </div>

      {/* 진행률 */}
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-[var(--gold-300)] flex-shrink-0">
            {progressPercent}%
          </span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--gold-300)] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 flex-shrink-0">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
