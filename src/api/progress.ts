"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivePeriod, getEffectiveStart } from "@/lib/current-challenge";

export interface ChallengerProgress {
  userId: string;
  name: string;
  avatarUrl: string | null;
  emoji: string | null;
  completedDays: number; // 평일 완료 + 주말 보충 일수 (최대 = 활성 기간의 평일 수)
  totalAchieved: number; // 달성 합계 (최대 = 평일 수 + 3 보너스)
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
 * - 집계 범위: max(period.start_date, challenge.reset_at) ~ min(어제, 기간 종료일)
 *   · reset_at 없음 → 기간 시작일부터 (늦게 등록해도 빠진 날 카운트)
 *   · reset_at 있음 → 그 날짜부터 (유저가 명시적으로 "다시 시작" 한 경우)
 * - 평일(월~금)에 등록한 모든 리추얼을 완료해야 1일 달성
 * - 평일에 못한 리추얼을 "같은 주(월~일)의 주말"에 수행하면 그 평일은 보충 완료로 인정
 * - 보충되지 않은 미완료 평일 최초 1회 → 행복찬스 (면제)
 * - 보충되지 않은 미완료 평일 2회째부터 → 기부금 1,000원씩 누적
 * - 모든 미완료가 주말로 보충되면 행복찬스도 소모되지 않음
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

    // 2. 등록 리추얼 + 기록 + 선언/회고를 한 번에 조회
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
        .select("user_id, challenge_id")
        .in("challenge_id", challengeIds),
    ]);

    if (regRes.error) return { error: regRes.error.message };
    if (recRes.error) return { error: recRes.error.message };

    // 3. 유저별 등록 리추얼 세트
    const userRegistrations = new Map<string, Set<string>>();
    for (const r of regRes.data ?? []) {
      if (!userRegistrations.has(r.user_id)) {
        userRegistrations.set(r.user_id, new Set());
      }
      userRegistrations.get(r.user_id)!.add(r.routine_type);
    }

    // 3-1. 유저별 선언/회고 리추얼 세트
    const userDeclarations = new Map<string, Set<string>>();
    for (const r of declRes.data ?? []) {
      if (!userDeclarations.has(r.user_id))
        userDeclarations.set(r.user_id, new Set());
      userDeclarations.get(r.user_id)!.add(r.routine_type);
    }
    const userMidReviewed = new Set<string>();
    for (const r of midRevRes.data ?? []) {
      userMidReviewed.add(r.user_id);
    }

    // 4. 유저별 날짜별 완료 리추얼 세트
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

    // 5. 집계 범위 끝 = min(어제, period.end_date)
    //    rangeStart 는 유저별 reset_at 여부에 따라 달라지므로 6번 루프에서 결정.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const periodEnd = parseLocalDate(period.end_date);
    const rangeEnd = yesterday < periodEnd ? yesterday : periodEnd;

    // 6. 유저별 진행률 계산
    const allChallengers: ChallengerProgress[] = rows.map((r) => {
      const registered = userRegistrations.get(r.user_id);
      // 리추얼 등록이 없으면 미완료/벌금 없음
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

      // 주 단위로 완료/보충/미완료 집계
      let weekdayComplete = 0;
      let weekdayMadeUp = 0;
      let weekdayMissed = 0;

      for (const { weekdays, weekends } of weekData.values()) {
        // 이 주의 주말에 수행된 리추얼들 합집합
        const weekendRoutines = new Set<string>();
        for (const we of weekends) {
          const done = dateMap.get(we);
          if (done) {
            for (const rt of done) weekendRoutines.add(rt);
          }
        }

        for (const wd of weekdays) {
          const done: Set<string> = dateMap.get(wd) ?? new Set();
          let missingAllCoveredByWeekend = true;
          let hasMissing = false;
          for (const rt of registered) {
            if (!done.has(rt)) {
              hasMissing = true;
              if (!weekendRoutines.has(rt)) {
                missingAllCoveredByWeekend = false;
              }
            }
          }
          if (!hasMissing) {
            weekdayComplete++;
          } else if (missingAllCoveredByWeekend) {
            weekdayMadeUp++;
          } else {
            weekdayMissed++;
          }
        }
      }

      // 진행률: 평일 완료 + 주말 보충으로 채운 평일 (최대 = 기간 내 평일 수)
      const completedDays = Math.min(
        weekdayComplete + weekdayMadeUp,
        totalRoutineDays,
      );

      // 선언 보너스: 등록한 모든 리추얼에 대해 작성해야 +1
      const declSet = userDeclarations.get(r.user_id);
      const hasDeclaration =
        !!declSet && [...registered].every((rt) => declSet.has(rt));
      // 중간 회고 보너스: 유저당 1개라도 작성했으면 +1
      const hasMidReview = userMidReviewed.has(r.user_id);
      const hasFinalReview = false; // TODO: 최종회고 테이블 연동

      const totalAchieved =
        completedDays +
        (hasDeclaration ? 1 : 0) +
        (hasMidReview ? 1 : 0) +
        (hasFinalReview ? 1 : 0);

      // 기부금 계산:
      // - 보충되지 않은 미완료 평일의 1회차는 행복찬스로 면제
      // - 2회차부터 1,000원씩
      // - 모두 보충되면 행복찬스도 소모되지 않음
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
      .filter((c) => c.userId !== user.id)
      .sort((a, b) => b.totalAchieved - a.totalAchieved);

    return {
      data: { me, challengers, totalDays: totalDaysWithBonus },
    };
  } catch (e) {
    console.error("getProgressPageData error:", e);
    return { error: "진행표 조회 중 오류가 발생했습니다." };
  }
}
