"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentChallengeId } from "@/lib/current-challenge";
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
  profiles: { name: string; emoji: string | null } | null;
}

function toDeclaration(row: DeclarationRow): Declaration {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.profiles?.name ?? "익명",
    userEmoji: row.profiles?.emoji ?? undefined,
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
    .select("id, user_id, routine_type, answers, created_at, profiles(name, emoji)")
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
  const { error } = await supabase.from("declarations").insert({
    user_id: user.id,
    challenge_id: challengeId,
    routine_type: input.routineType,
    answers: input.answers as unknown as Json,
  });

  if (error) return { error: error.message };
  return {};
}

/** 챌린저(같은 챌린지 팀원) 선언 목록 조회 */
export async function getChallengerDeclarations(): Promise<{
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
    .select("id, user_id, routine_type, answers, created_at, profiles(name, emoji)")
    .eq("challenge_id", challengeId)
    .neq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data: (data as unknown as DeclarationRow[]).map(toDeclaration) };
}
