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
  return { data: data ?? [] };
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
  const supabase = await createClient();

  const { error } = await supabase
    .from("challenge_registrations")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

/** 내 루틴 목록 가져오기 (challengeId 자동) */
export async function getMyRoutines(): Promise<{
  data?: ChallengeRegistration[];
  error?: string;
}> {
  const { challengeId, error: challengeError } =
    await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return getRoutines(challengeId);
}

/** 루틴 등록 (challengeId 자동) */
export async function createRoutineAuto(
  routineType: RoutineTypeDB,
): Promise<{ data?: ChallengeRegistration; error?: string }> {
  const { challengeId, error: challengeError } =
    await getCurrentChallengeId();

  if (!challengeId) {
    return { error: challengeError ?? "챌린지를 찾을 수 없습니다." };
  }

  return createRoutine({ challengeId, routineType });
}
