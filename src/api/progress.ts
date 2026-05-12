"use server";

import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActivePeriod,
  getEffectiveStart,
  isChallengePeriodEnded,
} from "@/lib/current-challenge";
import { isAllRoutinesCovered } from "@/lib/declarations";
import {
  addDaysToDateKey,
  countWeekdaysInDateKeyRange,
  formatKoreaDateKey,
  getDateKeyDayOfWeek,
  getKoreaTodayWithinRange,
} from "@/lib/korea-date";

export interface ChallengerProgress {
  userId: string;
  name: string;
  avatarUrl: string | null;
  emoji: string | null;
  completedDays: number; // 인증 완료 횟수
  totalAchieved: number; // 달성 합계
  totalDays: number; // 유저별 만점 일수 (effectiveStart 기준 평일 수 + 3 보너스)
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

/** 해당 날짜가 속한 주(월~일)의 월요일 날짜 문자열 */
function getWeekKey(dateKey: string): string {
  const dow = getDateKeyDayOfWeek(dateKey); // 0=일, 1=월, ..., 6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDaysToDateKey(dateKey, diff);
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

    const periodTotalRoutineDays = countWeekdaysInDateKeyRange(
      period.start_date,
      period.end_date,
    );
    const periodTotalDaysWithBonus = periodTotalRoutineDays + BONUS_SLOTS;

    if (isChallengePeriodEnded(period)) {
      return {
        data: {
          me: null,
          challengers: [],
          totalDays: periodTotalDaysWithBonus,
        },
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
        data: {
          me: null,
          challengers: [],
          totalDays: periodTotalDaysWithBonus,
        },
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

    // 2. 리추얼 기록 + 선언/회고를 한 번에 조회
    //    홈 달성률과 같은 기준으로 실제 ritual_records에서 날짜별 완료 여부를 계산한다.
    const [regRes, recordsRes, declRes, midRevRes, finalRevRes] =
      await Promise.all([
        admin
          .from("challenge_registrations")
          .select("user_id, challenge_id, routine_type")
          .in("challenge_id", challengeIds),
        admin
          .from("ritual_records")
          .select("user_id, challenge_id, routine_type, record_date")
          .in("challenge_id", challengeIds)
          .gte("record_date", period.start_date)
          .lte("record_date", period.end_date),
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
    if (recordsRes.error) return { error: recordsRes.error.message };
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
      userDeclarationRows
        .get(r.user_id)!
        .push({ routine_type: r.routine_type });
    }
    const userMidReviewed = new Set<string>();
    for (const r of midRevRes.data ?? []) {
      userMidReviewed.add(r.user_id);
    }
    const userFinalReviewed = new Set<string>();
    for (const r of finalRevRes.data ?? []) {
      userFinalReviewed.add(r.user_id);
    }

    // 4. 유저별 날짜별 완전 달성 여부 세트
    //    홈과 동일하게 같은 날짜에 등록된 모든 리추얼 타입이 기록됐는지 직접 계산한다.
    const userRecordTypesByDate = new Map<string, Map<string, Set<string>>>();
    for (const r of recordsRes.data ?? []) {
      if (!userRecordTypesByDate.has(r.user_id)) {
        userRecordTypesByDate.set(r.user_id, new Map());
      }
      const dateMap = userRecordTypesByDate.get(r.user_id)!;
      if (!dateMap.has(r.record_date)) {
        dateMap.set(r.record_date, new Set());
      }
      dateMap.get(r.record_date)!.add(r.routine_type);
    }

    const userFullyCompleteDates = new Map<string, Set<string>>();
    for (const [userId, dateMap] of userRecordTypesByDate) {
      const registeredTypes =
        userRegisteredTypes.get(userId) ?? new Set<string>();
      if (registeredTypes.size === 0) continue;

      for (const [recordDate, completedTypes] of dateMap) {
        const isFullyComplete = Array.from(registeredTypes).every(
          (routineType) => completedTypes.has(routineType),
        );
        if (!isFullyComplete) continue;

        if (!userFullyCompleteDates.has(userId)) {
          userFullyCompleteDates.set(userId, new Set());
        }
        userFullyCompleteDates.get(userId)!.add(recordDate);
      }
    }

    // 5. 집계 범위 끝 = min(오늘, period.end_date)
    //    rangeStart 는 유저별 reset_at 여부에 따라 달라지므로 6번 루프에서 결정.
    const todayStr = formatKoreaDateKey();
    const rangeEnd = getKoreaTodayWithinRange(period.end_date);

    // 6. 유저별 진행률 계산
    const allChallengers: ChallengerProgress[] = rows.map((r) => {
      const registeredTypes =
        userRegisteredTypes.get(r.user_id) ?? new Set<string>();

      // 유저별 집계 시작일: reset_at 이 있으면 그 날짜, 없으면 period.start_date
      const effectiveStart = getEffectiveStart(period.start_date, r.reset_at);
      const rangeStart = effectiveStart;
      const totalDays =
        countWeekdaysInDateKeyRange(effectiveStart, period.end_date) +
        BONUS_SLOTS;

      // 리추얼 등록이 없으면 미완료/벌금 없음
      if (registeredTypes.size === 0) {
        return {
          userId: r.user_id,
          name: r.profiles.name,
          avatarUrl: r.profiles.avatar_url,
          emoji: r.profiles.emoji,
          completedDays: 0,
          totalAchieved: 0,
          totalDays,
          penaltyAmount: 0,
          happyChanceUsed: false,
          hasDeclaration: false,
          hasMidReview: false,
          hasFinalReview: false,
        };
      }

      // 유저의 완전 달성 날짜 세트
      const fullyCompleteDates =
        userFullyCompleteDates.get(r.user_id) ?? new Set<string>();

      // 주(월~일) 단위로 날짜 묶기
      const weekData = new Map<
        string,
        { weekdays: string[]; weekends: string[] }
      >();
      if (rangeEnd >= rangeStart) {
        for (
          let dateStr = rangeStart;
          dateStr <= rangeEnd;
          dateStr = addDaysToDateKey(dateStr, 1)
        ) {
          const dow = getDateKeyDayOfWeek(dateStr);
          const wk = getWeekKey(dateStr);
          if (!weekData.has(wk)) {
            weekData.set(wk, { weekdays: [], weekends: [] });
          }
          if (dow === 0 || dow === 6) {
            weekData.get(wk)!.weekends.push(dateStr);
          } else {
            weekData.get(wk)!.weekdays.push(dateStr);
          }
        }
      }

      // 주 단위로 완료/미완료 집계
      // 그날 등록된 모든 리추얼 완료 = 완전 달성
      // 인증 횟수는 주말/오늘 인증도 즉시 +1로 집계한다.
      let weekdayMissed = 0;
      const fullyCompleteCount = Array.from(fullyCompleteDates).filter(
        (date) => date >= rangeStart && date <= rangeEnd,
      ).length;

      for (const { weekdays } of weekData.values()) {
        for (const wd of weekdays) {
          if (wd < todayStr && !fullyCompleteDates.has(wd)) {
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
        totalDays,
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
      data: { me, challengers, totalDays: periodTotalDaysWithBonus },
    };
  } catch (e) {
    console.error("getProgressPageData error:", e);
    return { error: "진행표 조회 중 오류가 발생했습니다." };
  }
}
