"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { getFeedReactions, toggleFeedReaction } from "@/api/feed-reaction";
import { FEED_LIKE_EMOJI } from "@/constants/feed-reactions";
import type { FeedReactionSummary } from "@/types/feed";

interface ReactionBarProps {
  recordId?: string;
  compact?: boolean;
  commentCount?: number;
  initialSummary?: FeedReactionSummary;
  commentHref?: string;
  onCommentClick?: () => void;
}

const EMPTY_SUMMARY: FeedReactionSummary = {
  reactions: [],
  totalCount: 0,
};
const SETUP_ERROR = "리액션 테이블이 아직 준비되지 않았습니다.";

export default function ReactionBar({
  recordId,
  compact = false,
  commentCount = 0,
  initialSummary,
  commentHref,
  onCommentClick,
}: ReactionBarProps) {
  const [summaryState, setSummaryState] = useState<{
    recordId?: string;
    summary?: FeedReactionSummary;
  }>(() => ({
    recordId,
    summary: undefined,
  }));
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasServerSummary = initialSummary != null;

  useEffect(() => {
    if (!recordId || hasServerSummary) return;

    let active = true;
    getFeedReactions(recordId).then(({ data, error }) => {
      if (!active) return;
      if (error === SETUP_ERROR) {
        setDisabledReason(error);
      }
      setSummaryState({ recordId, summary: data });
    });

    return () => {
      active = false;
    };
  }, [recordId, hasServerSummary]);

  const summary =
    summaryState.recordId === recordId && summaryState.summary
      ? summaryState.summary
      : (initialSummary ?? EMPTY_SUMMARY);

  const reactionMap = useMemo(
    () => new Map(summary.reactions.map((item) => [item.emoji, item])),
    [summary.reactions],
  );

  if (!recordId) return null;

  const toggleLikeSummary = (
    current: FeedReactionSummary,
  ): FeedReactionSummary => {
    const currentLike = current.reactions.find(
      (reaction) => reaction.emoji === FEED_LIKE_EMOJI,
    );
    const nextLiked = !(currentLike?.reactedByMe ?? false);
    const nextLikeCount = Math.max(
      0,
      (currentLike?.count ?? 0) + (nextLiked ? 1 : -1),
    );
    const reactions = current.reactions.filter(
      (reaction) => reaction.emoji !== FEED_LIKE_EMOJI,
    );

    if (nextLikeCount > 0) {
      reactions.unshift({
        emoji: FEED_LIKE_EMOJI,
        count: nextLikeCount,
        reactedByMe: nextLiked,
      });
    }

    return {
      reactions,
      totalCount: Math.max(0, current.totalCount + (nextLiked ? 1 : -1)),
    };
  };

  const handleToggle = () => {
    if (isPending) return;

    let previousSummary: FeedReactionSummary | null = null;
    setSummaryState((current) => {
      const currentSummary =
        current.recordId === recordId
          ? (current.summary ?? initialSummary ?? EMPTY_SUMMARY)
          : (initialSummary ?? EMPTY_SUMMARY);
      previousSummary = currentSummary;
      return {
        recordId,
        summary: toggleLikeSummary(currentSummary),
      };
    });
    setPendingEmoji(FEED_LIKE_EMOJI);
    startTransition(async () => {
      const { data, error } = await toggleFeedReaction(
        recordId,
        FEED_LIKE_EMOJI,
      );
      if (error) {
        if (error === SETUP_ERROR) {
          if (previousSummary) setSummaryState({ recordId, summary: previousSummary });
          setDisabledReason(error);
          alert(
            "좋아요 저장 테이블이 아직 준비되지 않았어요. Supabase SQL을 먼저 적용해주세요.",
          );
        } else if (error.startsWith("좋아요 알림 생성 실패")) {
          console.error("좋아요 알림 생성 실패:", error);
          alert(error);
        } else {
          if (previousSummary) setSummaryState({ recordId, summary: previousSummary });
          console.error("리액션 처리 실패:", error);
          alert(error);
        }
      }
      if (data && error !== SETUP_ERROR) {
        setSummaryState({ recordId, summary: data });
      }
      setPendingEmoji(null);
    });
  };

  const likeReaction = reactionMap.get(FEED_LIKE_EMOJI);
  const likeCount = likeReaction?.count ?? 0;
  const liked = likeReaction?.reactedByMe ?? false;
  const actionClass = `inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
    compact ? "md:text-xs" : "md:text-sm"
  }`;

  return (
    <div
      className={`w-full ${compact ? "text-xs" : "text-sm"}`}
      aria-label="게시글 리액션"
    >
      <div className="flex items-center justify-between gap-3 pb-2 text-xs font-medium text-gray-500">
        <span>좋아요 {likeCount}개</span>
        <span>댓글 {commentCount}개</span>
      </div>
      <div className="flex items-center gap-1 border-t border-gray-100 pt-1.5">
        <button
          type="button"
          onClick={handleToggle}
          aria-disabled={isPending}
          aria-pressed={liked}
          title={disabledReason ?? undefined}
          className={`${actionClass} ${
            liked
              ? "bg-amber-50 text-amber-600"
              : "text-gray-500 hover:bg-gray-50 active:bg-gray-100"
          }`}
        >
          <ThumbsUp
            className={`h-4 w-4 ${liked ? "fill-current" : ""}`}
            strokeWidth={2.2}
          />
          좋아요
          {pendingEmoji === FEED_LIKE_EMOJI && (
            <span className="sr-only">처리 중</span>
          )}
        </button>
        {commentHref ? (
          <Link
            href={commentHref}
            className={`${actionClass} text-gray-500 hover:bg-gray-50 active:bg-gray-100`}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            댓글
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCommentClick}
            className={`${actionClass} text-gray-500 hover:bg-gray-50 active:bg-gray-100`}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            댓글
          </button>
        )}
      </div>
    </div>
  );
}
