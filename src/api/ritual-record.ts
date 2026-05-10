"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  getActivePeriod,
  getCurrentChallengeId,
  getEffectiveStart,
  isChallengePeriodEnded,
} from "@/lib/current-challenge";
import { normalizeRecordDataImages } from "@/lib/record-data-images";
import type { Json, RitualRecord, RoutineTypeDB } from "@/types/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };

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
        is_fully_complete: totalCompleted >= totalRegistered,
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
  const { error } = await supabase
    .from("ritual_records")
    .update({ record_data: normalizedRecordData })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
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
