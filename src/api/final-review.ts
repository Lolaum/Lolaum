"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCurrentChallengeId,
  getActivePeriod,
  getEffectiveStart,
} from "@/lib/current-challenge";
import type {
  ContinuationChoice,
  FinalReview,
} from "@/types/routines/finalReview";
import type {
  ExerciseRecordData,
  FinanceRecordData,
  LanguageRecordData,
  MorningRecordData,
  ReadingRecordData,
  RecordingRecordData,
  RoutineTypeDB,
} from "@/types/supabase";
import { ROUTINE_TYPE_LABEL, normalizeRecordingEntries } from "@/types/supabase";

interface FinalReviewRow {
  id: string;
  user_id: string;
  results: string;
  life_changes: string;
  continuation_choice: ContinuationChoice;
  adjustment_note: string;
  feedback: string;
  created_at: string;
  profiles: { name: string; emoji: string | null; avatar_url: string | null } | null;
}

function toFinalReview(row: FinalReviewRow): FinalReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.profiles?.name ?? "익명",
    userEmoji: row.profiles?.emoji ?? undefined,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    results: row.results,
    lifeChanges: row.life_changes,
    continuationChoice: row.continuation_choice,
    adjustmentNote: row.adjustment_note,
    feedback: row.feedback,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS =
  "id, user_id, results, life_changes, continuation_choice, adjustment_note, feedback, created_at, profiles(name, emoji, avatar_url)";

const ROUTINE_ORDER: RoutineTypeDB[] = [
  "morning",
  "exercise",
  "reading",
  "english",
  "second_language",
  "recording",
  "finance",
  "english_book",
];

export interface FinalReviewRoutineMetric {
  label: string;
  value: string;
}

export interface FinalReviewRoutineSummary {
  routineType: RoutineTypeDB;
  label: string;
  metrics: FinalReviewRoutineMetric[];
}

function uniqueDateCount(dates: string[]): number {
  return new Set(dates).size;
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

function getRoutineSummary(input: {
  routineType: RoutineTypeDB;
  records: { record_date: string; record_data: unknown }[];
  books: {
    routine_type: "reading" | "english_book";
    is_completed: boolean;
  }[];
}): FinalReviewRoutineSummary {
  const { routineType, records, books } = input;
  const label = ROUTINE_TYPE_LABEL[routineType];

  switch (routineType) {
    case "exercise": {
      const exerciseRecords = records
        .map((record) => record.record_data as ExerciseRecordData)
        .filter((data) => (data.recordType ?? "exercise") === "exercise");
      const dietCount = records.filter((record) => {
        const data = record.record_data as ExerciseRecordData;
        return data.recordType === "diet";
      }).length;
      const totalMinutes = exerciseRecords.reduce(
        (sum, data) => sum + (data.duration || 0),
        0,
      );
      return {
        routineType,
        label,
        metrics: [
          { label: "운동 횟수", value: `${exerciseRecords.length}` },
          { label: "총 운동 시간", value: `${totalMinutes}분` },
          { label: "식단 기록", value: `${dietCount}` },
        ],
      };
    }
    case "english":
    case "second_language": {
      const totalExpressions = records.reduce((sum, record) => {
        const data = record.record_data as LanguageRecordData;
        return sum + (data.expressions?.length ?? 0);
      }, 0);
      return {
        routineType,
        label,
        metrics: [
          { label: "이번 달 학습일", value: `${uniqueDateCount(records.map((r) => r.record_date))}` },
          { label: "공부한 표현", value: `${totalExpressions}` },
        ],
      };
    }
    case "morning": {
      const totalSleep = records.reduce((sum, record) => {
        const data = record.record_data as MorningRecordData;
        return sum + (data.sleepHours || 0);
      }, 0);
      const avgSleep =
        records.length > 0 ? (totalSleep / records.length).toFixed(1) : "0";
      return {
        routineType,
        label,
        metrics: [
          { label: "기록한 날", value: `${uniqueDateCount(records.map((r) => r.record_date))}` },
          { label: "평균 수면", value: `${avgSleep}h` },
        ],
      };
    }
    case "reading":
    case "english_book": {
      const routineBooks = books.filter((book) => book.routine_type === routineType);
      const completedBooks = routineBooks.filter((book) => book.is_completed);
      const pagesOrPercent = records.reduce((sum, record) => {
        const data = record.record_data as ReadingRecordData;
        return sum + (data.progressAmount || 0);
      }, 0);
      return {
        routineType,
        label,
        metrics: [
          { label: "등록한 책", value: `${routineBooks.length}권` },
          { label: "완료한 책", value: `${completedBooks.length}권` },
          {
            label: routineType === "english_book" ? "인증 기록" : "독서 기록",
            value: `${records.length}`,
          },
          {
            label: routineType === "english_book" ? "진행 합계" : "읽은 분량",
            value: `${pagesOrPercent}`,
          },
        ],
      };
    }
    case "recording": {
      let writeCount = 0;
      let readCount = 0;
      let totalMinutes = 0;
      for (const record of records) {
        const entries = normalizeRecordingEntries(
          record.record_data as RecordingRecordData,
        );
        for (const entry of entries) {
          if (entry.type === "read") {
            readCount += 1;
          } else {
            writeCount += 1;
            totalMinutes += entry.duration || 0;
          }
        }
      }
      return {
        routineType,
        label,
        metrics: [
          { label: "기록한 날", value: `${uniqueDateCount(records.map((r) => r.record_date))}` },
          { label: "글 작성", value: `${writeCount}` },
          { label: "글 읽기 대체", value: `${readCount}` },
          { label: "작성 시간", value: `${totalMinutes}분` },
        ],
      };
    }
    case "finance": {
      let totalExpense = 0;
      let necessary = 0;
      let emotional = 0;
      let value = 0;
      for (const record of records) {
        const data = record.record_data as FinanceRecordData;
        for (const day of data.dailyExpenses ?? []) {
          for (const expense of day.expenses ?? []) {
            totalExpense += expense.amount || 0;
            if (expense.type === "necessary") necessary += expense.amount || 0;
            if (expense.type === "emotional") emotional += expense.amount || 0;
            if (expense.type === "value") value += expense.amount || 0;
          }
        }
      }
      return {
        routineType,
        label,
        metrics: [
          { label: "기록한 날", value: `${uniqueDateCount(records.map((r) => r.record_date))}` },
          { label: "총 소비", value: formatWon(totalExpense) },
          { label: "필요소비", value: formatWon(necessary) },
          { label: "감정소비", value: formatWon(emotional) },
          { label: "가치소비", value: formatWon(value) },
        ],
      };
    }
  }
}

/** 활성 기간의 모든 챌린지 ID 조회 */
async function getCurrentPeriodChallengeIds(): Promise<string[]> {
  try {
    const { period } = await getActivePeriod();
    if (!period) return [];
    const admin = createAdminClient();
    const { data } = await admin
      .from("challenges")
      .select("id")
      .eq("period_id", period.id);
    return (data ?? []).map((c) => c.id);
  } catch (e) {
    console.error("getCurrentPeriodChallengeIds error:", e);
    return [];
  }
}

/** 최종 회고 작성용: 이번 달 신청 리추얼별 정량 요약 */
export async function getMyFinalReviewRoutineSummaries(): Promise<{
  data?: FinalReviewRoutineSummary[];
  error?: string;
}> {
  try {
    const [
      { challengeId, resetAt, error: cError },
      user,
      { period, error: pError },
    ] = await Promise.all([
      getCurrentChallengeId({ allowEnded: true }),
      getCurrentUser(),
      getActivePeriod(),
    ]);

    if (!user) return { error: "인증이 필요합니다." };
    if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };
    if (!period) return { error: pError ?? "활성 챌린지 기간이 없습니다." };

    const effectiveStart = getEffectiveStart(period.start_date, resetAt);
    const supabase = await createClient();

    const [registrationsRes, recordsRes, booksRes] = await Promise.all([
      supabase
        .from("challenge_registrations")
        .select("routine_type")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
      supabase
        .from("ritual_records")
        .select("routine_type, record_date, record_data")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .gte("record_date", effectiveStart)
        .lte("record_date", period.end_date),
      supabase
        .from("books")
        .select("routine_type, is_completed")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId),
    ]);

    if (registrationsRes.error) return { error: registrationsRes.error.message };
    if (recordsRes.error) return { error: recordsRes.error.message };
    if (booksRes.error) return { error: booksRes.error.message };

    const registeredTypes = new Set(
      (registrationsRes.data ?? []).map((row) => row.routine_type),
    );
    const records = (recordsRes.data ?? []) as {
      routine_type: RoutineTypeDB;
      record_date: string;
      record_data: unknown;
    }[];
    const books = (booksRes.data ?? []) as {
      routine_type: "reading" | "english_book";
      is_completed: boolean;
    }[];

    const summaries = ROUTINE_ORDER.filter((routineType) =>
      registeredTypes.has(routineType),
    ).map((routineType) =>
      getRoutineSummary({
        routineType,
        records: records.filter((record) => record.routine_type === routineType),
        books,
      }),
    );

    return { data: summaries };
  } catch (e) {
    console.error("getMyFinalReviewRoutineSummaries error:", e);
    return { error: "최종 회고 리추얼 요약 조회 중 오류가 발생했습니다." };
  }
}

/** 모든 사람의 최종 회고 목록 조회 (본인 포함) */
export async function getAllFinalReviews(): Promise<{
  data?: FinalReview[];
  currentUserId?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const challengeIds = await getCurrentPeriodChallengeIds();
    if (challengeIds.length === 0) return { error: "챌린지를 찾을 수 없습니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("final_reviews")
      .select(SELECT_COLUMNS)
      .in("challenge_id", challengeIds)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return {
      data: (data as unknown as FinalReviewRow[]).map(toFinalReview),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getAllFinalReviews error:", e);
    return { error: "최종 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 단건 조회 */
export async function getFinalReviewById(
  id: string,
): Promise<{ data?: FinalReview; currentUserId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("final_reviews")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .single();

    if (error) return { error: error.message };
    return {
      data: toFinalReview(data as unknown as FinalReviewRow),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getFinalReviewById error:", e);
    return { error: "최종 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 생성 */
export async function createFinalReview(input: {
  results: string;
  lifeChanges: string;
  continuationChoice: ContinuationChoice;
  adjustmentNote: string;
  feedback: string;
}): Promise<{ error?: string }> {
  try {
    const [{ challengeId, error: cError }, user] = await Promise.all([
      getCurrentChallengeId(),
      getCurrentUser(),
    ]);
    if (!user) return { error: "인증이 필요합니다." };
    if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

    const supabase = await createClient();
    const { error } = await supabase.from("final_reviews").insert({
      user_id: user.id,
      challenge_id: challengeId,
      results: input.results,
      life_changes: input.lifeChanges,
      continuation_choice: input.continuationChoice,
      adjustment_note: input.adjustmentNote,
      feedback: input.feedback,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("createFinalReview error:", e);
    return { error: "최종 회고 작성 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 수정 */
export async function updateFinalReview(
  id: string,
  input: {
    results?: string;
    lifeChanges?: string;
    continuationChoice?: ContinuationChoice;
    adjustmentNote?: string;
    feedback?: string;
  },
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const patch: {
      results?: string;
      life_changes?: string;
      continuation_choice?: ContinuationChoice;
      adjustment_note?: string;
      feedback?: string;
    } = {};
    if (input.results !== undefined) patch.results = input.results;
    if (input.lifeChanges !== undefined) patch.life_changes = input.lifeChanges;
    if (input.continuationChoice !== undefined)
      patch.continuation_choice = input.continuationChoice;
    if (input.adjustmentNote !== undefined)
      patch.adjustment_note = input.adjustmentNote;
    if (input.feedback !== undefined) patch.feedback = input.feedback;

    const supabase = await createClient();
    const { error } = await supabase
      .from("final_reviews")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("updateFinalReview error:", e);
    return { error: "최종 회고 수정 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 삭제 */
export async function deleteFinalReview(
  id: string,
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("final_reviews")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("deleteFinalReview error:", e);
    return { error: "최종 회고 삭제 중 오류가 발생했습니다." };
  }
}
