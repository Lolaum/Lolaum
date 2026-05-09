"use server";

import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActivePeriod,
  getEffectiveStart,
  isChallengePeriodEnded,
} from "@/lib/current-challenge";
import { isAllRoutinesCovered } from "@/lib/declarations";

export interface ChallengerProgress {
  userId: string;
  name: string;
  avatarUrl: string | null;
  emoji: string | null;
  completedDays: number; // 인증 완료 횟수
  totalAchieved: number; // 달성 합계
  penaltyAmount: number; // 기부금 (원)
  happyChanceUsed: boolean; // 행복찬스 사용됨 (평일 1회 이상 미완료)
  hasDeclaration: boolean;
  hasMidReview: boolean;
  hasFinalReview: boolean;
}

export interface ProgressPageData {
  me: ChallengerProgress | null;
  challengers: ChallengerProgress[];
  totalDays: number; // 활성 기간 평일 수 + 3 보너스
}

const BONUS_SLOTS = 3; // 선언/중간회고/최종회고

/** 활성 기간 [start, end] 내 평일(월~금) 수 */
function countWeekdaysInRange(startDate: string, endDate: string): number {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 해당 날짜가 속한 주(월~일)의 월요일 날짜 문자열 */
function getWeekKey(d: Date): string {
  const dow = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return formatLocalDate(monday);
}

/**
 * 진행표 페이지용: 모든 챌린저의 진행률 데이터를 가져온다.
 *
 * 진행률 계산 규칙:
 * - 집계 범위: max(period.start_date, challenge.reset_at) ~ min(오늘, 기간 종료일)
 *   · reset_at 없음 → 기간 시작일부터 (늦게 등록해도 빠진 날 카운트)
 *   · reset_at 있음 → 그 날짜부터 (유저가 명시적으로 "다시 시작" 한 경우)
 * - 평일(월~금)에 등록한 모든 리추얼을 완료해야 1일 달성
 * - 주말 인증도 인증 완료 횟수로 즉시 반영
 * - 미완료 평일 최초 1회 → 행복찬스 (면제)
 * - 미완료 평일 2회째부터 → 기부금 1,000원씩 누적
 */
export async function getProgressPageData(): Promise<{
  data?: ProgressPageData;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    // 진행표는 모든 챌린저의 데이터를 보여주므로 admin 클라이언트 사용
    const admin = createAdminClient();

    const { period, error: periodError } = await getActivePeriod();
    if (!period) {
      return { error: periodError ?? "활성 챌린지 기간이 없습니다." };
    }

    const totalRoutineDays = countWeekdaysInRange(
      period.start_date,
      period.end_date,
    );
    const totalDaysWithBonus = totalRoutineDays + BONUS_SLOTS;

    if (isChallengePeriodEnded(period)) {
      return {
        data: { me: null, challengers: [], totalDays: totalDaysWithBonus },
      };
    }

    // 1. 활성 기간의 모든 챌린지 + 프로필
    const { data: challenges, error: cError } = await admin
      .from("challenges")
      .select(
        "id, user_id, reset_at, profiles!inner(id, name, avatar_url, emoji)",
      )
      .eq("period_id", period.id);

    if (cError) return { error: cError.message };
    if (!challenges || challenges.length === 0) {
      return {
        data: { me: null, challengers: [], totalDays: totalDaysWithBonus },
      };
    }

    type ChallengeRow = {
      id: string;
      user_id: string;
      reset_at: string | null;
      profiles: {
        id: string;
        name: string;
        avatar_url: string | null;
        emoji: string | null;
      };
    };

    const rows = challenges as unknown as ChallengeRow[];
    const challengeIds = rows.map((r) => r.id);

    // 2. daily_completions(완료 날짜) + 선언/회고를 한 번에 조회
    //    ritual_records 풀스캔 대신 daily_completions에서 완료 날짜만 가져와
    //    날짜별 완료 여부로 인증 횟수와 평일 미완료 횟수를 계산한다.
    const [regRes, dailyCompRes, declRes, midRevRes, finalRevRes] =
      await Promise.all([
        admin
          .from("challenge_registrations")
          .select("user_id, challenge_id, routine_type")
          .in("challenge_id", challengeIds),
        admin
          .from("daily_completions")
          .select("user_id, challenge_id, completion_date, is_fully_complete")
          .in("challenge_id", challengeIds)
          .gte("completion_date", period.start_date)
          .lte("completion_date", period.end_date),
        admin
          .from("declarations")
          .select("user_id, routine_type, challenge_id")
          .in("challenge_id", challengeIds),
        admin
          .from("mid_reviews")
          .select("user_id, challenge_id")
          .in("challenge_id", challengeIds),
        admin
          .from("final_reviews")
          .select("user_id, challenge_id")
          .in("challenge_id", challengeIds),
      ]);

    if (regRes.error) return { error: regRes.error.message };
    if (dailyCompRes.error) return { error: dailyCompRes.error.message };
    if (declRes.error) return { error: declRes.error.message };
    if (midRevRes.error) return { error: midRevRes.error.message };
    if (finalRevRes.error) return { error: finalRevRes.error.message };

    // 3. 유저별 등록 리추얼 타입 세트 (선언 보너스가 "등록한 모든 리추얼에 작성"인지 검사하려면 routine_type 필요)
    const userRegisteredTypes = new Map<string, Set<string>>();
    for (const r of regRes.data ?? []) {
      if (!userRegisteredTypes.has(r.user_id))
        userRegisteredTypes.set(r.user_id, new Set());
      userRegisteredTypes.get(r.user_id)!.add(r.routine_type);
    }
    const registeredUserIds = new Set(
      Array.from(userRegisteredTypes.entries())
        .filter(([, types]) => types.size > 0)
        .map(([userId]) => userId),
    );

    // 3-1. 유저별 선언 행 (routine_type 단위) — isAllRoutinesCovered가 행 배열을 받음
    const userDeclarationRows = new Map<string, { routine_type: string }[]>();
    for (const r of declRes.data ?? []) {
      if (!userDeclarationRows.has(r.user_id))
        userDeclarationRows.set(r.user_id, []);
      userDeclarationRows.get(r.user_id)!.push({ routine_type: r.routine_type });
    }
    const userMidReviewed = new Set<string>();
    for (const r of midRevRes.data ?? []) {
      userMidReviewed.add(r.user_id);
    }
    const userFinalReviewed = new Set<string>();
    for (const r of finalRevRes.data ?? []) {
      userFinalReviewed.add(r.user_id);
    }

    // 4. 유저별 날짜별 완전 달성 여부 세트 (is_fully_complete 기반)
    //    user_id → challenge_id별 완전 달성 날짜 Set
    const userFullyCompleteDates = new Map<string, Set<string>>();
    for (const r of dailyCompRes.data ?? []) {
      if (r.is_fully_complete) {
        if (!userFullyCompleteDates.has(r.user_id))
          userFullyCompleteDates.set(r.user_id, new Set());
        userFullyCompleteDates.get(r.user_id)!.add(r.completion_date);
      }
    }

    // 5. 집계 범위 끝 = min(오늘, period.end_date)
    //    rangeStart 는 유저별 reset_at 여부에 따라 달라지므로 6번 루프에서 결정.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const periodEnd = parseLocalDate(period.end_date);
    const rangeEnd = today < periodEnd ? today : periodEnd;

    // 6. 유저별 진행률 계산
    const allChallengers: ChallengerProgress[] = rows.map((r) => {
      const registeredTypes =
        userRegisteredTypes.get(r.user_id) ?? new Set<string>();

      // 리추얼 등록이 없으면 미완료/벌금 없음
      if (registeredTypes.size === 0) {
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

      // 유저의 완전 달성 날짜 세트 (daily_completions.is_fully_complete=true)
      const fullyCompleteDates =
        userFullyCompleteDates.get(r.user_id) ?? new Set<string>();

      // 유저별 집계 시작일: reset_at 이 있으면 그 날짜, 없으면 period.start_date
      const rangeStart = parseLocalDate(
        getEffectiveStart(period.start_date, r.reset_at),
      );

      // 주(월~일) 단위로 날짜 묶기
      const weekData = new Map<
        string,
        { weekdays: string[]; weekends: string[] }
      >();
      if (rangeEnd >= rangeStart) {
        const cur = new Date(rangeStart);
        while (cur <= rangeEnd) {
          const dateStr = formatLocalDate(cur);
          const dow = cur.getDay();
          const wk = getWeekKey(cur);
          if (!weekData.has(wk)) {
            weekData.set(wk, { weekdays: [], weekends: [] });
          }
          if (dow === 0 || dow === 6) {
            weekData.get(wk)!.weekends.push(dateStr);
          } else {
            weekData.get(wk)!.weekdays.push(dateStr);
          }
          cur.setDate(cur.getDate() + 1);
        }
      }

      // 주 단위로 완료/미완료 집계
      // daily_completions.is_fully_complete 기반: 그날 등록된 모든 리추얼 완료 = 완전 달성
      // 인증 횟수는 주말/오늘 인증도 즉시 +1로 집계한다.
      let weekdayMissed = 0;
      const fullyCompleteCount = Array.from(fullyCompleteDates).filter(
        (date) =>
          parseLocalDate(date) >= rangeStart && parseLocalDate(date) <= rangeEnd,
      ).length;

      for (const { weekdays } of weekData.values()) {
        for (const wd of weekdays) {
          if (!fullyCompleteDates.has(wd)) {
            weekdayMissed++;
          }
        }
      }

      // 진행률: 실제 인증 완료 횟수. 주말 인증도 횟수로는 즉시 반영한다.
      const completedDays = fullyCompleteCount;

      // 선언 보너스: 등록한 모든 리추얼에 대해 작성해야 +1 (ritual-stats.ts와 동일 로직 재사용)
      const hasDeclaration = isAllRoutinesCovered(
        registeredTypes,
        userDeclarationRows.get(r.user_id),
      );
      // 중간 회고 보너스: 유저당 1개라도 작성했으면 +1
      const hasMidReview = userMidReviewed.has(r.user_id);
      // 최종 회고 보너스: 유저당 1개라도 작성했으면 +1
      const hasFinalReview = userFinalReviewed.has(r.user_id);

      const totalAchieved =
        completedDays +
        (hasDeclaration ? 1 : 0) +
        (hasMidReview ? 1 : 0) +
        (hasFinalReview ? 1 : 0);

      // 기부금 계산:
      // - 미완료 평일의 1회차는 행복찬스로 면제
      // - 2회차부터 1,000원씩
      const happyChanceUsed = weekdayMissed >= 1;
      const penaltyAmount = Math.max(0, weekdayMissed - 1) * 1000;

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
      .filter((c) => c.userId !== user.id && registeredUserIds.has(c.userId))
      .sort((a, b) => b.totalAchieved - a.totalAchieved);

    return {
      data: { me, challengers, totalDays: totalDaysWithBonus },
    };
  } catch (e) {
    console.error("getProgressPageData error:", e);
    return { error: "진행표 조회 중 오류가 발생했습니다." };
  }
}
