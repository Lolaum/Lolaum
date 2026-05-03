"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentChallengeId, getActivePeriod } from "@/lib/current-challenge";
import type {
  ContinuationChoice,
  FinalReview,
} from "@/types/routines/finalReview";

interface FinalReviewRow {
  id: string;
  user_id: string;
  results: string;
  life_changes: string;
  continuation_choice: ContinuationChoice;
  adjustment_note: string;
  feedback: string;
  created_at: string;
  profiles: { name: string; emoji: string | null; avatar_url: string | null } | null;
}

function toFinalReview(row: FinalReviewRow): FinalReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.profiles?.name ?? "익명",
    userEmoji: row.profiles?.emoji ?? undefined,
    avatarUrl: row.profiles?.avatar_url ?? undefined,
    results: row.results,
    lifeChanges: row.life_changes,
    continuationChoice: row.continuation_choice,
    adjustmentNote: row.adjustment_note,
    feedback: row.feedback,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS =
  "id, user_id, results, life_changes, continuation_choice, adjustment_note, feedback, created_at, profiles(name, emoji, avatar_url)";

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

/** 모든 사람의 최종 회고 목록 조회 (본인 포함) */
export async function getAllFinalReviews(): Promise<{
  data?: FinalReview[];
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
      .from("final_reviews")
      .select(SELECT_COLUMNS)
      .in("challenge_id", challengeIds)
      .order("created_at", { ascending: false });

    if (error) return { error: error.message };
    return {
      data: (data as unknown as FinalReviewRow[]).map(toFinalReview),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getAllFinalReviews error:", e);
    return { error: "최종 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 단건 조회 */
export async function getFinalReviewById(
  id: string,
): Promise<{ data?: FinalReview; currentUserId?: string; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("final_reviews")
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .single();

    if (error) return { error: error.message };
    return {
      data: toFinalReview(data as unknown as FinalReviewRow),
      currentUserId: user.id,
    };
  } catch (e) {
    console.error("getFinalReviewById error:", e);
    return { error: "최종 회고 조회 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 생성 */
export async function createFinalReview(input: {
  results: string;
  lifeChanges: string;
  continuationChoice: ContinuationChoice;
  adjustmentNote: string;
  feedback: string;
}): Promise<{ error?: string }> {
  try {
    const [{ challengeId, error: cError }, user] = await Promise.all([
      getCurrentChallengeId(),
      getCurrentUser(),
    ]);
    if (!user) return { error: "인증이 필요합니다." };
    if (!challengeId) return { error: cError ?? "챌린지를 찾을 수 없습니다." };

    const supabase = await createClient();
    const { error } = await supabase.from("final_reviews").insert({
      user_id: user.id,
      challenge_id: challengeId,
      results: input.results,
      life_changes: input.lifeChanges,
      continuation_choice: input.continuationChoice,
      adjustment_note: input.adjustmentNote,
      feedback: input.feedback,
    });

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("createFinalReview error:", e);
    return { error: "최종 회고 작성 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 수정 */
export async function updateFinalReview(
  id: string,
  input: {
    results?: string;
    lifeChanges?: string;
    continuationChoice?: ContinuationChoice;
    adjustmentNote?: string;
    feedback?: string;
  },
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const patch: {
      results?: string;
      life_changes?: string;
      continuation_choice?: ContinuationChoice;
      adjustment_note?: string;
      feedback?: string;
    } = {};
    if (input.results !== undefined) patch.results = input.results;
    if (input.lifeChanges !== undefined) patch.life_changes = input.lifeChanges;
    if (input.continuationChoice !== undefined)
      patch.continuation_choice = input.continuationChoice;
    if (input.adjustmentNote !== undefined)
      patch.adjustment_note = input.adjustmentNote;
    if (input.feedback !== undefined) patch.feedback = input.feedback;

    const supabase = await createClient();
    const { error } = await supabase
      .from("final_reviews")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("updateFinalReview error:", e);
    return { error: "최종 회고 수정 중 오류가 발생했습니다." };
  }
}

/** 최종 회고 삭제 */
export async function deleteFinalReview(
  id: string,
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("final_reviews")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("deleteFinalReview error:", e);
    return { error: "최종 회고 삭제 중 오류가 발생했습니다." };
  }
}
