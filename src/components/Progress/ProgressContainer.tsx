"use client";

import {
  type ChallengerProgress,
  type ProgressPageData,
} from "@/api/progress";

export default function ProgressContainer({
  initialData,
}: {
  initialData: ProgressPageData | null;
}) {
  const data = initialData;

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-xs text-gray-400 font-medium mb-0.5">
            이번 달 현황
          </p>
          <h1 className="text-xl font-bold text-gray-900">리추얼 진행표</h1>
        </div>
        <p className="text-center text-gray-400 py-12">
          데이터를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  const { me, challengers, totalDays } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* 페이지 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs text-gray-400 font-medium mb-0.5">이번 달 현황</p>
        <h1 className="text-xl font-bold text-gray-900">리추얼 진행표</h1>
      </div>

      {/* 내 진행도 */}
      {me && (
        <>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            나의 진행도
          </h2>
          <MyProgressCard member={me} totalDays={totalDays} />
        </>
      )}

      {/* 팀원 진행도 */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
        챌린저 현황
      </h2>
      {challengers.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-8">
          <p className="text-center text-gray-400 text-sm">
            아직 참여 중인 챌린저가 없습니다.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col gap-5">
            {challengers.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                totalDays={totalDays}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        매일 인증 완료 시 자동으로 업데이트됩니다
      </p>
    </div>
  );
}

function Avatar({
  avatarUrl,
  emoji,
  name,
  size = "sm",
}: {
  avatarUrl: string | null;
  emoji: string | null;
  name: string;
  size?: "sm" | "lg";
}) {
  const isLarge = size === "lg";
  const wrapperClass = isLarge
    ? "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
    : "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0";

  return (
    <div
      className={wrapperClass}
      style={
        isLarge
          ? {
              backgroundColor: "#fef3c7",
              boxShadow: "0 0 0 2.5px #eab32e, 0 0 0 4px #fefce8",
            }
          : undefined
      }
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : emoji ? (
        <span className={isLarge ? "text-2xl" : "text-lg"}>{emoji}</span>
      ) : (
        <svg
          className={
            isLarge ? "w-7 h-7 text-yellow-400" : "w-5 h-5 text-gray-400"
          }
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className={`h-2.5 bg-${progress === 100 ? "blue" : "yellow"}-100 rounded-full overflow-hidden`}
      style={{ backgroundColor: progress === 100 ? "#dbeafe" : undefined }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${progress}%`,
          background:
            progress === 100
              ? "linear-gradient(90deg, #60a5fa, #3b82f6)"
              : "linear-gradient(90deg, #fbbf24, #eab308)",
        }}
      />
    </div>
  );
}

function Badges({
  member,
  size = "sm",
}: {
  member: ChallengerProgress;
  size?: "sm" | "lg";
}) {
  const textSize = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <>
      {member.happyChanceUsed && member.penaltyAmount === 0 && (
        <span
          className={`${textSize} font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-500`}
        >
          행복찬스
        </span>
      )}
      {member.penaltyAmount > 0 && (
        <>
          <span
            className={`${textSize} font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-500`}
          >
            행복찬스
          </span>
          <span
            className={`${textSize} font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-400`}
          >
            기부금 {member.penaltyAmount.toLocaleString()}원
          </span>
        </>
      )}
    </>
  );
}

function MyProgressCard({
  member,
  totalDays,
}: {
  member: ChallengerProgress;
  totalDays: number;
}) {
  const progress = Math.round((member.totalAchieved / totalDays) * 100);

  return (
    <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-4 mb-6">
      <div className="flex items-center gap-4">
        <Avatar
          avatarUrl={member.avatarUrl}
          emoji={member.emoji}
          name={member.name}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-yellow-600">
                {member.name}
              </span>
              <Badges member={member} size="lg" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-400">
                {member.totalAchieved}/{totalDays}
              </span>
              <span className="text-sm font-bold text-yellow-500">
                {progress}%
              </span>
            </div>
          </div>
          <div className="h-2.5 bg-yellow-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background:
                  progress === 100
                    ? "linear-gradient(90deg, #60a5fa, #3b82f6)"
                    : "linear-gradient(90deg, #fbbf24, #eab308)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  totalDays,
}: {
  member: ChallengerProgress;
  totalDays: number;
}) {
  const progress = Math.round((member.totalAchieved / totalDays) * 100);

  return (
    <div className="flex items-center gap-4">
      <Avatar
        avatarUrl={member.avatarUrl}
        emoji={member.emoji}
        name={member.name}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">
              {member.name}
            </span>
            <Badges member={member} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-300">
              {member.totalAchieved}/{totalDays}
            </span>
            <span className="text-xs font-bold text-gray-400">{progress}%</span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              background:
                progress === 100
                  ? "linear-gradient(90deg, #60a5fa, #3b82f6)"
                  : "linear-gradient(90deg, #fbbf24, #eab308)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
