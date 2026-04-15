"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentChallengeId } from "@/lib/current-challenge";
import { getKoreanNow, toDateString } from "@/lib/date";
import type {
  RoutineTypeDB,
  RitualRecord,
  ExerciseRecordData,
  MorningRecordData,
  LanguageRecordData,
  FinanceRecordData,
} from "@/types/supabase";

// ── 타입 ──────────────────────────────────────────────

export interface RitualOverallStats {
  totalRecords: number;
  currentStreak: number;
  completionRate: number;
}

export interface MyPageStats {
  currentStreak: number;   // 연속 실천 (하루에 루틴 1개라도 완료한 연속 일수)
  longestStreak: number;   // 최장 기록 (가장 긴 연속 실천 기간)
  totalCompletions: number; // 총 완료 (루틴 완료 수 합산)
}

export interface CompletionRateStats {
  rate: number;             // 달성률 (%)
  completedDays: number;    // 루틴 완전 달성 일수 (최대 15)
  hasDeclaration: boolean;  // 리추얼 선언 작성 여부
  hasMidReview: boolean;    // 중간회고 작성 여부
  hasFinalReview: boolean;  // 최종회고 작성 여부
  totalAchieved: number;    // 달성 합계 (최대 18)
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
  sleepTrend: number[];
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
    categories: { name: string; amount: number; color: string; percent: number }[];
  };
  weeklySpending: { week: string; amount: number }[];
}

// ── 루틴 설정 ──────────────────────────────────────────

const ROUTINE_CONFIG: Record<
  string,
  { name: string; color: string; bgColor: string }
> = {
  reading: { name: "독서", color: "#6366f1", bgColor: "#eef2ff" },
  exercise: { name: "운동", color: "#ff8900", bgColor: "#fff4e5" },
  morning: { name: "모닝", color: "#eab32e", bgColor: "#fefce8" },
  english: { name: "영어", color: "#0ea5e9", bgColor: "#f0f9ff" },
  second_language: { name: "제2외국어", color: "#10b981", bgColor: "#ecfdf5" },
  finance: { name: "자산관리", color: "#10b981", bgColor: "#ecfdf5" },
};

// ── 유틸 ──────────────────────────────────────────────

/** 이번 달 1일부터 오늘까지의 평일(월~금) 날짜 목록 */
function getPastWeekdayDates(year: number, month: number): Set<string> {
  const today = getKoreanNow();
  const dates = new Set<string>();
  const d = new Date(year, month - 1, 1);
  while (d <= today && d.getMonth() === month - 1) {
    const day = d.getDay();
    if (day >= 1 && day <= 5) dates.add(toDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** 이번 달 1일부터 오늘까지의 주말(토, 일) 날짜 목록 */
function getPastWeekendDates(year: number, month: number): Set<string> {
  const today = getKoreanNow();
  const dates = new Set<string>();
  const d = new Date(year, month - 1, 1);
  while (d <= today && d.getMonth() === month - 1) {
    const day = d.getDay();
    if (day === 0 || day === 6) dates.add(toDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/**
 * 평일 완료 + 주말 보충 기반 달성 일수 계산 (진행표와 동일 로직)
 * dateMap: 날짜 → 완료한 루틴 Set
 * registeredTypes: 등록된 루틴 Set
 */
function calcCompletedDays(
  dateMap: Map<string, Set<string>>,
  registeredTypes: Set<string>,
): number {
  const now = getKoreanNow();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const pastWeekdays = getPastWeekdayDates(year, month);
  const pastWeekends = getPastWeekendDates(year, month);

  const isFullyComplete = (date: string): boolean => {
    const done = dateMap.get(date);
    if (!done) return false;
    for (const rt of registeredTypes) {
      if (!done.has(rt)) return false;
    }
    return true;
  };

  let weekdayComplete = 0;
  for (const wd of pastWeekdays) {
    if (isFullyComplete(wd)) weekdayComplete++;
  }

  let weekendMakeup = 0;
  for (const we of pastWeekends) {
    if (isFullyComplete(we)) weekendMakeup++;
  }

  return Math.min(weekdayComplete + weekendMakeup, 15);
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => b.localeCompare(a)); // 최신순
  const today = toDateString(getKoreanNow());
  let streak = 0;
  let checkDate = getKoreanNow();

  // 오늘 기록이 없으면 어제부터 체크
  if (sorted[0] !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (const date of sorted) {
    const checkStr = toDateString(checkDate);
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

/**
 * 신청한 모든 루틴(registeredTypes)에 대해 항목(rows)이 작성되었는지 검사.
 * 선언/중간회고/최종회고가 "신청한 루틴 수만큼 채워졌을 때"만 달성으로 인정한다.
 */
function isAllRoutinesCovered(
  registeredTypes: Set<string>,
  rows: { routine_type: string }[] | null | undefined,
): boolean {
  if (registeredTypes.size === 0) return false;
  const written = new Set((rows ?? []).map((r) => r.routine_type));
  for (const rt of registeredTypes) {
    if (!written.has(rt)) return false;
  }
  return true;
}

function getWeekActivity(dates: string[]): boolean[] {
  const today = getKoreanNow();
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const activity: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const dateStr = toDateString(d);
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
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  // 4개 쿼리를 한 번에 병렬 실행 (이전엔 두 endpoint가 ritual_records/registrations를 중복 조회)
  const [recordsRes, registrationsRes, declarationsRes, midReviewsRes] = await Promise.all([
    supabase
      .from("ritual_records")
      .select("routine_type, record_date")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
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
      .select("routine_type")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
  ]);

  const records = recordsRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  const totalRecords = records.length;
  const allDates = [...new Set(records.map((r) => r.record_date))].sort();
  const currentStreak = calcStreak(allDates);

  // 날짜별 완료 루틴 set
  const registeredTypes = new Set(registrations.map((r) => r.routine_type));
  const dateMap = new Map<string, Set<string>>();
  for (const r of records) {
    if (!dateMap.has(r.record_date)) dateMap.set(r.record_date, new Set());
    dateMap.get(r.record_date)!.add(r.routine_type);
  }
  let fullyCompleteDays = 0;
  for (const [, completedTypes] of dateMap) {
    const allDone = [...registeredTypes].every((rt) => completedTypes.has(rt));
    if (allDone) fullyCompleteDays++;
  }

  // overall stats
  const totalDaysWithRecords = dateMap.size || 1;
  const overallCompletionRate = Math.round(
    (fullyCompleteDays / totalDaysWithRecords) * 100,
  );
  const overall: RitualOverallStats = {
    totalRecords,
    currentStreak,
    completionRate: overallCompletionRate,
  };

  // routines cards
  const registeredTypesList = registrations.map((r) => r.routine_type as RoutineTypeDB);
  const routines: RoutineCardStats[] = registeredTypesList
    .filter((rt) => ROUTINE_CONFIG[rt])
    .map((rt) => {
      const config = ROUTINE_CONFIG[rt];
      const routineDates = records
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

  // completion stats (전체 18일 기준)
  // 회고/선언은 "신청한 모든 루틴에 대해 작성"되어야 +1
  const completedDays = Math.min(fullyCompleteDays, 15);
  const hasDeclaration = isAllRoutinesCovered(
    registeredTypes,
    declarationsRes.data,
  );
  const hasMidReview = isAllRoutinesCovered(
    registeredTypes,
    midReviewsRes.data,
  );
  const hasFinalReview = false; // TODO: 최종회고 테이블 생성 후 동일 로직 적용
  const totalAchieved =
    completedDays +
    (hasDeclaration ? 1 : 0) +
    (hasMidReview ? 1 : 0) +
    (hasFinalReview ? 1 : 0);
  const rate = Math.round((totalAchieved / TOTAL_DAYS) * 100);

  const completion: CompletionRateStats = {
    rate,
    completedDays,
    hasDeclaration,
    hasMidReview,
    hasFinalReview,
    totalAchieved,
  };

  return { overall, routines, completion };
}

// ── API: 전체 통계 + 루틴별 카드 ──────────────────────

export async function getRitualStats(): Promise<{
  overall?: RitualOverallStats;
  routines?: RoutineCardStats[];
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  // 기록 + 등록 루틴 동시 조회
  const [recordsRes, registrationsRes] = await Promise.all([
    supabase
      .from("ritual_records")
      .select("routine_type, record_date")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
    supabase
      .from("challenge_registrations")
      .select("routine_type")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
  ]);

  const records = recordsRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  // 전체 통계
  const totalRecords = records.length;
  const allDates = [...new Set(records.map((r) => r.record_date))].sort();
  const currentStreak = calcStreak(allDates);

  // 달성률: 날짜별로 등록된 루틴을 모두 완료했는지 계산
  const registeredTypes = new Set(registrations.map((r) => r.routine_type));
  const dateMap = new Map<string, Set<string>>();
  for (const r of records) {
    if (!dateMap.has(r.record_date)) dateMap.set(r.record_date, new Set());
    dateMap.get(r.record_date)!.add(r.routine_type);
  }
  let fullyCompleteDays = 0;
  for (const [, completedTypes] of dateMap) {
    const allDone = [...registeredTypes].every((rt) => completedTypes.has(rt));
    if (allDone) fullyCompleteDays++;
  }
  const totalDaysWithRecords = dateMap.size || 1;
  const completionRate = Math.round((fullyCompleteDays / totalDaysWithRecords) * 100);

  const overall: RitualOverallStats = { totalRecords, currentStreak, completionRate };

  // 루틴별 카드 (등록된 루틴만)
  const registeredTypesList = registrations.map((r) => r.routine_type as RoutineTypeDB);
  const routines: RoutineCardStats[] = registeredTypesList
    .filter((rt) => ROUTINE_CONFIG[rt])
    .map((rt) => {
      const config = ROUTINE_CONFIG[rt];
      const routineDates = records
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
    return { data: { totalMinutes: 0, totalSessions: 0, avgMinutes: 0, exercises: [] } };
  }

  const exerciseMap: Record<string, { count: number; totalMinutes: number }> = {};
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

  const conditionMap = { "상": 90, "중": 60, "하": 30 };
  let totalCondition = 0;
  let totalSleep = 0;
  const sleepTrend: number[] = [];

  for (const r of records) {
    const d = r.record_data as unknown as MorningRecordData;
    totalCondition += conditionMap[d.condition] ?? 60;
    totalSleep += d.sleepHours || 0;
    sleepTrend.push(d.sleepHours || 0);
  }

  const avgSleepRaw = totalSleep / records.length;
  const hours = Math.floor(avgSleepRaw);
  const mins = Math.round((avgSleepRaw - hours) * 60);

  return {
    data: {
      avgCondition: Math.round(totalCondition / records.length),
      avgSleepHours: `${hours}h ${mins}m`,
      sleepTrend: sleepTrend.slice(-15), // 최근 15일
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
    return { data: { totalExpressions: 0, totalDays: 0, recentExpressions: [] } };
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
        currentMonth: { total: 0, necessary: 0, emotional: 0, categories: [] },
        weeklySpending: [],
      },
    };
  }

  let total = 0;
  let necessary = 0;
  let emotional = 0;
  const categoryMap: Record<string, number> = {};
  const weeklyMap: Record<string, number> = {};

  for (const r of records) {
    const d = r.record_data as unknown as FinanceRecordData;
    const allExpenses = (d.dailyExpenses ?? []).flatMap((de) => de.expenses ?? []);

    for (const exp of allExpenses) {
      total += exp.amount;
      if (exp.type === "necessary") necessary += exp.amount;
      else emotional += exp.amount;

      const catName = exp.name || "기타";
      categoryMap[catName] = (categoryMap[catName] || 0) + exp.amount;
    }

    // 주차 계산
    const date = new Date(r.record_date);
    const weekNum = Math.ceil(date.getDate() / 7);
    const weekLabel = `${weekNum}주`;
    weeklyMap[weekLabel] = (weeklyMap[weekLabel] || 0) +
      allExpenses.reduce((s, e) => s + e.amount, 0);
  }

  const categoryColors = ["#f97316", "#6366f1", "#ec4899", "#10b981", "#94a3b8"];
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
      currentMonth: { total, necessary, emotional, categories },
      weeklySpending,
    },
  };
}

// ── API: Home 화면 통합 통계 ───────────────────────────
// HomeContainer에서 MyPageStats(Profile + TaskTabs) + CompletionRate(Profile)를
// 한 번에 받아오기 위한 통합 server action.

export async function getHomeStats(): Promise<{
  myPage?: MyPageStats;
  completion?: CompletionRateStats;
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const [currentRes, allRes, registrationsRes, declarationsRes, midReviewsRes] =
    await Promise.all([
      supabase
        .from("ritual_records")
        .select("routine_type, record_date")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("ritual_records")
        .select("record_date")
        .eq("user_id", user.id),
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
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
    ]);

  const currentRecords = currentRes.data ?? [];
  const allRecords = allRes.data ?? [];
  const registrations = registrationsRes.data ?? [];

  // myPage stats
  const currentDates = [...new Set(currentRecords.map((r) => r.record_date))];
  const allDates = allRecords.map((r) => r.record_date);
  const myPage: MyPageStats = {
    currentStreak: calcStreak(currentDates),
    longestStreak: calcLongestStreak(allDates),
    totalCompletions: currentRecords.length,
  };

  // completion stats (평일 완료 + 주말 보충 기반 — 진행표와 동일 로직)
  const registeredTypes = new Set(registrations.map((r) => r.routine_type));
  const dateMap = new Map<string, Set<string>>();
  for (const r of currentRecords) {
    if (!dateMap.has(r.record_date)) dateMap.set(r.record_date, new Set());
    dateMap.get(r.record_date)!.add(r.routine_type);
  }
  const completedDays = calcCompletedDays(dateMap, registeredTypes);
  const hasDeclaration = isAllRoutinesCovered(
    registeredTypes,
    declarationsRes.data,
  );
  const hasMidReview = isAllRoutinesCovered(
    registeredTypes,
    midReviewsRes.data,
  );
  const hasFinalReview = false; // TODO: 최종회고 테이블 생성 후 동일 로직 적용
  const totalAchieved =
    completedDays +
    (hasDeclaration ? 1 : 0) +
    (hasMidReview ? 1 : 0) +
    (hasFinalReview ? 1 : 0);
  const completion: CompletionRateStats = {
    rate: Math.round((totalAchieved / TOTAL_DAYS) * 100),
    completedDays,
    hasDeclaration,
    hasMidReview,
    hasFinalReview,
    totalAchieved,
  };

  return { myPage, completion };
}

// ── API: 마이페이지 통계 ────────────────────────────────

export async function getMyPageStats(): Promise<{
  data?: MyPageStats;
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  // 이번 달 기록 (연속 실천, 총 완료) + 전체 기록 (최장 기록) 동시 조회
  const [currentRes, allRes] = await Promise.all([
    supabase
      .from("ritual_records")
      .select("record_date")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
    supabase
      .from("ritual_records")
      .select("record_date")
      .eq("user_id", user.id),
  ]);

  if (currentRes.error) return { error: currentRes.error.message };
  if (allRes.error) return { error: allRes.error.message };

  const currentRecords = currentRes.data ?? [];
  const allRecords = allRes.data ?? [];

  const currentDates = [...new Set(currentRecords.map((r) => r.record_date))];
  const allDates = allRecords.map((r) => r.record_date);

  return {
    data: {
      currentStreak: calcStreak(currentDates),
      longestStreak: calcLongestStreak(allDates),
      totalCompletions: currentRecords.length,
    },
  };
}

// ── API: 달성률 ────────────────────────────────────────

const TOTAL_DAYS = 18; // 15일(루틴) + 3일(선언/중간회고/최종회고)

export async function getCompletionRate(): Promise<{
  data?: CompletionRateStats;
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();

  const [recordsRes, registrationsRes, declarationsRes, midReviewsRes] = await Promise.all([
    supabase
      .from("ritual_records")
      .select("routine_type, record_date")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
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
      .select("routine_type")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId),
    // TODO: 최종회고 테이블 생성 후 여기에 추가
  ]);

  // 평일 완료 + 주말 보충 기반 달성 일수 (진행표와 동일 로직)
  const registeredTypes = new Set(
    (registrationsRes.data ?? []).map((r) => r.routine_type),
  );
  const dateMap = new Map<string, Set<string>>();
  for (const r of (recordsRes.data ?? [])) {
    if (!dateMap.has(r.record_date)) dateMap.set(r.record_date, new Set());
    dateMap.get(r.record_date)!.add(r.routine_type);
  }
  const completedDays = calcCompletedDays(dateMap, registeredTypes);
  const hasDeclaration = isAllRoutinesCovered(
    registeredTypes,
    declarationsRes.data,
  );
  const hasMidReview = isAllRoutinesCovered(
    registeredTypes,
    midReviewsRes.data,
  );
  const hasFinalReview = false; // TODO: 최종회고 테이블 연동

  const totalAchieved =
    completedDays +
    (hasDeclaration ? 1 : 0) +
    (hasMidReview ? 1 : 0) +
    (hasFinalReview ? 1 : 0);

  const rate = Math.round((totalAchieved / TOTAL_DAYS) * 100);

  return {
    data: {
      rate,
      completedDays,
      hasDeclaration,
      hasMidReview,
      hasFinalReview,
      totalAchieved,
    },
  };
}
