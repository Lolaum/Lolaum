"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronUp, MessageCircle, ThumbsUp } from "lucide-react";
import {
  getFeedReactionUsers,
  getFeedReactions,
  toggleFeedReaction,
} from "@/api/feed-reaction";
import { FEED_LIKE_EMOJI } from "@/constants/feed-reactions";
import type { FeedReactionSummary, FeedReactionUser } from "@/types/feed";

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
  const [likerState, setLikerState] = useState<{
    recordId?: string;
    open: boolean;
    loading: boolean;
    users: FeedReactionUser[];
    error?: string;
  }>({ open: false, loading: false, users: [] });
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
          if (previousSummary)
            setSummaryState({ recordId, summary: previousSummary });
          setDisabledReason(error);
          alert(
            "좋아요 저장 테이블이 아직 준비되지 않았어요. Supabase SQL을 먼저 적용해주세요.",
          );
        } else if (error.startsWith("좋아요 알림 생성 실패")) {
          console.error("좋아요 알림 생성 실패:", error);
          alert(error);
        } else {
          if (previousSummary)
            setSummaryState({ recordId, summary: previousSummary });
          console.error("리액션 처리 실패:", error);
          alert(error);
        }
      }
      if (data && error !== SETUP_ERROR) {
        setSummaryState({ recordId, summary: data });
        if (visibleLikerState.open) {
          await loadLikers(true);
        }
      }
      setPendingEmoji(null);
    });
  };

  const likeReaction = reactionMap.get(FEED_LIKE_EMOJI);
  const likeCount = likeReaction?.count ?? 0;
  const liked = likeReaction?.reactedByMe ?? false;
  const visibleLikerState =
    likerState.recordId === recordId
      ? likerState
      : { open: false, loading: false, users: [] as FeedReactionUser[] };
  const actionClass = `inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${
    compact ? "md:text-xs" : "md:text-sm"
  }`;

  const loadLikers = async (closeWhenEmpty = false) => {
    setLikerState((current) => ({
      recordId,
      open: current.recordId === recordId ? current.open : true,
      loading: true,
      users: current.recordId === recordId ? current.users : [],
    }));

    const { data, error } = await getFeedReactionUsers(recordId);
    setLikerState((current) => {
      if (current.recordId !== recordId || !current.open) return current;
      return {
        recordId,
        open: closeWhenEmpty && data.length === 0 ? false : true,
        loading: false,
        users: data,
        error,
      };
    });
  };

  const handleLikerToggle = () => {
    if (likeCount === 0) return;
    if (visibleLikerState.open) {
      setLikerState((current) => ({ ...current, open: false }));
      return;
    }

    setLikerState({
      recordId,
      open: true,
      loading: true,
      users: visibleLikerState.users,
    });
    void loadLikers();
  };

  return (
    <div
      className={`w-full ${compact ? "text-xs" : "text-sm"}`}
      aria-label="게시글 리액션"
    >
      <div className="flex items-center justify-between gap-3 pb-2 text-xs font-medium text-gray-500">
        <button
          type="button"
          onClick={handleLikerToggle}
          disabled={likeCount === 0}
          aria-expanded={visibleLikerState.open}
          aria-controls={`likers-${recordId}`}
          className="-my-2 inline-flex min-h-10 items-center gap-1 rounded-lg py-2 pr-2 text-left transition-colors hover:text-gray-800 disabled:cursor-default disabled:text-gray-400"
        >
          좋아요 {likeCount}개
          {visibleLikerState.open && <ChevronUp className="h-3.5 w-3.5" />}
        </button>
        <span>댓글 {commentCount}개</span>
      </div>
      {visibleLikerState.open && (
        <div
          id={`likers-${recordId}`}
          className="mb-2 overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
        >
          {visibleLikerState.loading && visibleLikerState.users.length === 0 ? (
            <div
              className="space-y-2 px-3 py-3"
              aria-label="좋아요 사용자 불러오는 중"
            >
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-2.5"
                >
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : visibleLikerState.error ? (
            <p className="px-3 py-3 text-xs text-red-500">
              좋아요 목록을 불러오지 못했습니다.
            </p>
          ) : visibleLikerState.users.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">
              아직 좋아요를 누른 사람이 없습니다.
            </p>
          ) : (
            <ul className="max-h-44 overflow-y-auto py-1.5">
              {visibleLikerState.users.map((reactionUser) => (
                <li
                  key={reactionUser.id}
                  className="flex min-h-10 items-center gap-2.5 px-3 py-1.5"
                >
                  <ReactionUserAvatar user={reactionUser} />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
                    {reactionUser.name}
                  </span>
                  {reactionUser.isMe && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                      나
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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

function ReactionUserAvatar({ user }: { user: FeedReactionUser }) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm shadow-sm"
    >
      {user.emoji ?? user.name.slice(0, 1)}
    </span>
  );
}
