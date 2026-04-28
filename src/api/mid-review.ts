"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentChallengeId, getActivePeriod } from "@/lib/current-challenge";
import type { Json } from "@/types/supabase";
import type { MidReview, MidReviewCondition } from "@/types/routines/midReview";

interface MidReviewRow {
  id: string;
  user_id: string;
  good_conditions: string[];
  good_condition_details: unknown;
  hard_conditions: string[];
  hard_condition_details: unknown;
  why_started: string;
  keep_doing: string;
  will_change: string;
  created_at: string;
  profiles: { name: string; emoji: string | null; avatar_url: string | null } | null;
}

function toMidReview(row: MidReviewRow): MidReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.profiles?.name ?? "익명",
    userEmoji: row.profiles?.emoji ?? undefined,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
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
  "id, user_id, good_conditions, good_condition_details, hard_conditions, hard_condition_details, why_started, keep_doing, will_change, created_at, profiles(name, emoji, avatar_url)";

/** 내 중간 회고 목록 조회 */
export async function getMyMidReviews(): Promise<{
  data?: MidReview[];
  error?: string;
}> {
  try {
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
  } catch (e) {
    console.error("getMyMidReviews error:", e);
    return { error: "중간 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 활성 기간의 모든 챌린지 ID 조회 */
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

/** 챌린저(같은 챌린지 팀원) 중간 회고 목록 조회 */
export async function getChallengerMidReviews(): Promise<{
  data?: MidReview[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const challengeIds = await getCurrentPeriodChallengeIds();
    if (challengeIds.length === 0) return { error: "챌린지를 찾을 수 없습니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("mid_reviews")
      .select(SELECT_COLUMNS)
      .in("challenge_id", challengeIds)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return { data: (data as unknown as MidReviewRow[]).map(toMidReview) };
  } catch (e) {
    console.error("getChallengerMidReviews error:", e);
    return { error: "중간 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 모든 사람의 중간 회고 목록 조회 (본인 포함) */
export async function getAllMidReviews(): Promise<{
  data?: MidReview[];
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
      .from("mid_reviews")
      .select(SELECT_COLUMNS)
      .in("challenge_id", challengeIds)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return {
      data: (data as unknown as MidReviewRow[]).map(toMidReview),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getAllMidReviews error:", e);
    return { error: "중간 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 중간 회고 단건 조회 */
export async function getMidReviewById(
  id: string,
): Promise<{ data?: MidReview; currentUserId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("mid_reviews")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .single();

    if (error) return { error: error.message };
    return {
      data: toMidReview(data as unknown as MidReviewRow),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getMidReviewById error:", e);
    return { error: "중간 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 중간 회고 생성 */
export async function createMidReview(input: {
  goodConditions: MidReviewCondition[];
  goodConditionDetails: Partial<Record<MidReviewCondition, string>>;
  hardConditions: MidReviewCondition[];
  hardConditionDetails: Partial<Record<MidReviewCondition, string>>;
  whyStarted: string;
  keepDoing: string;
  willChange: string;
}): Promise<{ error?: string }> {
  try {
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
  } catch (e) {
    console.error("createMidReview error:", e);
    return { error: "중간 회고 작성 중 오류가 발생했습니다." };
  }
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
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const patch: {
      good_conditions?: string[];
      good_condition_details?: Json;
      hard_conditions?: string[];
      hard_condition_details?: Json;
      why_started?: string;
      keep_doing?: string;
      will_change?: string;
    } = {};
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
  } catch (e) {
    console.error("updateMidReview error:", e);
    return { error: "중간 회고 수정 중 오류가 발생했습니다." };
  }
}

/** 중간 회고 삭제 */
export async function deleteMidReview(
  id: string,
): Promise<{ error?: string }> {
  try {
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
  } catch (e) {
    console.error("deleteMidReview error:", e);
    return { error: "중간 회고 삭제 중 오류가 발생했습니다." };
  }
}
