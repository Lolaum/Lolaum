"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Coins,
  MessageCircle,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { useKoreaMidnightRefresh } from "@/lib/hooks/useKoreaMidnightRefresh";
import { addDaysToDateKey, parseDateKey } from "@/lib/korea-date";
import { type ChallengerProgress, type ProgressPageData } from "@/api/progress";

export default function ProgressContainer({
  initialData,
}: {
  initialData: ProgressPageData | null;
}) {
  useKoreaMidnightRefresh();
  const data = initialData;
  const [activeTab, setActiveTab] = useState<"donation" | "daily" | "points">(
    "donation",
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    if (!initialData) return "";
    return initialData.today < initialData.periodStart
      ? initialData.periodStart
      : initialData.today;
  });

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

  const { me, challengers } = data;
  const totalDonationAmount = [me, ...challengers].reduce(
    (sum, member) => sum + (member?.penaltyAmount ?? 0),
    0,
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* 페이지 헤더 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-6">
        <p className="text-xs text-gray-400 font-medium mb-0.5">이번 달 현황</p>
        <h1 className="text-xl font-bold text-gray-900">리추얼 진행표</h1>
      </div>

      <div
        role="tablist"
        aria-label="리추얼 진행표 보기"
        className="mb-6 flex overflow-x-auto border-b border-gray-200 scrollbar-hide"
      >
        <ProgressTab
          selected={activeTab === "donation"}
          onClick={() => setActiveTab("donation")}
        >
          기부금 현황
        </ProgressTab>
        <ProgressTab
          selected={activeTab === "daily"}
          onClick={() => setActiveTab("daily")}
        >
          일일 인증
        </ProgressTab>
        <ProgressTab
          selected={activeTab === "points"}
          onClick={() => setActiveTab("points")}
        >
          포인트 순위
        </ProgressTab>
      </div>

      {activeTab === "donation" ? (
        <>
          {/* 내 진행도 */}
          {me && (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                나의 진행도
              </h2>
              <MyProgressCard member={me} />
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
                  <MemberRow key={member.userId} member={member} />
                ))}
              </div>
            </div>
          )}

          <DonationSummary amount={totalDonationAmount} />

          <p className="mt-4 text-xs text-gray-400 text-center">
            매일 인증 완료 시 자동으로 업데이트됩니다
          </p>
        </>
      ) : activeTab === "daily" ? (
        <DailyCompletionPanel
          members={me ? [me, ...challengers] : challengers}
          selectedDate={selectedDate}
          periodStart={data.periodStart}
          periodEnd={data.periodEnd}
          latestDate={
            data.today < data.periodStart ? data.periodStart : data.today
          }
          onDateChange={setSelectedDate}
        />
      ) : (
        <PointsRanking
          members={me ? [me, ...challengers] : challengers}
          history={data.myPointHistory}
          myPoints={me?.points ?? 0}
        />
      )}
    </div>
  );
}

function ProgressTab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`-mb-px min-h-11 shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
        selected
          ? "border-[var(--gold-400)] text-[var(--gold-500)]"
          : "border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

function DailyCompletionPanel({
  members,
  selectedDate,
  periodStart,
  periodEnd,
  latestDate,
  onDateChange,
}: {
  members: ChallengerProgress[];
  selectedDate: string;
  periodStart: string;
  periodEnd: string;
  latestDate: string;
  onDateChange: (date: string) => void;
}) {
  const maxDate = latestDate < periodEnd ? latestDate : periodEnd;
  const eligibleMembers = members.filter(
    (member) => member.effectiveStart <= selectedDate,
  );
  const notStartedMembers = members.filter(
    (member) => member.effectiveStart > selectedDate,
  );
  const completedMembers = eligibleMembers.filter((member) =>
    isDailyComplete(member, selectedDate),
  );
  const pendingMembers = eligibleMembers.filter(
    (member) => !isDailyComplete(member, selectedDate),
  );

  const moveDate = (days: number) => {
    const nextDate = addDaysToDateKey(selectedDate, days);
    if (nextDate < periodStart || nextDate > maxDate) return;
    onDateChange(nextDate);
  };

  return (
    <section aria-labelledby="daily-completion-heading">
      <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-50)] text-[var(--gold-400)]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="daily-completion-heading"
              className="text-base font-bold text-gray-900"
            >
              날짜별 인증 현황
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              등록한 리추얼을 모두 인증한 멤버를 확인해요
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveDate(-1)}
            disabled={selectedDate <= periodStart}
            aria-label="이전 날짜"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <input
            type="date"
            value={selectedDate}
            min={periodStart}
            max={maxDate}
            onChange={(event) => {
              if (event.target.value) onDateChange(event.target.value);
            }}
            aria-label="인증 현황 날짜"
            className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-center text-sm font-semibold text-gray-800 outline-none focus:border-[var(--gold-400)] focus:ring-2 focus:ring-[var(--gold-100)]"
          />
          <button
            type="button"
            onClick={() => moveDate(1)}
            disabled={selectedDate >= maxDate}
            aria-label="다음 날짜"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--gold-100)] bg-[var(--gold-50)] p-4">
          <p className="text-xs font-semibold text-[var(--gold-500)]">
            인증 완료
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {completedMembers.length}
            <span className="ml-1 text-sm font-medium text-gray-400">명</span>
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">아직 미완료</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {pendingMembers.length}
            <span className="ml-1 text-sm font-medium text-gray-400">명</span>
          </p>
        </div>
      </div>

      <DailyMemberSection
        title="인증 완료"
        emptyText="아직 인증을 모두 완료한 멤버가 없어요."
        members={completedMembers}
        selectedDate={selectedDate}
        complete
      />
      <DailyMemberSection
        title="아직 미완료"
        emptyText="모든 멤버가 인증을 완료했어요."
        members={pendingMembers}
        selectedDate={selectedDate}
      />
      {notStartedMembers.length > 0 && (
        <DailyMemberSection
          title="참여 전"
          emptyText=""
          members={notStartedMembers}
          selectedDate={selectedDate}
          notStarted
        />
      )}
    </section>
  );
}

function DailyMemberSection({
  title,
  emptyText,
  members,
  selectedDate,
  complete = false,
  notStarted = false,
}: {
  title: string;
  emptyText: string;
  members: ChallengerProgress[];
  selectedDate: string;
  complete?: boolean;
  notStarted?: boolean;
}) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 px-1 text-xs font-semibold text-gray-400">
        {title} {members.length > 0 && `${members.length}명`}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {members.length === 0 ? (
          <p className="p-5 text-center text-sm text-gray-400">{emptyText}</p>
        ) : (
          members.map((member, index) => {
            const completedCount =
              member.dailyCompletedRoutineCounts[selectedDate] ?? 0;
            return (
              <div
                key={member.userId}
                className={`flex items-center gap-3 p-4 ${
                  index > 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <Avatar
                  avatarUrl={member.avatarUrl}
                  emoji={member.emoji}
                  name={member.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {notStarted
                      ? `${formatDailyDate(member.effectiveStart)}부터 참여`
                      : `${completedCount}/${member.registeredRoutineCount}개 리추얼 인증`}
                  </p>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    complete
                      ? "bg-[var(--gold-50)] text-[var(--gold-500)]"
                      : notStarted
                        ? "bg-gray-50 text-gray-400"
                        : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5" />
                  )}
                  {complete ? "완료" : notStarted ? "참여 전" : "미완료"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function isDailyComplete(member: ChallengerProgress, date: string) {
  return (
    member.registeredRoutineCount > 0 &&
    (member.dailyCompletedRoutineCounts[date] ?? 0) >=
      member.registeredRoutineCount
  );
}

function formatDailyDate(dateKey: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(parseDateKey(dateKey));
}

function PointsRanking({
  members,
  history,
  myPoints,
}: {
  members: ChallengerProgress[];
  history: ProgressPageData["myPointHistory"];
  myPoints: number;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const rankedMembers = [...members].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name, "ko"),
  );

  return (
    <section aria-labelledby="points-ranking-heading">
      <div className="mb-4 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-yellow-500 shadow-sm">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="points-ranking-heading"
              className="text-base font-bold text-gray-900"
            >
              포인트 순위
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              다른 챌린저의 글에 남긴 좋아요와 댓글로 쌓은 포인트예요
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button
          type="button"
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((open) => !open)}
          className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-50)] text-[var(--gold-500)]">
            <Coins className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">내 포인트 내역</p>
            <p className="mt-0.5 text-xs text-gray-400">
              좋아요 +1P · 댓글 +2P · 하루 최대 5P
            </p>
          </div>
          <span className="text-sm font-bold text-yellow-600">
            {myPoints.toLocaleString()}P
          </span>
          {historyOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {historyOpen && (
          <div className="border-t border-gray-100">
            <p className="bg-gray-50 px-4 py-2 text-[11px] text-gray-400">
              다른 챌린저의 글에 남긴 활동만 적립되며, 일일 한도를 넘은 활동도
              확인할 수 있어요.
            </p>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                아직 적립 내역이 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((entry) => {
                  const Icon =
                    entry.type === "comment" ? MessageCircle : ThumbsUp;
                  const content = (
                    <>
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          entry.type === "comment"
                            ? "bg-sky-50 text-sky-500"
                            : "bg-amber-50 text-amber-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-700">
                          {entry.targetName}님의 글에{" "}
                          {entry.type === "comment" ? "댓글" : "좋아요"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatPointHistoryDate(entry.createdAt)}
                          {entry.awardedPoints < entry.basePoints &&
                            " · 일일 한도 적용"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold ${
                          entry.awardedPoints > 0
                            ? "text-yellow-600"
                            : "text-gray-300"
                        }`}
                      >
                        +{entry.awardedPoints}P
                      </span>
                    </>
                  );

                  return entry.ritualRecordId ? (
                    <Link
                      key={entry.id}
                      href={`/feeds/${entry.ritualRecordId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {rankedMembers.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">
            아직 포인트 순위가 없습니다.
          </p>
        ) : (
          rankedMembers.map((member, index) => (
            <div
              key={member.userId}
              className={`flex items-center gap-3 p-4 ${
                index > 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0
                    ? "bg-yellow-100 text-yellow-600"
                    : index === 1
                      ? "bg-gray-100 text-gray-600"
                      : index === 2
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-50 text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <Avatar
                avatarUrl={member.avatarUrl}
                emoji={member.emoji}
                name={member.name}
              />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">
                {member.name}
              </p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-sm font-bold text-yellow-600">
                <Coins className="h-4 w-4" />
                {member.points.toLocaleString()}P
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function formatPointHistoryDate(createdAt: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(createdAt));
}

function DonationSummary({ amount }: { amount: number }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 mt-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-amber-600">전체 기부금</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {amount.toLocaleString()}원
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold text-amber-500 shadow-sm">
          ₩
        </div>
      </div>
      <p className="mt-3 text-xs text-amber-700">
        챌린저별 누적 기부금을 합산한 금액입니다
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
        <Image
          src={avatarUrl}
          alt={name}
          width={isLarge ? 56 : 40}
          height={isLarge ? 56 : 40}
          sizes={isLarge ? "56px" : "40px"}
          className="h-full w-full rounded-full object-cover"
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
      {member.happyChanceUsed && (
        <span
          className={`${textSize} font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-green-500`}
        >
          행복찬스
        </span>
      )}
      {member.penaltyAmount > 0 && (
        <span
          className={`${textSize} font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-400`}
        >
          기부금 {member.penaltyAmount.toLocaleString()}원
        </span>
      )}
    </>
  );
}

function MyProgressCard({ member }: { member: ChallengerProgress }) {
  const totalDays = member.totalDays;
  const progress =
    totalDays > 0 ? Math.round((member.totalAchieved / totalDays) * 100) : 0;

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

function MemberRow({ member }: { member: ChallengerProgress }) {
  const totalDays = member.totalDays;
  const progress =
    totalDays > 0 ? Math.round((member.totalAchieved / totalDays) * 100) : 0;

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
