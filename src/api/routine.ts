"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActivePeriod,
  getCurrentChallengeId,
  isChallengePeriodEnded,
} from "@/lib/current-challenge";
import { deleteRegisteredRoutine, isUserDeactivatedForRitual } from "@/api/admin";
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

  const deactivation = await isUserDeactivatedForRitual(user.id);
  if (deactivation.deactivated) {
    return { error: "관리자에 의해 리추얼 추가가 비활성화된 계정입니다." };
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

  return { data };
}

export async function deleteRoutine(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  return deleteRegisteredRoutine({ registrationId: id });
}

/** 내 리추얼 목록 가져오기 (challengeId 자동) */
export async function getMyRoutines(): Promise<{
  data?: ChallengeRegistration[];
  error?: string;
}> {
  const { period, error: periodError } = await getActivePeriod();
  if (!period) return { error: periodError ?? "활성 챌린지 기간이 없습니다." };

  const { challengeId, error: challengeError } = await getCurrentChallengeId({
    allowEnded: true,
  });

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return getRoutines(challengeId);
}

/** 리추얼 등록 (challengeId 자동) */
export async function createRoutineAuto(
  routineType: RoutineTypeDB,
): Promise<{ data?: ChallengeRegistration; error?: string }> {
  const { period, error: periodError } = await getActivePeriod();
  if (!period) return { error: periodError ?? "활성 챌린지 기간이 없습니다." };
  if (isChallengePeriodEnded(period)) {
    return { error: "챌린지 기간이 종료되었습니다." };
  }

  const { challengeId, error: challengeError } = await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return createRoutine({ challengeId, routineType });
}

/**
 * 이번 챌린지 "다시 시작".
 * - challenges.reset_at = 오늘 (이후 진행률은 이 날짜부터 집계)
 * - 등록한 리추얼(challenge_registrations)과 선언(declarations) 삭제
 * - ritual_records 는 보존 → "나의 리추얼 기록"에서 계속 조회 가능
 *
 * 신청 리추얼 삭제는 관리자만 수행할 수 있으므로 사용자 액션에서는 중단한다.
 */
export async function resetChallenge(): Promise<{
  success?: boolean;
  error?: string;
}> {
  return { error: "신청 리추얼 삭제는 관리자만 할 수 있습니다." };
}


export async function getChallengerRoutines(userId: string): Promise<{
  data?: RoutineTypeDB[];
  error?: string;
}> {
  const viewer = await getCurrentUser();
  if (!viewer) return { error: "인증이 필요합니다." };

  const { period, error: periodError } = await getActivePeriod();
  if (!period) return { error: periodError ?? "활성 챌린지 기간이 없습니다." };

  const admin = createAdminClient();
  const { data: challenges, error: challengeError } = await admin
    .from("challenges")
    .select("id")
    .eq("user_id", userId)
    .eq("period_id", period.id);

  if (challengeError) return { error: challengeError.message };
  const challengeIds = (challenges ?? []).map((challenge) => challenge.id);
  if (challengeIds.length === 0) return { data: [] };

  const { data, error } = await admin
    .from("challenge_registrations")
    .select("routine_type, registered_at")
    .eq("user_id", userId)
    .in("challenge_id", challengeIds)
    .order("registered_at", { ascending: true });

  if (error) return { error: error.message };

  const seen = new Set<RoutineTypeDB>();
  for (const row of data ?? []) {
    seen.add(row.routine_type as RoutineTypeDB);
  }

  return { data: [...seen] };
}
