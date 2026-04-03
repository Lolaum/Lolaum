"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json, RitualRecord, RoutineTypeDB } from "@/types/supabase";

export async function getRitualRecords(input: {
  challengeId: string;
  date?: string;
  routineType?: RoutineTypeDB;
}): Promise<{ data?: RitualRecord[]; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "인증이 필요합니다." };
  }

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
  return { data };
}

/** challengeId 자동 조회 후 기록 생성 (UI에서 직접 호출용) */
export async function createRitualRecordAuto(input: {
  routineType: RoutineTypeDB;
  recordDate: string;
  recordData: Json;
}): Promise<{ data?: RitualRecord; error?: string }> {
  const { getOrCreateCurrentChallenge } = await import("./challenge");
  const { challengeId, error: challengeError } =
    await getOrCreateCurrentChallenge();

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
  const { getOrCreateCurrentChallenge } = await import("./challenge");
  const { challengeId, error: challengeError } =
    await getOrCreateCurrentChallenge();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return getRitualRecords({
    challengeId,
    routineType: input.routineType,
    date: input.date,
  });
}
