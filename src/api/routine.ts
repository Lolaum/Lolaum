"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentChallengeId } from "@/lib/current-challenge";
import type { ChallengeRegistration, RoutineTypeDB } from "@/types/supabase";

export async function getRoutines(
  challengeId: string,
): Promise<{ data?: ChallengeRegistration[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("challenge_registrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .order("registered_at", { ascending: true });

  if (error) return { error: error.message };

  // routine_type 중복 제거 (먼저 등록된 것만 유지)
  const seen = new Set<string>();
  const unique = (data ?? []).filter((r) => {
    if (seen.has(r.routine_type)) return false;
    seen.add(r.routine_type);
    return true;
  });

  return { data: unique };
}

export async function createRoutine(input: {
  challengeId: string;
  routineType: RoutineTypeDB;
}): Promise<{ data?: ChallengeRegistration; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const supabase = await createClient();

  // 이미 등록된 리추얼인지 확인
  const { data: existing } = await supabase
    .from("challenge_registrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("challenge_id", input.challengeId)
    .eq("routine_type", input.routineType)
    .maybeSingle();

  if (existing) {
    return { error: "이미 등록된 리추얼입니다." };
  }

  // 이 챌린지에 대한 첫 리추얼 등록인지 확인
  const { count: priorCount } = await supabase
    .from("challenge_registrations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("challenge_id", input.challengeId);

  const isFirstRegistration = (priorCount ?? 0) === 0;

  const { data, error } = await supabase
    .from("challenge_registrations")
    .insert({
      user_id: user.id,
      challenge_id: input.challengeId,
      routine_type: input.routineType,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // 첫 등록이면 챌린지 start_date 를 오늘(로컬 날짜)로 갱신
  if (isFirstRegistration) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    await supabase
      .from("challenges")
      .update({ start_date: `${y}-${m}-${d}` })
      .eq("id", input.challengeId);
  }

  return { data };
}

export async function deleteRoutine(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: registration, error: fetchError } = await supabase
    .from("challenge_registrations")
    .select("user_id, challenge_id, routine_type")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase
    .from("challenge_registrations")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  if (registration) {
    await supabase
      .from("declarations")
      .delete()
      .eq("user_id", registration.user_id)
      .eq("challenge_id", registration.challenge_id)
      .eq("routine_type", registration.routine_type);
  }

  return { success: true };
}

/** 내 리추얼 목록 가져오기 (challengeId 자동) */
export async function getMyRoutines(): Promise<{
  data?: ChallengeRegistration[];
  error?: string;
}> {
  const { challengeId, error: challengeError } = await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return getRoutines(challengeId);
}

/** 리추얼 등록 (challengeId 자동) */
export async function createRoutineAuto(
  routineType: RoutineTypeDB,
): Promise<{ data?: ChallengeRegistration; error?: string }> {
  const { challengeId, error: challengeError } = await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return createRoutine({ challengeId, routineType });
}
