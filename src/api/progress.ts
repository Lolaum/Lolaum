"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ChallengerProgress {
  userId: string;
  name: string;
  avatarUrl: string | null;
  emoji: string | null;
  completedDays: number; // 평일 완료 + 주말 보충 일수 (최대 15)
  totalAchieved: number; // 달성 합계 (최대 18: 15일 + 선언/중간회고/최종회고)
  penaltyAmount: number; // 기부금 (원)
  happyChanceUsed: boolean; // 행복찬스 사용됨 (평일 1회 이상 미완료)
  hasDeclaration: boolean;
  hasMidReview: boolean;
  hasFinalReview: boolean;
}

export interface ProgressPageData {
  me: ChallengerProgress | null;
  challengers: ChallengerProgress[];
  totalDays: number; // 18 (15일 + 3 보너스)
}

const TOTAL_ROUTINE_DAYS = 15;
const TOTAL_DAYS = 18; // 15일(루틴) + 3(선언/중간회고/최종회고)

/**
 * 이번 달 1일부터 오늘까지의 평일(월~금) 날짜 목록
 */
function getPastWeekdayDates(year: number, month: number): Set<string> {
  const today = new Date();
  const dates = new Set<string>();
  const d = new Date(year, month - 1, 1);

  while (d <= today && d.getMonth() === month - 1) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) {
      dates.add(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/**
 * 이번 달 1일부터 오늘까지의 주말(토, 일) 날짜 목록
 */
function getPastWeekendDates(year: number, month: number): Set<string> {
  const today = new Date();
  const dates = new Set<string>();
  const d = new Date(year, month - 1, 1);

  while (d <= today && d.getMonth() === month - 1) {
    const day = d.getDay();
    if (day === 0 || day === 6) {
      dates.add(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/**
 * 진행표 페이지용: 모든 챌린저의 진행률 데이터를 가져온다.
 *
 * 진행률 계산 규칙:
 * - 평일(월~금)에 등록한 모든 리추얼을 완료해야 1일 달성
 * - 평일 미완료 최초 1회 → 행복찬스 (면제)
 * - 평일 미완료 2회째부터 → 기부금 1,000원씩 누적
 * - 주말에 모든 리추얼 보충 시 → 진행률 +1일, 기부금 -1,000원
 */
export async function getProgressPageData(): Promise<{
  data?: ProgressPageData;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  // 진행표는 모든 챌린저의 데이터를 보여주므로 admin 클라이언트 사용
  const admin = createAdminClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 1. 이번 달 모든 챌린지 + 프로필
  const { data: challenges, error: cError } = await admin
    .from("challenges")
    .select("id, user_id, profiles!inner(id, name, avatar_url, emoji)")
    .eq("year", year)
    .eq("month", month);

  if (cError) return { error: cError.message };
  if (!challenges || challenges.length === 0) {
    return { data: { me: null, challengers: [], totalDays: TOTAL_DAYS } };
  }

  type ChallengeRow = {
    id: string;
    user_id: string;
    profiles: {
      id: string;
      name: string;
      avatar_url: string | null;
      emoji: string | null;
    };
  };

  const rows = challenges as unknown as ChallengeRow[];
  const challengeIds = rows.map((r) => r.id);
  // user_id → challenge_id 매핑
  const userChallengeMap = new Map(rows.map((r) => [r.user_id, r.id]));

  // 2. 등록 루틴 + 기록 + 선언/회고를 한 번에 조회
  const [regRes, recRes, declRes, midRevRes] = await Promise.all([
    admin
      .from("challenge_registrations")
      .select("user_id, routine_type, challenge_id")
      .in("challenge_id", challengeIds),
    admin
      .from("ritual_records")
      .select("user_id, routine_type, record_date, challenge_id")
      .in("challenge_id", challengeIds),
    admin
      .from("declarations")
      .select("user_id, routine_type, challenge_id")
      .in("challenge_id", challengeIds),
    admin
      .from("mid_reviews")
      .select("user_id, routine_type, challenge_id")
      .in("challenge_id", challengeIds),
  ]);

  if (regRes.error) return { error: regRes.error.message };
  if (recRes.error) return { error: recRes.error.message };

  // 3. 유저별 등록 루틴 세트
  const userRegistrations = new Map<string, Set<string>>();
  for (const r of regRes.data ?? []) {
    if (!userRegistrations.has(r.user_id)) {
      userRegistrations.set(r.user_id, new Set());
    }
    userRegistrations.get(r.user_id)!.add(r.routine_type);
  }

  // 3-1. 유저별 선언/회고 루틴 세트
  const userDeclarations = new Map<string, Set<string>>();
  for (const r of declRes.data ?? []) {
    if (!userDeclarations.has(r.user_id)) userDeclarations.set(r.user_id, new Set());
    userDeclarations.get(r.user_id)!.add(r.routine_type);
  }
  const userMidReviews = new Map<string, Set<string>>();
  for (const r of midRevRes.data ?? []) {
    if (!userMidReviews.has(r.user_id)) userMidReviews.set(r.user_id, new Set());
    userMidReviews.get(r.user_id)!.add(r.routine_type);
  }

  // 4. 유저별 날짜별 완료 루틴 세트
  const userDateRecords = new Map<string, Map<string, Set<string>>>();
  for (const r of recRes.data ?? []) {
    if (!userDateRecords.has(r.user_id)) {
      userDateRecords.set(r.user_id, new Map());
    }
    const dateMap = userDateRecords.get(r.user_id)!;
    if (!dateMap.has(r.record_date)) {
      dateMap.set(r.record_date, new Set());
    }
    dateMap.get(r.record_date)!.add(r.routine_type);
  }

  // 5. 평일/주말 날짜 세트
  const pastWeekdays = getPastWeekdayDates(year, month);
  const pastWeekends = getPastWeekendDates(year, month);

  // 6. 유저별 진행률 계산
  const allChallengers: ChallengerProgress[] = rows.map((r) => {
    const registered = userRegistrations.get(r.user_id);
    // 루틴 등록이 없으면 미완료/벌금 없음
    if (!registered || registered.size === 0) {
      return {
        userId: r.user_id,
        name: r.profiles.name,
        avatarUrl: r.profiles.avatar_url,
        emoji: r.profiles.emoji,
        completedDays: 0,
        totalAchieved: 0,
        penaltyAmount: 0,
        happyChanceUsed: false,
        hasDeclaration: false,
        hasMidReview: false,
        hasFinalReview: false,
      };
    }

    const dateMap = userDateRecords.get(r.user_id) ?? new Map();

    // 날짜의 모든 루틴 완료 여부 판별
    const isFullyComplete = (date: string): boolean => {
      const done = dateMap.get(date);
      if (!done) return false;
      for (const rt of registered) {
        if (!done.has(rt)) return false;
      }
      return true;
    };

    // 평일 완료/미완료 집계
    let weekdayComplete = 0;
    let weekdayMissed = 0;
    for (const wd of pastWeekdays) {
      if (isFullyComplete(wd)) {
        weekdayComplete++;
      } else {
        weekdayMissed++;
      }
    }

    // 주말 보충 집계
    let weekendMakeup = 0;
    for (const we of pastWeekends) {
      if (isFullyComplete(we)) {
        weekendMakeup++;
      }
    }

    // 진행률: 평일 완료 + 주말 보충 (최대 15)
    const completedDays = Math.min(weekdayComplete + weekendMakeup, TOTAL_ROUTINE_DAYS);

    // 선언/회고 보너스 (등록한 모든 루틴에 대해 작성해야 +1)
    const declSet = userDeclarations.get(r.user_id);
    const hasDeclaration = !!declSet && [...registered].every((rt) => declSet.has(rt));
    const midRevSet = userMidReviews.get(r.user_id);
    const hasMidReview = !!midRevSet && [...registered].every((rt) => midRevSet.has(rt));
    const hasFinalReview = false; // TODO: 최종회고 테이블 연동

    const totalAchieved =
      completedDays +
      (hasDeclaration ? 1 : 0) +
      (hasMidReview ? 1 : 0) +
      (hasFinalReview ? 1 : 0);

    // 기부금 계산:
    // 평일 미완료 최초 1회 = 행복찬스 (면제)
    // 나머지 미완료 = 기부금 1,000원씩
    // 주말 보충 = 기부금 -1,000원씩
    const happyChanceUsed = weekdayMissed >= 1;
    const missesAfterHappyChance = Math.max(0, weekdayMissed - 1);
    const penaltyAmount = Math.max(
      0,
      (missesAfterHappyChance - weekendMakeup) * 1000,
    );

    return {
      userId: r.user_id,
      name: r.profiles.name,
      avatarUrl: r.profiles.avatar_url,
      emoji: r.profiles.emoji,
      completedDays,
      totalAchieved,
      penaltyAmount,
      happyChanceUsed,
      hasDeclaration,
      hasMidReview,
      hasFinalReview,
    };
  });

  // 나와 나머지 분리 (달성 합계 내림차순)
  const me = allChallengers.find((c) => c.userId === user.id) ?? null;
  const challengers = allChallengers
    .filter((c) => c.userId !== user.id)
    .sort((a, b) => b.totalAchieved - a.totalAchieved);

  return {
    data: { me, challengers, totalDays: TOTAL_DAYS },
  };
}
