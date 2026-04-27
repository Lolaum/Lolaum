"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentChallengeId } from "@/lib/current-challenge";
import type { Json, RitualRecord, RoutineTypeDB } from "@/types/supabase";

export async function getRitualRecords(input: {
  challengeId: string;
  date?: string;
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

  // 하루에 여러 기록 허용 (INSERT), 달성률은 Set으로 하루 1회만 인정
  const { data, error } = await supabase
    .from("ritual_records")
    .insert({
      user_id: user.id,
      challenge_id: input.challengeId,
      routine_type: input.routineType,
      record_date: input.recordDate,
      record_data: input.recordData,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // daily_completions 갱신: 등록된 리추얼 수 vs 해당 날짜 완료된 리추얼 수 비교
  const [registrationsRes, recordsRes] = await Promise.all([
    supabase
      .from("challenge_registrations")
      .select("routine_type")
      .eq("user_id", user.id)
      .eq("challenge_id", input.challengeId),
    supabase
      .from("ritual_records")
      .select("routine_type")
      .eq("user_id", user.id)
      .eq("challenge_id", input.challengeId)
      .eq("record_date", input.recordDate),
  ]);

  const totalRegistered = registrationsRes.data?.length ?? 0;
  const completedTypes = new Set(
    (recordsRes.data ?? []).map((r) => r.routine_type),
  );
  const totalCompleted = (registrationsRes.data ?? []).filter((r) =>
    completedTypes.has(r.routine_type),
  ).length;

  if (totalRegistered > 0) {
    await supabase.from("daily_completions").upsert(
      {
        user_id: user.id,
        challenge_id: input.challengeId,
        completion_date: input.recordDate,
        total_registered: totalRegistered,
        total_completed: totalCompleted,
      },
      { onConflict: "user_id,challenge_id,completion_date" },
    );
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

/** 내 기록 가져오기 (challengeId 자동) */
export async function getMyRitualRecords(input: {
  routineType?: RoutineTypeDB;
  date?: string;
}): Promise<{ data?: RitualRecord[]; error?: string }> {
  const { challengeId, error: challengeError } = await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return getRitualRecords({
    challengeId,
    routineType: input.routineType,
    date: input.date,
  });
}
