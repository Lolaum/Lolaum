"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";
import { FEED_LIKE_EMOJI } from "@/constants/feed-reactions";
import { insertLikeNotification } from "@/lib/notifications/insert";
import type { FeedReactionSummary } from "@/types/feed";

const REACTION_SETUP_ERROR = "리액션 테이블이 아직 준비되지 않았습니다.";

class ReactionTableMissingError extends Error {
  constructor() {
    super(REACTION_SETUP_ERROR);
  }
}

function isMissingReactionTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "PGRST205" ||
    maybeError.code === "42P01" ||
    maybeError.message?.includes("feed_reactions") === true
  );
}

function emptySummary(): FeedReactionSummary {
  return { reactions: [], totalCount: 0 };
}

async function findFeedId(
  recordId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  const { data: feed } = await admin
    .from("feeds")
    .select("id")
    .eq("ritual_record_id", recordId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return feed?.id ?? null;
}

async function getOrCreateFeedId(
  recordId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  const existingFeedId = await findFeedId(recordId, admin);
  if (existingFeedId) return existingFeedId;

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

async function buildReactionSummary(
  feedId: string,
  currentUserId: string,
  admin: ReturnType<typeof createAdminClient>,
): Promise<FeedReactionSummary> {
  const { data: rows, error } = await admin
    .from("feed_reactions")
    .select("emoji, user_id")
    .eq("feed_id", feedId);

  if (isMissingReactionTableError(error)) {
    throw new ReactionTableMissingError();
  }
  if (error || !rows?.length) return emptySummary();

  const byEmoji = new Map<string, { count: number; reactedByMe: boolean }>();
  rows.forEach((row) => {
    const current = byEmoji.get(row.emoji) ?? {
      count: 0,
      reactedByMe: false,
    };
    current.count += 1;
    if (row.user_id === currentUserId) current.reactedByMe = true;
    byEmoji.set(row.emoji, current);
  });

  const like = byEmoji.get(FEED_LIKE_EMOJI);
  const reactions: FeedReactionSummary["reactions"] = like
    ? [
        {
          emoji: FEED_LIKE_EMOJI,
          count: like.count,
          reactedByMe: like.reactedByMe,
        },
      ]
    : [];

  return {
    reactions,
    totalCount: rows.length,
  };
}

export async function getFeedReactions(
  recordId: string,
): Promise<{ data: FeedReactionSummary; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: emptySummary(), error: "인증이 필요합니다." };

    const admin = createAdminClient();
    const feedId = await findFeedId(recordId, admin);
    if (!feedId) return { data: emptySummary() };

    return { data: await buildReactionSummary(feedId, user.id, admin) };
  } catch (e) {
    if (e instanceof ReactionTableMissingError) {
      return { data: emptySummary(), error: REACTION_SETUP_ERROR };
    }
    console.error("getFeedReactions error:", e);
    return {
      data: emptySummary(),
      error: "리액션 조회 중 오류가 발생했습니다.",
    };
  }
}

export async function toggleFeedReaction(
  recordId: string,
  emoji: string,
): Promise<{ data?: FeedReactionSummary; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };
    if (emoji !== FEED_LIKE_EMOJI)
      return { error: "지원하지 않는 리액션입니다." };

    const admin = createAdminClient();
    const feedId = await getOrCreateFeedId(recordId, admin);
    if (!feedId) return { error: "피드를 찾을 수 없습니다." };

    const { data: existing, error: selectError } = await admin
      .from("feed_reactions")
      .select("id")
      .eq("feed_id", feedId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();

    if (isMissingReactionTableError(selectError)) {
      return { data: emptySummary(), error: REACTION_SETUP_ERROR };
    }

    if (existing) {
      const { error } = await admin
        .from("feed_reactions")
        .delete()
        .eq("id", existing.id)
        .eq("user_id", user.id);

      if (error) return { error: error.message };
    } else {
      const { error } = await admin.from("feed_reactions").insert({
        feed_id: feedId,
        user_id: user.id,
        emoji,
      });

      if (error) return { error: error.message };

      if (emoji === FEED_LIKE_EMOJI) {
        const { data: feedOwner } = await admin
          .from("feeds")
          .select("user_id, routine_type, ritual_record_id")
          .eq("id", feedId)
          .single();

        if (feedOwner) {
          const { error: notificationError } = await insertLikeNotification({
            recipientUserId: feedOwner.user_id,
            actorUserId: user.id,
            routineType: feedOwner.routine_type,
            feedId,
            ritualRecordId: feedOwner.ritual_record_id,
          });

          if (notificationError) {
            return {
              data: await buildReactionSummary(feedId, user.id, admin),
              error: `좋아요 알림 생성 실패: ${notificationError}`,
            };
          }
        }
      }
    }

    return { data: await buildReactionSummary(feedId, user.id, admin) };
  } catch (e) {
    if (e instanceof ReactionTableMissingError) {
      return { data: emptySummary(), error: REACTION_SETUP_ERROR };
    }
    console.error("toggleFeedReaction error:", e);
    return { error: "리액션 처리 중 오류가 발생했습니다." };
  }
}
