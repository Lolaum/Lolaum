"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentChallengeId } from "@/lib/current-challenge";
import type { RoutineTypeDB, Json } from "@/types/supabase";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";
import type {
  MidReview,
  MidReviewCondition,
  RoutineType,
} from "@/types/routines/midReview";

interface MidReviewRow {
  id: string;
  user_id: string;
  routine_type: RoutineTypeDB;
  good_conditions: string[];
  good_condition_details: unknown;
  hard_conditions: string[];
  hard_condition_details: unknown;
  why_started: string;
  keep_doing: string;
  will_change: string;
  created_at: string;
  profiles: { name: string; emoji: string | null } | null;
}

function toMidReview(row: MidReviewRow): MidReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.profiles?.name ?? "익명",
    userEmoji: row.profiles?.emoji ?? undefined,
    routineType: ROUTINE_TYPE_LABEL[row.routine_type] as RoutineType,
    goodConditions: row.good_conditions as MidReviewCondition[],
    goodConditionDetails:
      (row.good_condition_details as Partial<
        Record<MidReviewCondition, string>
      >) ?? {},
    hardConditions: row.hard_conditions as MidReviewCondition[],
    hardConditionDetails:
      (row.hard_condition_details as Partial<
        Record<MidReviewCondition, string>
      >) ?? {},
    whyStarted: row.why_started,
    keepDoing: row.keep_doing,
    willChange: row.will_change,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS =
  "id, user_id, routine_type, good_conditions, good_condition_details, hard_conditions, hard_condition_details, why_started, keep_doing, will_change, created_at, profiles(name, emoji)";

/** 중간 회고 작성 가능 기간 검증 (매월 10~13일) */
function assertWritableWindow(): string | null {
  const day = new Date().getDate();
  if (day < 10 || day > 13) {
    return "중간 회고는 매월 10~13일에만 작성/수정할 수 있습니다.";
  }
  return null;
}

/** 내 중간 회고 목록 조회 */
export async function getMyMidReviews(): Promise<{
  data?: MidReview[];
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
    .from("mid_reviews")
    .select(SELECT_COLUMNS)
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: (data as unknown as MidReviewRow[]).map(toMidReview) };
}

/** 챌린저(같은 챌린지 팀원) 중간 회고 목록 조회 */
export async function getChallengerMidReviews(): Promise<{
  data?: MidReview[];
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
    .from("mid_reviews")
    .select(SELECT_COLUMNS)
    .eq("challenge_id", challengeId)
    .neq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { data: (data as unknown as MidReviewRow[]).map(toMidReview) };
}

/** 중간 회고 생성 */
export async function createMidReview(input: {
  routineType: RoutineTypeDB;
  goodConditions: MidReviewCondition[];
  goodConditionDetails: Partial<Record<MidReviewCondition, string>>;
  hardConditions: MidReviewCondition[];
  hardConditionDetails: Partial<Record<MidReviewCondition, string>>;
  whyStarted: string;
  keepDoing: string;
  willChange: string;
}): Promise<{ error?: string }> {
  const windowError = assertWritableWindow();
  if (windowError) return { error: windowError };

  const [{ challengeId, error: cError }, user] = await Promise.all([
    getCurrentChallengeId(),
    getCurrentUser(),
  ]);
  if (!user) return { error: "인증이 필요합니다." };
  if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

  const supabase = await createClient();
  const { error } = await supabase.from("mid_reviews").insert({
    user_id: user.id,
    challenge_id: challengeId,
    routine_type: input.routineType,
    good_conditions: input.goodConditions,
    good_condition_details: input.goodConditionDetails as unknown as Json,
    hard_conditions: input.hardConditions,
    hard_condition_details: input.hardConditionDetails as unknown as Json,
    why_started: input.whyStarted,
    keep_doing: input.keepDoing,
    will_change: input.willChange,
  });

  if (error) return { error: error.message };
  return {};
}

/** 중간 회고 수정 */
export async function updateMidReview(
  id: string,
  input: {
    goodConditions?: MidReviewCondition[];
    goodConditionDetails?: Partial<Record<MidReviewCondition, string>>;
    hardConditions?: MidReviewCondition[];
    hardConditionDetails?: Partial<Record<MidReviewCondition, string>>;
    whyStarted?: string;
    keepDoing?: string;
    willChange?: string;
  },
): Promise<{ error?: string }> {
  const windowError = assertWritableWindow();
  if (windowError) return { error: windowError };

  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const patch: Record<string, unknown> = {};
  if (input.goodConditions !== undefined)
    patch.good_conditions = input.goodConditions;
  if (input.goodConditionDetails !== undefined)
    patch.good_condition_details = input.goodConditionDetails as unknown as Json;
  if (input.hardConditions !== undefined)
    patch.hard_conditions = input.hardConditions;
  if (input.hardConditionDetails !== undefined)
    patch.hard_condition_details = input.hardConditionDetails as unknown as Json;
  if (input.whyStarted !== undefined) patch.why_started = input.whyStarted;
  if (input.keepDoing !== undefined) patch.keep_doing = input.keepDoing;
  if (input.willChange !== undefined) patch.will_change = input.willChange;

  const supabase = await createClient();
  const { error } = await supabase
    .from("mid_reviews")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/** 중간 회고 삭제 */
export async function deleteMidReview(
  id: string,
): Promise<{ error?: string }> {
  const windowError = assertWritableWindow();
  if (windowError) return { error: windowError };

  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mid_reviews")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
