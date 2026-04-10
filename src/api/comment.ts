"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Comment } from "@/types/feed";

/**
 * ritual_record_id에 대응하는 feed를 찾거나 생성한다.
 * feed_comments는 feeds(id)를 FK로 참조하므로 이 매핑이 필요.
 */
async function getOrCreateFeedId(
  recordId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  // 이미 있는 feed 찾기
  const { data: existingFeed } = await supabase
    .from("feeds")
    .select("id")
    .eq("ritual_record_id", recordId)
    .single();

  if (existingFeed) return existingFeed.id;

  // 없으면 ritual_record 정보로 feed 생성
  const { data: record } = await supabase
    .from("ritual_records")
    .select("user_id, challenge_id, routine_type, record_date, record_data")
    .eq("id", recordId)
    .single();

  if (!record) return null;

  const { data: newFeed } = await supabase
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
  const user = await getCurrentUser();
  if (!user) return { data: [], error: "인증이 필요합니다." };

  const supabase = await createClient();

  // feed 찾기 (없으면 댓글도 없음)
  const { data: feed } = await supabase
    .from("feeds")
    .select("id")
    .eq("ritual_record_id", recordId)
    .single();

  if (!feed) return { data: [] };

  const { data: comments, error } = await supabase
    .from("feed_comments")
    .select("id, user_id, text, created_at")
    .eq("feed_id", feed.id)
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  if (!comments?.length) return { data: [] };

  // 프로필 이름 일괄 조회
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
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
}

/** 댓글 추가 */
export async function addComment(
  recordId: string,
  text: string,
): Promise<{ data?: Comment; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const feedId = await getOrCreateFeedId(recordId, supabase);
  if (!feedId) return { error: "피드를 찾을 수 없습니다." };

  const { data: comment, error } = await supabase
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
  const { data: profile } = await supabase
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
}

/** 댓글 수정 */
export async function updateComment(
  commentId: string,
  text: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("feed_comments")
    .update({ text })
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

/** 댓글 삭제 */
export async function deleteComment(
  commentId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("feed_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
