"use client";

import { members } from "@/data/members";

const mockProgressData: Record<string, { progress: number; penalty: number }> =
  {
    "1": { progress: 50, penalty: 0 },
    "2": { progress: 80, penalty: 0 },
    "3": { progress: 70, penalty: 1000 },
    "4": { progress: 30, penalty: 2000 },
    "5": { progress: 100, penalty: 0 },
    "6": { progress: 20, penalty: 3000 },
    "7": { progress: 60, penalty: 0 },
    "8": { progress: 90, penalty: 1000 },
  };

const MY_ID = "1";

export default function ProgressContainer() {
  const me = members.find((m) => m.id === MY_ID);
  const myData = mockProgressData[MY_ID] ?? { progress: 0, penalty: 0 };
  const teamMembers = members.filter((m) => m.id !== MY_ID);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* 페이지 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs text-gray-400 font-medium mb-0.5">이번 달 현황</p>
        <h1 className="text-xl font-bold text-gray-900">팀 진행표</h1>
      </div>

      {/* 내 진행도 */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        나의 진행도
      </h2>
      <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: "#fef3c7",
              boxShadow: "0 0 0 2.5px #eab32e, 0 0 0 4px #fefce8",
            }}
          >
            {me?.avatar ? (
              <img
                src={me.avatar}
                alt={me.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : me?.emoji ? (
              <span className="text-2xl">{me.emoji}</span>
            ) : (
              <svg className="w-7 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-yellow-600">
                {me?.name}
              </span>
              <span className="text-sm font-bold text-yellow-500">
                {myData.progress}%
              </span>
            </div>
            <div className="h-2.5 bg-yellow-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${myData.progress}%`,
                  background:
                    myData.progress === 100
                      ? "linear-gradient(90deg, #60a5fa, #3b82f6)"
                      : "linear-gradient(90deg, #fbbf24, #eab308)",
                }}
              />
            </div>
            {myData.penalty > 0 && (
              <p className="text-xs text-red-400 font-medium mt-1.5">
                벌금 {myData.penalty.toLocaleString()}원 발생
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 팀원 진행도 */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        팀원 현황
      </h2>
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col gap-5">
          {teamMembers.map((member) => {
            const data = mockProgressData[member.id] ?? {
              progress: 0,
              penalty: 0,
            };
            const hasPenalty = data.penalty > 0;

            return (
              <div key={member.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : member.emoji ? (
                    <span className="text-lg">{member.emoji}</span>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {member.name}
                      </span>
                      {hasPenalty && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-400">
                          벌금 {data.penalty.toLocaleString()}원
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {data.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${data.progress}%`,
                        background:
                          data.progress === 100
                            ? "linear-gradient(90deg, #60a5fa, #3b82f6)"
                            : "linear-gradient(90deg, #fbbf24, #eab308)",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        매일 인증 완료 시 자동으로 업데이트됩니다
      </p>
    </div>
  );
}
