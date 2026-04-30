"use server";

import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Comment } from "@/types/feed";

/**
 * ritual_record_id에 대응하는 feed를 찾거나 생성한다.
 * feed_comments는 feeds(id)를 FK로 참조하므로 이 매핑이 필요.
 *
 * 일반 RLS 클라이언트로는 다른 유저의 ritual_record / feed에 접근할 수 없으므로
 * admin 클라이언트로 매핑만 처리한다(댓글 자체는 user_id = auth.uid() 검증을 받음).
 */
async function getOrCreateFeedId(
  recordId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  // 이미 있는 feed 찾기 (중복 row가 있어도 가장 오래된 것 1개만 사용)
  const { data: existingFeed } = await admin
    .from("feeds")
    .select("id")
    .eq("ritual_record_id", recordId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingFeed) return existingFeed.id;

  // 없으면 ritual_record 정보로 feed 생성 (record owner 명의)
  const { data: record } = await admin
    .from("ritual_records")
    .select("user_id, challenge_id, routine_type, record_date, record_data")
    .eq("id", recordId)
    .single();

  if (!record) return null;

  const { data: newFeed } = await admin
    .from("feeds")
    .insert({
      user_id: record.user_id,
      challenge_id: record.challenge_id,
      ritual_record_id: recordId,
      routine_type: record.routine_type,
      feed_date: record.record_date,
      feed_data: record.record_data ?? {},
    })
    .select("id")
    .single();

  return newFeed?.id ?? null;
}

/** 특정 ritual_record에 달린 댓글 목록 가져오기 */
export async function getComments(
  recordId: string,
): Promise<{ data: Comment[]; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: [], error: "인증이 필요합니다." };

    const admin = createAdminClient();

    // feed 찾기 (없으면 댓글도 없음). 중복 대비 가장 오래된 1개 사용.
    const { data: feed } = await admin
      .from("feeds")
      .select("id")
      .eq("ritual_record_id", recordId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!feed) return { data: [] };

    const { data: comments, error } = await admin
      .from("feed_comments")
      .select("id, user_id, text, created_at")
      .eq("feed_id", feed.id)
      .order("created_at", { ascending: true });

    if (error) return { data: [], error: error.message };
    if (!comments?.length) return { data: [] };

    // 프로필 이름 일괄 조회
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

    return {
      data: comments.map((c) => ({
        id: c.id as unknown as number,
        odOriginalId: c.id,
        userId: c.user_id as unknown as number,
        userName: nameMap.get(c.user_id) ?? "알 수 없음",
        text: c.text,
        date: c.created_at,
      })),
    };
  } catch (e) {
    console.error("getComments error:", e);
    return { data: [], error: "댓글 조회 중 오류가 발생했습니다." };
  }
}

/** 댓글 추가 */
export async function addComment(
  recordId: string,
  text: string,
): Promise<{ data?: Comment; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();

    const feedId = await getOrCreateFeedId(recordId, admin);
    if (!feedId) return { error: "피드를 찾을 수 없습니다." };

    const { data: comment, error } = await admin
      .from("feed_comments")
      .insert({
        feed_id: feedId,
        user_id: user.id,
        text,
      })
      .select("id, user_id, text, created_at")
      .single();

    if (error) return { error: error.message };

    // 프로필 이름 가져오기
    const { data: profile } = await admin
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    return {
      data: {
        id: comment.id as unknown as number,
        odOriginalId: comment.id,
        userId: comment.user_id as unknown as number,
        userName: profile?.name ?? "나",
        text: comment.text,
        date: comment.created_at,
      },
    };
  } catch (e) {
    console.error("addComment error:", e);
    return { error: "댓글 작성 중 오류가 발생했습니다." };
  }
}

/** 댓글 수정 */
export async function updateComment(
  commentId: string,
  text: string,
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();

    const { error } = await admin
      .from("feed_comments")
      .update({ text })
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("updateComment error:", e);
    return { error: "댓글 수정 중 오류가 발생했습니다." };
  }
}

/** 댓글 삭제 */
export async function deleteComment(
  commentId: string,
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const admin = createAdminClient();

    const { error } = await admin
      .from("feed_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("deleteComment error:", e);
    return { error: "댓글 삭제 중 오류가 발생했습니다." };
  }
}
