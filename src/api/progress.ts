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
const TOTAL_DAYS = 18; // 15일(리추얼) + 3(선언/중간회고/최종회고)

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
 * - 집계 범위: 챌린지 start_date ~ 어제 (오늘 제외)
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

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // 1. 이번 달 모든 챌린지 + 프로필
    const { data: challenges, error: cError } = await admin
      .from("challenges")
      .select(
        "id, user_id, start_date, profiles!inner(id, name, avatar_url, emoji)",
      )
      .eq("year", year)
      .eq("month", month);

    if (cError) return { error: cError.message };
    if (!challenges || challenges.length === 0) {
      return { data: { me: null, challengers: [], totalDays: TOTAL_DAYS } };
    }

    type ChallengeRow = {
      id: string;
      user_id: string;
      start_date: string;
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
        .select("user_id, routine_type, challenge_id, registered_at")
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

    // 3. 유저별 등록 리추얼 세트 + 최초 등록일
    const userRegistrations = new Map<string, Set<string>>();
    const userFirstRegDate = new Map<string, string>(); // challenge_id:user_id → "YYYY-MM-DD"
    for (const r of regRes.data ?? []) {
      if (!userRegistrations.has(r.user_id)) {
        userRegistrations.set(r.user_id, new Set());
      }
      userRegistrations.get(r.user_id)!.add(r.routine_type);

      const key = `${r.challenge_id}:${r.user_id}`;
      const regDate = r.registered_at.split("T")[0];
      const prev = userFirstRegDate.get(key);
      if (!prev || regDate < prev) userFirstRegDate.set(key, regDate);
    }

    // 3-2. 챌린지 start_date 백필: 현재 값이 최초 등록일보다 이르면 교정
    const backfillTasks: Promise<unknown>[] = [];
    for (const r of rows) {
      const firstReg = userFirstRegDate.get(`${r.id}:${r.user_id}`);
      if (firstReg && r.start_date < firstReg) {
        r.start_date = firstReg; // 이번 계산에도 반영
        backfillTasks.push(
          (async () => {
            await admin
              .from("challenges")
              .update({ start_date: firstReg })
              .eq("id", r.id);
          })(),
        );
      }
    }
    if (backfillTasks.length > 0) {
      await Promise.allSettled(backfillTasks);
    }

    // 3-1. 유저별 선언/회고 리추얼 세트
    const userDeclarations = new Map<string, Set<string>>();
    for (const r of declRes.data ?? []) {
      if (!userDeclarations.has(r.user_id))
        userDeclarations.set(r.user_id, new Set());
      userDeclarations.get(r.user_id)!.add(r.routine_type);
    }
    const userMidReviews = new Map<string, Set<string>>();
    for (const r of midRevRes.data ?? []) {
      if (!userMidReviews.has(r.user_id))
        userMidReviews.set(r.user_id, new Set());
      userMidReviews.get(r.user_id)!.add(r.routine_type);
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

    // 5. 집계 범위 끝 = 어제
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() - 1);

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

      // 집계 범위: 챌린지 start_date ~ 어제
      const rangeStart = parseLocalDate(r.start_date);

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

      // 진행률: 평일 완료 + 주말 보충으로 채운 평일 (최대 15)
      const completedDays = Math.min(
        weekdayComplete + weekdayMadeUp,
        TOTAL_ROUTINE_DAYS,
      );

      // 선언/회고 보너스 (등록한 모든 리추얼에 대해 작성해야 +1)
      const declSet = userDeclarations.get(r.user_id);
      const hasDeclaration =
        !!declSet && [...registered].every((rt) => declSet.has(rt));
      const midRevSet = userMidReviews.get(r.user_id);
      const hasMidReview =
        !!midRevSet && [...registered].every((rt) => midRevSet.has(rt));
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
      data: { me, challengers, totalDays: TOTAL_DAYS },
    };
  } catch (e) {
    console.error("getProgressPageData error:", e);
    return { error: "진행표 조회 중 오류가 발생했습니다." };
  }
}
