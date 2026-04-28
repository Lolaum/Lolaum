"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentChallengeId, getActivePeriod } from "@/lib/current-challenge";
import type { RoutineTypeDB, Json } from "@/types/supabase";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";
import type { Declaration, DeclarationAnswer } from "@/types/routines/declaration";
import type { RoutineType } from "@/types/routines/declaration";

interface DeclarationRow {
  id: string;
  user_id: string;
  routine_type: RoutineTypeDB;
  answers: unknown;
  created_at: string;
  profiles: { name: string; emoji: string | null; avatar_url: string | null } | null;
}

function toDeclaration(row: DeclarationRow): Declaration {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.profiles?.name ?? "익명",
    userEmoji: row.profiles?.emoji ?? undefined,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    routineType: ROUTINE_TYPE_LABEL[row.routine_type] as RoutineType,
    answers: row.answers as DeclarationAnswer[],
    createdAt: row.created_at,
  };
}

/** 내 선언 목록 조회 */
export async function getMyDeclarations(): Promise<{
  data?: Declaration[];
  error?: string;
}> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("declarations")
    .select("id, user_id, routine_type, answers, created_at, profiles(name, emoji, avatar_url)")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: (data as unknown as DeclarationRow[]).map(toDeclaration) };
}

/** 선언 생성 */
export async function createDeclaration(input: {
  routineType: RoutineTypeDB;
  answers: { questionId: string; answer: string }[];
}): Promise<{ error?: string }> {
  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase.from("declarations").upsert(
    {
      user_id: user.id,
      challenge_id: challengeId,
      routine_type: input.routineType,
      answers: input.answers as unknown as Json,
    },
    { onConflict: "user_id,challenge_id,routine_type" },
  );

  if (error) return { error: error.message };
  return {};
}

/** 활성 기간의 모든 챌린지 ID 조회 (유저별로 challenge 행이 다르므로 전체 조회) */
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

/** 챌린저(같은 챌린지 팀원) 선언 목록 조회 */
export async function getChallengerDeclarations(): Promise<{
  data?: Declaration[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const challengeIds = await getCurrentPeriodChallengeIds();
    if (challengeIds.length === 0) return { error: "챌린지를 찾을 수 없습니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("declarations")
      .select("id, user_id, routine_type, answers, created_at, profiles(name, emoji, avatar_url)")
      .in("challenge_id", challengeIds)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return { data: (data as unknown as DeclarationRow[]).map(toDeclaration) };
  } catch (e) {
    console.error("getChallengerDeclarations error:", e);
    return { error: "선언 목록 조회 중 오류가 발생했습니다." };
  }
}

/** 선언 단건 조회 */
export async function getDeclarationById(
  id: string,
): Promise<{ data?: Declaration; currentUserId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("declarations")
      .select("id, user_id, routine_type, answers, created_at, profiles(name, emoji, avatar_url)")
      .eq("id", id)
      .single();

    if (error) return { error: error.message };
    return {
      data: toDeclaration(data as unknown as DeclarationRow),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getDeclarationById error:", e);
    return { error: "선언 조회 중 오류가 발생했습니다." };
  }
}

/** 모든 사람의 선언 목록 조회 (본인 포함) */
export async function getAllDeclarations(): Promise<{
  data?: Declaration[];
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
      .from("declarations")
      .select("id, user_id, routine_type, answers, created_at, profiles(name, emoji, avatar_url)")
      .in("challenge_id", challengeIds)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return {
      data: (data as unknown as DeclarationRow[]).map(toDeclaration),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getAllDeclarations error:", e);
    return { error: "선언 목록 조회 중 오류가 발생했습니다." };
  }
}
