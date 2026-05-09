"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentChallengeId,
  getActivePeriod,
  getEffectiveStart,
  isChallengePeriodEnded,
} from "@/lib/current-challenge";
import type {
  ChallengeRegistration,
  Profile,
  RoutineTypeDB,
  ExerciseRecordData,
  MorningRecordData,
  LanguageRecordData,
  FinanceRecordData,
} from "@/types/supabase";
import type { ChallengerSummary } from "@/api/user";
import { isAllRoutinesCovered } from "@/lib/declarations";
import { getProfileRitualStart } from "@/lib/profile-ritual-start";

// ── 타입 ──────────────────────────────────────────────

export interface RitualOverallStats {
  totalRecords: number;
  currentStreak: number;
  completionRate: number;
}

export interface MyPageStats {
  currentStreak: number; // 연속 실천 (하루에 리추얼 1개라도 완료한 연속 일수)
  longestStreak: number; // 최장 기록 (가장 긴 연속 실천 기간)
  totalCompletions: number; // 총 완료 (리추얼 완료 수 합산)
}

export interface CompletionRateStats {
  rate: number; // 달성률 (%)
  completedDays: number; // 리추얼 완전 달성 일수 (최대 = 기간 내 평일 수)
  hasDeclaration: boolean; // 리추얼 선언 작성 여부
  hasMidReview: boolean; // 중간회고 작성 여부
  hasFinalReview: boolean; // 최종회고 작성 여부
  totalAchieved: number; // 달성 합계
  totalDays: number; // 만점 일수 (평일 수 + 3 보너스)
}

export interface RoutineCardStats {
  id: string;
  name: string;
  routineType: RoutineTypeDB;
  color: string;
  bgColor: string;
  totalDays: number;
  streak: number;
  weekActivity: boolean[];
}

export interface ExerciseInsight {
  totalMinutes: number;
  totalSessions: number;
  avgMinutes: number;
  exercises: { name: string; count: number; totalMinutes: number }[];
}

export interface MorningInsight {
  avgCondition: number;
  avgSleepHours: string;
  sleepTrend: { date: string; value: number }[];
}

export interface LanguageInsight {
  totalExpressions: number;
  totalDays: number;
  recentExpressions: { word: string; meaning: string }[];
}

export interface FinanceInsight {
  currentMonth: {
    total: number;
    necessary: number;
    emotional: number;
    value: number;
    categories: {
      name: string;
      amount: number;
      color: string;
      percent: number;
    }[];
  };
  weeklySpending: { week: string; amount: number }[];
}

export interface HomeProfile
  extends Pick<Profile, "id" | "username" | "name" | "avatar_url"> {
  ritual_start_year: number | null;
  ritual_start_month: number | null;
}

// ── 리추얼 설정 ──────────────────────────────────────────

const ROUTINE_CONFIG: Record<
  string,
  { name: string; color: string; bgColor: string }
> = {
  reading: { name: "독서", color: "#6366f1", bgColor: "#eef2ff" },
  exercise: { name: "운동", color: "#ff8900", bgColor: "#fff4e5" },
  morning: { name: "모닝", color: "#eab32e", bgColor: "#fefce8" },
  english: { name: "영어", color: "#0ea5e9", bgColor: "#f0f9ff" },
  second_language: { name: "제2외국어", color: "#8b5cf6", bgColor: "#f5f3ff" },
  recording: { name: "기록", color: "#8b5cf6", bgColor: "#f5f3ff" },
  finance: { name: "자산관리", color: "#10b981", bgColor: "#ecfdf5" },
  english_book: { name: "원서읽기", color: "#ec4899", bgColor: "#fdf2f8" },
};

// ── 유틸 ──────────────────────────────────────────────

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

/** 활성 기간 [start, end] 내 모든 평일(월~금) 수 (기간 만점 산정용) */
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

function getEmptyCompletion(totalDays: number): CompletionRateStats {
  return {
    rate: 0,
    completedDays: 0,
    hasDeclaration: false,
    hasMidReview: false,
    hasFinalReview: false,
    totalAchieved: 0,
    totalDays,
  };
}

function getEmptyMyPageStats(): MyPageStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
  };
}

function getEmptyOverallStats(): RitualOverallStats {
  return {
    totalRecords: 0,
    currentStreak: 0,
    completionRate: 0,
  };
}

function getAccountingUpperDate(endDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periodEnd = parseLocalDate(endDate);
  return formatLocalDate(today < periodEnd ? today : periodEnd);
}

function calcCompletionAccounting(
  dateMap: Map<string, Set<string>>,
  registeredTypes: Set<string>,
  periodStart: string,
  periodEnd: string,
): { completedDays: number } {
  const upperDate = getAccountingUpperDate(periodEnd);
  const isFullyComplete = (date: string): boolean => {
    const done = dateMap.get(date);
    if (!done) return false;
    for (const rt of registeredTypes) {
      if (!done.has(rt)) return false;
    }
    return true;
  };

  const completedDays = Array.from(dateMap.keys()).filter(
    (date) => date >= periodStart && date <= upperDate && isFullyComplete(date),
  ).length;
  return { completedDays };
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a)); // 최신순
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  const checkDate = new Date(today);

  // 오늘 기록이 없으면 어제부터 체크
  if (sorted[0] !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const date of sorted) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (date === checkStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (date < checkStr) {
      break;
    }
  }
  return streak;
}

function calcLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

function getWeekActivity(dates: string[]): boolean[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const activity: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().split("T")[0];
    activity.push(dates.includes(dateStr));
  }
  return activity;
}

// ── API: Ritual 페이지 통합 데이터 ─────────────────────
// RitualContainer가 항상 함께 사용하는 overall + routines + completion을
// 단일 server action으로 묶어 클라이언트→서버 왕복을 줄인다.

export async function getRitualPageData(): Promise<{
  overall?: RitualOverallStats;
  routines?: RoutineCardStats[];
  completion?: CompletionRateStats;
  totalRoutineDays?: number; // 활성 기간 내 평일(월~금) 수
  error?: string;
}> {
  const [
    { challengeId, resetAt, error: cError },
    user,
    { period, error: pError },
  ] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
    getActivePeriod(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!period) return { error: pError ?? "활성 챌린지 기간이 없습니다." };

  const effectiveStart = getEffectiveStart(period.start_date, resetAt);
  const totalRoutineDays = countWeekdaysInRange(
    effectiveStart,
    period.end_date,
  );
  const totalDays = totalRoutineDays + 3;

  if (isChallengePeriodEnded(period)) {
    return {
      overall: getEmptyOverallStats(),
      routines: [],
      completion: getEmptyCompletion(totalDays),
      totalRoutineDays,
    };
  }

  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  // 4개 쿼리를 한 번에 병렬 실행
  // daily_completions로 fullyCompleteDays/streak 계산, ritual_records는 routines 카드용으로만 사용
  const [
    dailyRes,
    recordsCountRes,
    routineRecordsRes,
    registrationsRes,
    declarationsRes,
    midReviewsRes,
    finalReviewsRes,
  ] =
    await Promise.all([
      // 완전 달성일 목록 (fullyCompleteDays, streak 계산용)
      supabase
        .from("daily_completions")
        .select("completion_date")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .eq("is_fully_complete", true)
        .gte("completion_date", effectiveStart)
        .lte("completion_date", period.end_date),
      // 전체 리추얼 기록 수 (totalRecords용 — count only)
      supabase
        .from("ritual_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .gte("record_date", effectiveStart)
        .lte("record_date", period.end_date),
      // routines 카드용: routine_type, record_date만 (record_data 제외)
      supabase
        .from("ritual_records")
        .select("routine_type, record_date")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .gte("record_date", effectiveStart)
        .lte("record_date", period.end_date),
      supabase
        .from("challenge_registrations")
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("declarations")
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("mid_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("final_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
    ]);

  const fullyCompleteDates = (dailyRes.data ?? []).map((r) => r.completion_date);
  const fullyCompleteDays = fullyCompleteDates.length;
  const totalRecords = recordsCountRes.count ?? 0;
  const routineRecords = routineRecordsRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  const currentStreak = calcStreak(fullyCompleteDates);

  // overall stats
  const totalDaysWithRecords = fullyCompleteDays || 1;
  const overallCompletionRate = Math.round(
    (fullyCompleteDays / totalDaysWithRecords) * 100,
  );
  const overall: RitualOverallStats = {
    totalRecords,
    currentStreak,
    completionRate: overallCompletionRate,
  };

  // routines cards (routine_type, record_date만 사용 — record_data 없음)
  const registeredTypesList = registrations.map(
    (r) => r.routine_type as RoutineTypeDB,
  );
  const routines: RoutineCardStats[] = registeredTypesList
    .filter((rt) => ROUTINE_CONFIG[rt])
    .map((rt) => {
      const config = ROUTINE_CONFIG[rt];
      const routineDates = routineRecords
        .filter((r) => r.routine_type === rt)
        .map((r) => r.record_date);
      const uniqueDates = [...new Set(routineDates)];

      return {
        id: rt,
        name: config.name,
        routineType: rt,
        color: config.color,
        bgColor: config.bgColor,
        totalDays: uniqueDates.length,
        streak: calcStreak(uniqueDates),
        weekActivity: getWeekActivity(uniqueDates),
      };
    });

  // completion stats (활성 기간 기반)
  // 선언은 "신청한 모든 리추얼에 대해 작성"되어야 +1
  // 중간 회고는 유저당 1개라도 작성했으면 +1
  const registeredTypes = new Set(registrations.map((r) => r.routine_type));
  const fullyCompleteDateMap = new Map<string, Set<string>>();
  for (const date of fullyCompleteDates) {
    fullyCompleteDateMap.set(date, registeredTypes);
  }
  const { completedDays } = calcCompletionAccounting(
    fullyCompleteDateMap,
    registeredTypes,
    effectiveStart,
    period.end_date,
  );
  const hasDeclaration = isAllRoutinesCovered(
    registeredTypes,
    declarationsRes.data,
  );
  const hasMidReview = (midReviewsRes.data ?? []).length > 0;
  const hasFinalReview = (finalReviewsRes.data ?? []).length > 0;
  const totalAchieved =
    completedDays +
    (hasDeclaration ? 1 : 0) +
    (hasMidReview ? 1 : 0) +
    (hasFinalReview ? 1 : 0);
  const rate =
    totalDays > 0 ? Math.round((totalAchieved / totalDays) * 100) : 0;

  const completion: CompletionRateStats = {
    rate,
    completedDays,
    hasDeclaration,
    hasMidReview,
    hasFinalReview,
    totalAchieved,
    totalDays,
  };

  return { overall, routines, completion, totalRoutineDays };
}

// ── API: 전체 통계 + 리추얼별 카드 ──────────────────────

export async function getRitualStats(): Promise<{
  overall?: RitualOverallStats;
  routines?: RoutineCardStats[];
  error?: string;
}> {
  const [
    { challengeId, resetAt, error: cError },
    user,
    { period, error: pError },
  ] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
    getActivePeriod(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!period) return { error: pError ?? "활성 챌린지 기간이 없습니다." };
  if (isChallengePeriodEnded(period)) {
    return { overall: getEmptyOverallStats(), routines: [] };
  }
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const effectiveStart = getEffectiveStart(period.start_date, resetAt);
  const supabase = await createClient();

  // daily_completions로 overall 계산, routine_records는 routines 카드용으로만 사용
  const [dailyRes, recordsCountRes, routineRecordsRes, registrationsRes] =
    await Promise.all([
      // 완전 달성일 목록 (fullyCompleteDays, streak 계산용)
      supabase
        .from("daily_completions")
        .select("completion_date")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .eq("is_fully_complete", true)
        .gte("completion_date", effectiveStart)
        .lte("completion_date", period.end_date),
      // 전체 리추얼 기록 수 (totalRecords용 — count only)
      supabase
        .from("ritual_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .gte("record_date", effectiveStart)
        .lte("record_date", period.end_date),
      // routines 카드용: routine_type, record_date만 (record_data 제외)
      supabase
        .from("ritual_records")
        .select("routine_type, record_date")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .gte("record_date", effectiveStart)
        .lte("record_date", period.end_date),
      supabase
        .from("challenge_registrations")
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
    ]);

  const fullyCompleteDates = (dailyRes.data ?? []).map((r) => r.completion_date);
  const fullyCompleteDays = fullyCompleteDates.length;
  const totalRecords = recordsCountRes.count ?? 0;
  const routineRecords = routineRecordsRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  // 전체 통계
  const currentStreak = calcStreak(fullyCompleteDates);
  const totalDaysWithRecords = fullyCompleteDays || 1;
  const completionRate = Math.round(
    (fullyCompleteDays / totalDaysWithRecords) * 100,
  );

  const overall: RitualOverallStats = {
    totalRecords,
    currentStreak,
    completionRate,
  };

  // 리추얼별 카드 (등록된 리추얼만, routine_type/record_date만 사용)
  const registeredTypesList = registrations.map(
    (r) => r.routine_type as RoutineTypeDB,
  );
  const routines: RoutineCardStats[] = registeredTypesList
    .filter((rt) => ROUTINE_CONFIG[rt])
    .map((rt) => {
      const config = ROUTINE_CONFIG[rt];
      const routineDates = routineRecords
        .filter((r) => r.routine_type === rt)
        .map((r) => r.record_date);
      const uniqueDates = [...new Set(routineDates)];

      return {
        id: rt,
        name: config.name,
        routineType: rt,
        color: config.color,
        bgColor: config.bgColor,
        totalDays: uniqueDates.length,
        streak: calcStreak(uniqueDates),
        weekActivity: getWeekActivity(uniqueDates),
      };
    });

  return { overall, routines };
}

// ── API: 운동 인사이트 ────────────────────────────────

export async function getExerciseInsight(): Promise<{
  data?: ExerciseInsight;
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const { data: records } = await supabase
    .from("ritual_records")
    .select("record_data")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", "exercise");

  if (!records || records.length === 0) {
    return {
      data: { totalMinutes: 0, totalSessions: 0, avgMinutes: 0, exercises: [] },
    };
  }

  const exerciseMap: Record<string, { count: number; totalMinutes: number }> =
    {};
  let totalMinutes = 0;

  for (const r of records) {
    const d = r.record_data as unknown as ExerciseRecordData;
    totalMinutes += d.duration || 0;
    const name = d.exerciseName || "기타";
    if (!exerciseMap[name]) exerciseMap[name] = { count: 0, totalMinutes: 0 };
    exerciseMap[name].count++;
    exerciseMap[name].totalMinutes += d.duration || 0;
  }

  const exercises = Object.entries(exerciseMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    data: {
      totalMinutes,
      totalSessions: records.length,
      avgMinutes: Math.round(totalMinutes / records.length),
      exercises,
    },
  };
}

// ── API: 모닝 인사이트 ────────────────────────────────

export async function getMorningInsight(): Promise<{
  data?: MorningInsight;
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const { data: records } = await supabase
    .from("ritual_records")
    .select("record_data, record_date")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", "morning")
    .order("record_date", { ascending: true });

  if (!records || records.length === 0) {
    return { data: { avgCondition: 0, avgSleepHours: "0h", sleepTrend: [] } };
  }

  const conditionMap = { 상: 90, 중: 60, 하: 30 };
  let totalCondition = 0;
  let totalSleep = 0;
  const sleepTrend: { date: string; value: number }[] = [];

  for (const r of records) {
    const d = r.record_data as unknown as MorningRecordData;
    totalCondition += conditionMap[d.condition] ?? 60;
    totalSleep += d.sleepHours || 0;
    sleepTrend.push({ date: r.record_date, value: d.sleepHours || 0 });
  }

  const avgSleepRaw = totalSleep / records.length;
  const hours = Math.floor(avgSleepRaw);
  const mins = Math.round((avgSleepRaw - hours) * 60);

  return {
    data: {
      avgCondition: Math.round(totalCondition / records.length),
      avgSleepHours: `${hours}h ${mins}m`,
      sleepTrend: sleepTrend.slice(-18), // 최근 18일
    },
  };
}

// ── API: 영어 / 제2외국어 인사이트 ────────────────────

export async function getLanguageInsight(
  routineType: "english" | "second_language" = "english",
): Promise<{ data?: LanguageInsight; error?: string }> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const { data: records } = await supabase
    .from("ritual_records")
    .select("record_data, record_date")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", routineType)
    .order("record_date", { ascending: false });

  if (!records || records.length === 0) {
    return {
      data: { totalExpressions: 0, totalDays: 0, recentExpressions: [] },
    };
  }

  const uniqueDates = new Set(records.map((r) => r.record_date));
  let totalExpressions = 0;
  const recentExpressions: { word: string; meaning: string }[] = [];

  for (const r of records) {
    const d = r.record_data as unknown as LanguageRecordData;
    const exprs = d.expressions ?? [];
    totalExpressions += exprs.length;
    // 최근 5개만
    if (recentExpressions.length < 5) {
      for (const expr of exprs) {
        if (recentExpressions.length >= 5) break;
        recentExpressions.push({ word: expr.word, meaning: expr.meaning });
      }
    }
  }

  return {
    data: {
      totalExpressions,
      totalDays: uniqueDates.size,
      recentExpressions,
    },
  };
}

// ── API: 자산관리 인사이트 ────────────────────────────

export async function getFinanceInsight(): Promise<{
  data?: FinanceInsight;
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const { data: records } = await supabase
    .from("ritual_records")
    .select("record_data, record_date")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .eq("routine_type", "finance")
    .order("record_date", { ascending: true });

  if (!records || records.length === 0) {
    return {
      data: {
        currentMonth: {
          total: 0,
          necessary: 0,
          emotional: 0,
          value: 0,
          categories: [],
        },
        weeklySpending: [],
      },
    };
  }

  let total = 0;
  let necessary = 0;
  let emotional = 0;
  let value = 0;
  const categoryMap: Record<string, number> = {};
  const weeklyMap: Record<string, number> = {};

  for (const r of records) {
    const d = r.record_data as unknown as FinanceRecordData;
    const allExpenses = (d.dailyExpenses ?? []).flatMap(
      (de) => de.expenses ?? [],
    );

    for (const exp of allExpenses) {
      total += exp.amount;
      if (exp.type === "necessary") necessary += exp.amount;
      else if (exp.type === "value") value += exp.amount;
      else emotional += exp.amount;

      const catName = exp.name || "기타";
      categoryMap[catName] = (categoryMap[catName] || 0) + exp.amount;
    }

    // 주차 계산
    const date = new Date(r.record_date);
    const weekNum = Math.ceil(date.getDate() / 7);
    const weekLabel = `${weekNum}주`;
    weeklyMap[weekLabel] =
      (weeklyMap[weekLabel] || 0) +
      allExpenses.reduce((s, e) => s + e.amount, 0);
  }

  const categoryColors = [
    "#f97316",
    "#6366f1",
    "#ec4899",
    "#10b981",
    "#94a3b8",
  ];
  const categories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], i) => ({
      name,
      amount,
      color: categoryColors[i % categoryColors.length],
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));

  const weeklySpending = Object.entries(weeklyMap).map(([week, amount]) => ({
    week,
    amount,
  }));

  return {
    data: {
      currentMonth: { total, necessary, emotional, value, categories },
      weeklySpending,
    },
  };
}

// ── 타입: 날짜별 달력 마커 ────────────────────────────────
export interface CalendarDayMarker {
  hasRoutine: boolean; // 리추얼 기록이 있는 날
  hasTodo: boolean; // 완료된 투두가 있는 날
  isFullyComplete: boolean; // 등록된 리추얼을 모두 완료한 날
}

// ── API: Home 화면 통합 통계 ───────────────────────────
// HomeContainer에서 MyPageStats(Profile + TaskTabs) + CompletionRate(Profile)를
// 한 번에 받아오기 위한 통합 server action.

export async function getHomeStats(): Promise<{
  myPage?: MyPageStats;
  completion?: CompletionRateStats;
  calendarMarkers?: Record<string, CalendarDayMarker>;
  routineCompletionMap?: Record<string, number>; // routine_type → 완료 일수
  totalRoutineDays?: number; // 활성 기간 내 평일(월~금) 수 (UI에서 목표 일수로 사용)
  profile?: HomeProfile | null;
  challengers?: ChallengerSummary[];
  routines?: ChallengeRegistration[];
  error?: string;
}> {
  const [
    { challengeId, resetAt, error: cError },
    user,
    { period, error: pError },
  ] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
    getActivePeriod(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!period) return { error: pError ?? "활성 챌린지 기간이 없습니다." };

  const effectiveStart = getEffectiveStart(period.start_date, resetAt);
  const totalRoutineDays = countWeekdaysInRange(
    effectiveStart,
    period.end_date,
  );
  const totalDays = totalRoutineDays + 3;

  const supabase = await createClient();
  const admin = createAdminClient();

  if (isChallengePeriodEnded(period)) {
    const [{ data: profile }, ritualStart] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, name, avatar_url")
        .eq("id", user.id)
        .single(),
      getProfileRitualStart(user.id),
    ]);

    return {
      myPage: getEmptyMyPageStats(),
      completion: getEmptyCompletion(totalDays),
      calendarMarkers: {},
      routineCompletionMap: {},
      totalRoutineDays,
      profile: profile ? { ...profile, ...ritualStart } : null,
      challengers: [],
      routines: [],
    };
  }

  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const [
    currentRes,
    registrationsRes,
    declarationsRes,
    midReviewsRes,
    finalReviewsRes,
    todosRes,
    profileRes,
    challengersRes,
  ] = await Promise.all([
    supabase
      .from("ritual_records")
      .select("routine_type, record_date")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId)
      .gte("record_date", effectiveStart)
      .lte("record_date", period.end_date),
    supabase
      .from("challenge_registrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId)
      .order("registered_at", { ascending: true }),
    supabase
      .from("declarations")
      .select("routine_type")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
    supabase
      .from("mid_reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
    supabase
      .from("final_reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
    supabase
      .from("todos")
      .select("todo_date, completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("todo_date", period.start_date)
      .lte("todo_date", period.end_date),
    supabase
      .from("profiles")
      .select("id, username, name, avatar_url")
      .eq("id", user.id)
      .single(),
    admin
      .from("challenges")
      .select("id, user_id, profiles!inner(id, name, avatar_url, emoji)")
      .eq("period_id", period.id),
  ]);

  const currentRecords = currentRes.data ?? [];
  const registrations = (registrationsRes.data ?? []) as ChallengeRegistration[];
  const completedTodos = todosRes.data ?? [];
  const ritualStart = await getProfileRitualStart(user.id);
  const profile = profileRes.data
    ? ({ ...profileRes.data, ...ritualStart } as HomeProfile)
    : null;

  type ChallengerRow = {
    id: string;
    user_id: string;
    profiles: {
      id: string;
      name: string;
      avatar_url: string | null;
      emoji: string | null;
    } | null;
  };
  const challengerRows = (challengersRes.data ?? []) as unknown as ChallengerRow[];
  const periodChallengeIds = challengerRows.map((r) => r.id);
  const { data: periodRegistrations } =
    periodChallengeIds.length > 0
      ? await admin
          .from("challenge_registrations")
          .select("user_id")
          .in("challenge_id", periodChallengeIds)
      : { data: [] };
  const registeredUserIds = new Set(
    (periodRegistrations ?? []).map((r) => r.user_id),
  );
  const challengers: ChallengerSummary[] = challengerRows
    .filter((r) => r.profiles)
    .filter((r) => registeredUserIds.has(r.user_id))
    .map((r) => ({
      id: r.profiles!.id,
      name: r.profiles!.name,
      avatarUrl: r.profiles!.avatar_url,
      emoji: r.profiles!.emoji,
    }))
    .sort((a, b) => {
      if (a.id === user.id) return -1;
      if (b.id === user.id) return 1;
      return 0;
    });

  const seenRoutineTypes = new Set<string>();
  const routines = registrations.filter((r) => {
    if (seenRoutineTypes.has(r.routine_type)) return false;
    seenRoutineTypes.add(r.routine_type);
    return true;
  });

  // myPage stats (현재 챌린지 기준으로 스트릭 계산)
  const currentDates = [...new Set(currentRecords.map((r) => r.record_date))];
  const myPage: MyPageStats = {
    currentStreak: calcStreak(currentDates),
    longestStreak: calcLongestStreak(currentDates),
    totalCompletions: currentRecords.length,
  };

  // completion stats (오늘/주말 인증도 포함한 완료 횟수 — 진행표와 동일 로직)
  const registeredTypes = new Set(registrations.map((r) => r.routine_type));
  const dateMap = new Map<string, Set<string>>();
  for (const r of currentRecords) {
    if (!dateMap.has(r.record_date)) dateMap.set(r.record_date, new Set());
    dateMap.get(r.record_date)!.add(r.routine_type);
  }
  const { completedDays } = calcCompletionAccounting(
    dateMap,
    registeredTypes,
    effectiveStart,
    period.end_date,
  );
  const hasDeclaration = isAllRoutinesCovered(
    registeredTypes,
    declarationsRes.data,
  );
  const hasMidReview = (midReviewsRes.data ?? []).length > 0;
  const hasFinalReview = (finalReviewsRes.data ?? []).length > 0;
  const totalAchieved =
    completedDays +
    (hasDeclaration ? 1 : 0) +
    (hasMidReview ? 1 : 0) +
    (hasFinalReview ? 1 : 0);
  const completion: CompletionRateStats = {
    rate:
      totalDays > 0
        ? Math.round((totalAchieved / totalDays) * 100)
        : 0,
    completedDays,
    hasDeclaration,
    hasMidReview,
    hasFinalReview,
    totalAchieved,
    totalDays,
  };

  // calendar markers (날짜별 리추얼/투두 완료 마커)
  const todoDateSet = new Set(completedTodos.map((t) => t.todo_date));
  const calendarMarkers: Record<string, CalendarDayMarker> = {};

  // 리추얼 기록이 있는 날짜
  for (const [date, completedTypes] of dateMap) {
    const allDone = [...registeredTypes].every((rt) => completedTypes.has(rt));
    calendarMarkers[date] = {
      hasRoutine: true,
      hasTodo: todoDateSet.has(date),
      isFullyComplete: allDone,
    };
  }

  // 투두만 완료된 날짜 (리추얼 기록은 없는 경우)
  for (const date of todoDateSet) {
    if (!calendarMarkers[date]) {
      calendarMarkers[date] = {
        hasRoutine: false,
        hasTodo: true,
        isFullyComplete: false,
      };
    }
  }

  // 리추얼별 완료 횟수 (완료 일수 + 리추얼선언 + 중간회고 + 최종회고)
  const routineCompletionMap: Record<string, number> = {};
  const routineDateSets = new Map<string, Set<string>>();
  for (const r of currentRecords) {
    if (!routineDateSets.has(r.routine_type))
      routineDateSets.set(r.routine_type, new Set());
    routineDateSets.get(r.routine_type)!.add(r.record_date);
  }
  const declaredTypes = new Set(
    (declarationsRes.data ?? []).map((r) => r.routine_type),
  );
  // 중간 회고는 유저당 1개라도 있으면 등록한 모든 리추얼에 +1
  const midReviewBonus = (midReviewsRes.data ?? []).length > 0 ? 1 : 0;
  const finalReviewBonus = (finalReviewsRes.data ?? []).length > 0 ? 1 : 0;

  for (const rt of registeredTypes) {
    const days = routineDateSets.get(rt)?.size ?? 0;
    const decl = declaredTypes.has(rt) ? 1 : 0;
    routineCompletionMap[rt] = days + decl + midReviewBonus + finalReviewBonus;
  }

  return {
    myPage,
    completion,
    calendarMarkers,
    routineCompletionMap,
    totalRoutineDays,
    profile,
    challengers,
    routines,
  };
}

// ── API: 마이페이지 통계 ────────────────────────────────

export async function getMyPageStats(): Promise<{
  data?: MyPageStats;
  error?: string;
}> {
  const [
    { challengeId, resetAt, error: cError },
    user,
    { period, error: pError },
  ] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
    getActivePeriod(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!period) return { error: pError ?? "활성 챌린지 기간이 없습니다." };
  if (isChallengePeriodEnded(period)) {
    return { data: getEmptyMyPageStats() };
  }
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const effectiveStart = getEffectiveStart(period.start_date, resetAt);
  const supabase = await createClient();

  // 활성 기간 안의 기록만 조회 (연속 실천, 최장 기록, 총 완료 모두 기간 단위 리셋)
  const { data, error } = await supabase
    .from("ritual_records")
    .select("record_date")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .gte("record_date", effectiveStart)
    .lte("record_date", period.end_date);

  if (error) return { error: error.message };

  const records = data ?? [];
  const dates = [...new Set(records.map((r) => r.record_date))];

  return {
    data: {
      currentStreak: calcStreak(dates),
      longestStreak: calcLongestStreak(dates),
      totalCompletions: records.length,
    },
  };
}

// ── API: 달성률 ────────────────────────────────────────

export async function getCompletionRate(): Promise<{
  data?: CompletionRateStats;
  error?: string;
}> {
  const [
    { challengeId, resetAt, error: cError },
    user,
    { period, error: pError },
  ] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
    getActivePeriod(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!period) return { error: pError ?? "활성 챌린지 기간이 없습니다." };

  const effectiveStart = getEffectiveStart(period.start_date, resetAt);
  const totalRoutineDays = countWeekdaysInRange(
    effectiveStart,
    period.end_date,
  );
  const totalDays = totalRoutineDays + 3;

  if (isChallengePeriodEnded(period)) {
    return { data: getEmptyCompletion(totalDays) };
  }

  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const [
    recordsRes,
    registrationsRes,
    declarationsRes,
    midReviewsRes,
    finalReviewsRes,
  ] = await Promise.all([
      supabase
        .from("ritual_records")
        .select("routine_type, record_date")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .gte("record_date", effectiveStart)
        .lte("record_date", period.end_date),
      supabase
        .from("challenge_registrations")
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("declarations")
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("mid_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("final_reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
    ]);

  // 오늘/주말 인증도 포함한 완료 횟수 (진행표와 동일 로직)
  const registeredTypes = new Set(
    (registrationsRes.data ?? []).map((r) => r.routine_type),
  );
  const dateMap = new Map<string, Set<string>>();
  for (const r of recordsRes.data ?? []) {
    if (!dateMap.has(r.record_date)) dateMap.set(r.record_date, new Set());
    dateMap.get(r.record_date)!.add(r.routine_type);
  }
  const { completedDays } = calcCompletionAccounting(
    dateMap,
    registeredTypes,
    effectiveStart,
    period.end_date,
  );
  const hasDeclaration = isAllRoutinesCovered(
    registeredTypes,
    declarationsRes.data,
  );
  const hasMidReview = (midReviewsRes.data ?? []).length > 0;
  const hasFinalReview = (finalReviewsRes.data ?? []).length > 0;

  const totalAchieved =
    completedDays +
    (hasDeclaration ? 1 : 0) +
    (hasMidReview ? 1 : 0) +
    (hasFinalReview ? 1 : 0);

  const rate =
    totalDays > 0
      ? Math.round((totalAchieved / totalDays) * 100)
      : 0;

  return {
    data: {
      rate,
      completedDays,
      hasDeclaration,
      hasMidReview,
      hasFinalReview,
      totalAchieved,
      totalDays,
    },
  };
}
