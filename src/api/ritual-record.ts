"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  getActivePeriod,
  getCurrentChallengeId,
  getEffectiveStart,
  isChallengePeriodEnded,
} from "@/lib/current-challenge";
import { getCurrentKoreaWeekRange } from "@/lib/current-week";
import { normalizeRecordDataImages } from "@/lib/record-data-images";
import { insertRitualCompletionNotifications } from "@/lib/notifications/insert";
import type { Json, RitualRecord, RoutineTypeDB } from "@/types/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };


const PHOTO_DUPLICATE_WINDOW_MINUTES = 10;
const PHOTO_DUPLICATE_MESSAGE =
  "사진 인증 리추얼은 10분 이내 중복 업로드할 수 없어요. 잠시 후 다시 시도해주세요.";

function hasPhotoCertification(recordData: Json): boolean {
  if (!recordData || typeof recordData !== "object" || Array.isArray(recordData)) {
    return false;
  }

  const data = recordData as Record<string, Json | undefined>;
  const photoFields = [data.certPhotos, data.images, data.image, data.screenshot];

  return photoFields.some((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) {
      return value.some((item) => typeof item === "string" && item.trim().length > 0);
    }
    return false;
  });
}

const ROUTINE_HOME_PATH: Record<RoutineTypeDB, string> = {
  morning: "/home/morning",
  exercise: "/home/exercise",
  reading: "/home/reading",
  english: "/home/english",
  second_language: "/home/second-language",
  recording: "/home/recording",
  finance: "/home/finance",
  english_book: "/home/english-book",
};

function revalidateRitualSurfaces(routineType?: RoutineTypeDB) {
  revalidatePath("/home");
  revalidatePath("/feeds");
  revalidatePath("/progress");
  revalidatePath("/ritual");
  if (routineType) {
    revalidatePath(ROUTINE_HOME_PATH[routineType]);
  }
}

function getRecordDataObject(recordData: Json): Record<string, unknown> {
  return recordData && typeof recordData === "object" && !Array.isArray(recordData)
    ? (recordData as Record<string, unknown>)
    : {};
}

function getRecordingReadEntryCount(recordData: Json): number {
  const data = getRecordDataObject(recordData);
  const entries = data.entries;

  if (Array.isArray(entries)) {
    return entries.filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry as Record<string, unknown>).type === "read",
    ).length;
  }

  return data.recordType === "read" ? 1 : 0;
}

async function getWeeklySpecialRitualCount(input: {
  supabase: SupabaseAnyClient;
  userId: string;
  challengeId: string;
  routineType: "exercise" | "recording";
  recordDate: string;
  excludeRecordId?: string;
}): Promise<{ count?: number; error?: string }> {
  const { start, end } = getCurrentKoreaWeekRange(input.recordDate);
  let query = input.supabase
    .from("ritual_records")
    .select("id, record_data")
    .eq("user_id", input.userId)
    .eq("challenge_id", input.challengeId)
    .eq("routine_type", input.routineType)
    .gte("record_date", start)
    .lte("record_date", end);

  if (input.excludeRecordId) {
    query = query.neq("id", input.excludeRecordId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  const count = (data ?? []).reduce(
    (sum: number, row: { record_data: Json }) => {
      const recordData = row.record_data;
      if (input.routineType === "exercise") {
        return (
          sum + (getRecordDataObject(recordData).recordType === "diet" ? 1 : 0)
        );
      }
      return sum + getRecordingReadEntryCount(recordData);
    },
    0,
  );

  return { count };
}

async function validateWeeklySpecialRitualLimit(input: {
  supabase: SupabaseAnyClient;
  userId: string;
  challengeId: string;
  routineType: RoutineTypeDB;
  recordDate: string;
  recordData: Json;
  excludeRecordId?: string;
}): Promise<{ error?: string }> {
  const isDietRecord =
    input.routineType === "exercise" &&
    getRecordDataObject(input.recordData).recordType === "diet";
  const readEntryCount =
    input.routineType === "recording"
      ? getRecordingReadEntryCount(input.recordData)
      : 0;

  if (!isDietRecord && readEntryCount === 0) return {};

  const routineType = isDietRecord ? "exercise" : "recording";
  const { count, error } = await getWeeklySpecialRitualCount({
    supabase: input.supabase,
    userId: input.userId,
    challengeId: input.challengeId,
    routineType,
    recordDate: input.recordDate,
    excludeRecordId: input.excludeRecordId,
  });
  if (error) return { error };

  const nextCount = (count ?? 0) + (isDietRecord ? 1 : readEntryCount);
  if (nextCount > 2) {
    return {
      error: isDietRecord
        ? "식단 기록은 주 2회까지만 선택할 수 있습니다."
        : "글 읽기 대체는 주 2회까지만 선택할 수 있습니다.",
    };
  }

  return {};
}

async function recomputeDailyCompletion(input: {
  supabase: SupabaseAnyClient;
  userId: string;
  challengeId: string;
  recordDate: string;
}) {
  const [registrationsRes, recordsRes] = await Promise.all([
    input.supabase
      .from("challenge_registrations")
      .select("routine_type")
      .eq("user_id", input.userId)
      .eq("challenge_id", input.challengeId),
    input.supabase
      .from("ritual_records")
      .select("routine_type")
      .eq("user_id", input.userId)
      .eq("challenge_id", input.challengeId)
      .eq("record_date", input.recordDate),
  ]);

  const registeredTypes = new Set(
    (registrationsRes.data ?? []).map(
      (r: { routine_type: RoutineTypeDB }) => r.routine_type,
    ),
  );
  const totalRegistered = registeredTypes.size;
  const completedTypes = new Set(
    (recordsRes.data ?? []).map(
      (r: { routine_type: RoutineTypeDB }) => r.routine_type,
    ),
  );
  const totalCompleted = Array.from(registeredTypes).filter((routineType) =>
    completedTypes.has(routineType),
  ).length;

  if (totalRegistered > 0) {
    await input.supabase.from("daily_completions").upsert(
      {
        user_id: input.userId,
        challenge_id: input.challengeId,
        completion_date: input.recordDate,
        total_registered: totalRegistered,
        total_completed: totalCompleted,
      },
      { onConflict: "user_id,challenge_id,completion_date" },
    );
  }
}

export async function getRitualRecords(input: {
  challengeId: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  routineType?: RoutineTypeDB;
}): Promise<{ data?: RitualRecord[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("ritual_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_id", input.challengeId);

  if (input.date) {
    query = query.eq("record_date", input.date);
  } else {
    if (input.dateFrom) {
      query = query.gte("record_date", input.dateFrom);
    }

    if (input.dateTo) {
      query = query.lte("record_date", input.dateTo);
    }
  }

  if (input.routineType) {
    query = query.eq("routine_type", input.routineType);
  }

  const { data, error } = await query.order("created_at", {
    ascending: true,
  });

  if (error) return { error: error.message };
  return { data: data ?? [] };
}

export async function createRitualRecord(input: {
  challengeId: string;
  routineType: RoutineTypeDB;
  recordDate: string;
  recordData: Json;
}): Promise<{ data?: RitualRecord; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const supabase = await createClient();
  const recordData = await normalizeRecordDataImages(input.recordData, user.id);
  const { error: limitError } = await validateWeeklySpecialRitualLimit({
    supabase,
    userId: user.id,
    challengeId: input.challengeId,
    routineType: input.routineType,
    recordDate: input.recordDate,
    recordData,
  });
  if (limitError) return { error: limitError };

  if (hasPhotoCertification(recordData)) {
    const duplicateSince = new Date(
      Date.now() - PHOTO_DUPLICATE_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();
    const { data: recentPhotoRecords, error: recentError } = await supabase
      .from("ritual_records")
      .select("id, record_data")
      .eq("user_id", user.id)
      .eq("challenge_id", input.challengeId)
      .eq("routine_type", input.routineType)
      .eq("record_date", input.recordDate)
      .gte("created_at", duplicateSince)
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentError) return { error: recentError.message };
    if ((recentPhotoRecords ?? []).some((r) => hasPhotoCertification(r.record_data as Json))) {
      return { error: PHOTO_DUPLICATE_MESSAGE };
    }
  }

  // 하루에 여러 기록 허용 (INSERT), 달성률은 Set으로 하루 1회만 인정
  const { data, error } = await supabase
    .from("ritual_records")
    .insert({
      user_id: user.id,
      challenge_id: input.challengeId,
      routine_type: input.routineType,
      record_date: input.recordDate,
      record_data: recordData,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await recomputeDailyCompletion({
    supabase,
    userId: user.id,
    challengeId: input.challengeId,
    recordDate: input.recordDate,
  });
  revalidateRitualSurfaces(input.routineType);

  // 관리자(롤라/지로)에게 리추얼 인증 완료 알림 발송
  if (data?.id) {
    await insertRitualCompletionNotifications({
      actorUserId: user.id,
      routineType: input.routineType,
      ritualRecordId: data.id,
    });
  }

  return { data };
}

/** challengeId 자동 조회 후 기록 생성 (UI에서 직접 호출용) */
export async function createRitualRecordAuto(input: {
  routineType: RoutineTypeDB;
  recordDate: string;
  recordData: Json;
}): Promise<{ data?: RitualRecord; error?: string }> {
  const { challengeId, error: challengeError } = await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return createRitualRecord({
    challengeId,
    routineType: input.routineType,
    recordDate: input.recordDate,
    recordData: input.recordData,
  });
}

/**
 * 기존 ritual_record 수정.
 * record_data만 갱신. 사진(certPhotos/images/image)은 호출 측에서 기존 값을 합쳐 보내야 한다.
 */
export async function updateRitualRecord(
  id: string,
  recordData: Json,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();
  const normalizedRecordData = await normalizeRecordDataImages(
    recordData,
    user.id,
  );

  const { data: target, error: fetchErr } = await supabase
    .from("ritual_records")
    .select("challenge_id, record_date, routine_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };
  if (!target) return { error: "기록을 찾을 수 없습니다." };

  const { error: limitError } = await validateWeeklySpecialRitualLimit({
    supabase,
    userId: user.id,
    challengeId: target.challenge_id,
    routineType: target.routine_type,
    recordDate: target.record_date,
    recordData: normalizedRecordData,
    excludeRecordId: id,
  });
  if (limitError) return { error: limitError };

  const { error } = await supabase
    .from("ritual_records")
    .update({ record_data: normalizedRecordData })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidateRitualSurfaces(target.routine_type);
  return {};
}

/**
 * ritual_record 삭제. 본인 기록만 삭제 가능.
 * 삭제 후 같은 (user, challenge, date)의 daily_completions 카운트를 재계산한다.
 */
export async function deleteRitualRecord(
  id: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  // 삭제 전에 challenge_id, record_date, routine_type 확인 (집계/캐시 갱신용)
  const { data: target, error: fetchErr } = await supabase
    .from("ritual_records")
    .select("id, challenge_id, record_date, routine_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchErr) return { error: fetchErr.message };
  if (!target) return { error: "기록을 찾을 수 없습니다." };

  const { error } = await supabase
    .from("ritual_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  await recomputeDailyCompletion({
    supabase,
    userId: user.id,
    challengeId: target.challenge_id,
    recordDate: target.record_date,
  });
  revalidateRitualSurfaces(target.routine_type);

  return {};
}

/** 내 기록 가져오기 (challengeId 자동) */
export async function getMyRitualRecords(input: {
  routineType?: RoutineTypeDB;
  date?: string;
  currentPeriodOnly?: boolean;
}): Promise<{ data?: RitualRecord[]; error?: string }> {
  const { period, error: periodError } = input.currentPeriodOnly
    ? await getActivePeriod()
    : { period: null, error: undefined };

  if (input.currentPeriodOnly) {
    if (!period)
      return { error: periodError ?? "활성 챌린지 기간이 없습니다." };
    if (isChallengePeriodEnded(period)) return { data: [] };
  }

  const {
    challengeId,
    resetAt,
    error: challengeError,
  } = await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return getRitualRecords({
    challengeId,
    routineType: input.routineType,
    date: input.date,
    dateFrom:
      input.currentPeriodOnly && period
        ? getEffectiveStart(period.start_date, resetAt)
        : undefined,
    dateTo: input.currentPeriodOnly && period ? period.end_date : undefined,
  });
}
