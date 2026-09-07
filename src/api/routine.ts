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

import { MORNING_START_TIME, MORNING_END_TIME } from "@/constants/morning";
import { revalidatePath } from "next/cache";

function isRoutineTypeConstraintError(error: { message?: string; code?: string }) {
  return (
    error.code === "23514" &&
    /challenge_registrations_routine_type_check/i.test(error.message ?? "")
  );
}

function orderRoutinesByTime<T extends ChallengeRegistration>(routines: T[]): T[] {
  return [...routines].sort((a, b) => {
    const aTime = a.routine_start_time ?? "99:99:99";
    const bTime = b.routine_start_time ?? "99:99:99";
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return a.registered_at.localeCompare(b.registered_at);
  });
}

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
    .order("routine_start_time", { ascending: true, nullsFirst: false })
    .order("registered_at", { ascending: true });

  if (error) return { error: error.message };

  // routine_type 중복 제거 (먼저 등록된 것만 유지)
  const seen = new Set<string>();
  const unique = (data ?? []).filter((r) => {
    if (seen.has(r.routine_type)) return false;
    seen.add(r.routine_type);
    return true;
  });

  return { data: orderRoutinesByTime(unique) };
}

export async function createRoutine(input: {
  challengeId: string;
  routineType: RoutineTypeDB;
  routineStartTime?: string | null;
  routineEndTime?: string | null;
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
      routine_start_time: input.routineType === "morning" ? MORNING_START_TIME : input.routineStartTime ?? null,
      routine_end_time: input.routineType === "morning" ? MORNING_END_TIME : input.routineEndTime ?? null,
    })
    .select()
    .single();

  if (error) {
    if (isRoutineTypeConstraintError(error)) {
      return {
        error:
          "DB의 리추얼 타입 제약에 이 리추얼이 아직 추가되지 않았습니다. 관리자에게 routine_type 체크 제약 업데이트를 요청해주세요.",
      };
    }
    return { error: error.message };
  }

  return { data };
}

/** 선언 시 등록한 리추얼 시간 수정 (본인의 현재 챌린지만). */
export async function updateRoutineTime(input: {
  registrationId: string;
  routineStartTime: string;
  routineEndTime: string;
}): Promise<{ data?: ChallengeRegistration; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (
    !input.registrationId ||
    !timePattern.test(input.routineStartTime) ||
    !timePattern.test(input.routineEndTime)
  ) {
    return { error: "시작 시간과 종료 시간을 올바르게 입력해주세요." };
  }
  if (input.routineStartTime === input.routineEndTime) {
    return { error: "시작 시간과 종료 시간을 다르게 설정해주세요." };
  }

  const { challengeId, error: challengeError } = await getCurrentChallengeId();
  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  // 사용자 클라이언트의 UPDATE 정책에 의존하지 않도록 서버에서 저장한다.
  // 관리자 권한을 사용하므로 아래 본인·현재 챌린지 필터를 반드시 유지한다.
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("challenge_registrations")
    .update({
      routine_start_time: input.routineStartTime,
      routine_end_time: input.routineEndTime,
    })
    .eq("id", input.registrationId)
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .neq("routine_type", "morning")
    .select()
    .maybeSingle();

  if (error) return { error: "시간을 저장하지 못했습니다. 다시 시도해주세요." };
  if (!data) return { error: "시간을 수정할 수 있는 리추얼을 찾을 수 없습니다." };

  revalidatePath("/home");
  revalidatePath("/declaration/[id]", "page");
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
  timeRange?: {
    routineStartTime?: string | null;
    routineEndTime?: string | null;
  },
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

  return createRoutine({
    challengeId,
    routineType,
    routineStartTime: timeRange?.routineStartTime,
    routineEndTime: timeRange?.routineEndTime,
  });
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
