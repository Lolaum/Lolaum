"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { User, Send, Trash2, Pencil, X, Check } from "lucide-react";
import { getCurrentChallengers, type ChallengerSummary } from "@/api/user";
import { Comment } from "@/types/feed";

interface CommentSectionProps {
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, text: string) => void;
}

const formatCommentDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
};

type MentionMatch = {
  start: number;
  end: number;
  query: string;
};

const MAX_MENTION_SUGGESTIONS = 6;

function findMentionAtCursor(
  text: string,
  cursor: number,
): MentionMatch | null {
  const beforeCursor = text.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([\p{L}\p{N}_.-]*)$/u);
  if (!match) return null;

  const start = beforeCursor.lastIndexOf("@");
  return { start, end: cursor, query: match[1] };
}

function MentionText({ text }: { text: string }) {
  return text.split(/(@[\p{L}\p{N}_.-]+)/gu).map((part, index) =>
    part.startsWith("@") ? (
      <span key={`${part}-${index}`} className="font-semibold text-sky-600">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ),
  );
}

export default function CommentSection({
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
}: CommentSectionProps) {
  const [inputText, setInputText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionCandidates, setMentionCandidates] = useState<
    ChallengerSummary[] | null
  >(null);
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const mentionSuggestions = useMemo(() => {
    if (!mentionMatch || !mentionCandidates) return [];
    const query = mentionMatch.query.toLocaleLowerCase("ko");
    return mentionCandidates
      .filter((candidate) => candidate.id !== currentUserId)
      .filter(
        (candidate) =>
          candidate.username.toLocaleLowerCase("ko").includes(query) ||
          candidate.name.toLocaleLowerCase("ko").includes(query),
      )
      .slice(0, MAX_MENTION_SUGGESTIONS);
  }, [currentUserId, mentionCandidates, mentionMatch]);

  const loadMentionCandidates = async () => {
    if (mentionCandidates || mentionLoading) return;
    setMentionLoading(true);
    const { data } = await getCurrentChallengers();
    setMentionCandidates(data ?? []);
    setMentionLoading(false);
  };

  const updateMentionMatch = (text: string, cursor: number) => {
    const nextMatch = findMentionAtCursor(text, cursor);
    setMentionMatch(nextMatch);
    setActiveMentionIndex(0);
    if (nextMatch) void loadMentionCandidates();
  };

  const selectMention = (candidate: ChallengerSummary) => {
    if (!mentionMatch) return;
    const replacement = `@${candidate.username} `;
    const nextText =
      inputText.slice(0, mentionMatch.start) +
      replacement +
      inputText.slice(mentionMatch.end);
    const nextCursor = mentionMatch.start + replacement.length;

    setInputText(nextText);
    setMentionMatch(null);
    setActiveMentionIndex(0);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setInputText("");
    setMentionMatch(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionMatch && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveMentionIndex(
          (current) => (current + 1) % mentionSuggestions.length,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveMentionIndex(
          (current) =>
            (current - 1 + mentionSuggestions.length) %
            mentionSuggestions.length,
        );
        return;
      }
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        selectMention(mentionSuggestions[activeMentionIndex]);
        return;
      }
    }

    if (e.key === "Escape" && mentionMatch) {
      e.preventDefault();
      setMentionMatch(null);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.odOriginalId ?? String(comment.id));
    setEditText(comment.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const submitEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || !editingId) return;
    onUpdateComment(editingId, trimmed);
    setEditingId(null);
    setEditText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitEdit();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const mentionCommentAuthor = (comment: Comment) => {
    const handle = comment.userHandle ?? comment.userName.replace(/\s+/g, "");
    const mention = `@${handle}`;
    setInputText((current) => {
      if (current.split(/\s+/).includes(mention)) return current;
      const prefix = current.trimEnd();
      return prefix ? `${prefix} ${mention} ` : `${mention} `;
    });
    setMentionMatch(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        댓글 {comments.length > 0 ? `${comments.length}개` : ""}
      </h3>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">첫 번째 댓글을 남겨보세요.</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => {
            const commentKey = comment.odOriginalId ?? String(comment.id);
            const isEditing = editingId === commentKey;
            const isOwnComment =
              currentUserId != null &&
              String(comment.userId) === String(currentUserId);

            return (
              <div key={commentKey} className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    {isOwnComment ? (
                      <span className="text-xs font-semibold text-gray-800">
                        {comment.userName}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => mentionCommentAuthor(comment)}
                        title={`${comment.userName}님 언급하기`}
                        className="text-xs font-semibold text-gray-800 hover:text-sky-600 hover:underline"
                      >
                        {comment.userName}
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">
                        {formatCommentDate(comment.date)}
                      </span>
                      {comment.odOriginalId && isOwnComment && !isEditing && (
                        <>
                          <button
                            onClick={() => startEdit(comment)}
                            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              onDeleteComment(comment.odOriginalId!)
                            }
                            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                        className="flex-1 text-sm text-gray-700 bg-white rounded-lg px-2 py-1 outline-none border border-gray-200 focus:border-gray-400"
                      />
                      <button
                        onClick={submitEdit}
                        disabled={!editText.trim()}
                        className="p-1 text-green-500 hover:text-green-600 disabled:text-gray-300 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      <MentionText text={comment.text} />
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 댓글 입력 */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <div className="relative min-w-0 flex-1">
          {mentionMatch && (
            <div
              id="comment-mention-suggestions"
              role="listbox"
              aria-label="언급할 챌린저"
              className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-20 max-h-60 overflow-y-auto rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl"
            >
              {mentionLoading && mentionCandidates === null ? (
                <div
                  className="space-y-2 px-3 py-2"
                  aria-label="챌린저 불러오는 중"
                >
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="flex min-h-11 animate-pulse items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-100" />
                      <div className="h-3 w-24 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : mentionSuggestions.length === 0 ? (
                <p className="px-4 py-3 text-center text-xs text-gray-400">
                  일치하는 챌린저가 없습니다.
                </p>
              ) : (
                mentionSuggestions.map((candidate, index) => (
                  <button
                    key={candidate.id}
                    id={`mention-option-${candidate.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeMentionIndex}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => selectMention(candidate)}
                    className={`flex min-h-11 w-full items-center gap-3 px-3 py-1.5 text-left transition-colors ${
                      index === activeMentionIndex
                        ? "bg-sky-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <MentionCandidateAvatar candidate={candidate} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">
                        {candidate.name}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        @{candidate.username}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              value={inputText}
              onChange={(event) => {
                const nextText = event.target.value;
                const cursor = event.target.selectionStart ?? nextText.length;
                setInputText(nextText);
                updateMentionMatch(nextText, cursor);
              }}
              onClick={(event) =>
                updateMentionMatch(
                  inputText,
                  event.currentTarget.selectionStart ?? inputText.length,
                )
              }
              onFocus={(event) =>
                updateMentionMatch(
                  inputText,
                  event.currentTarget.selectionStart ?? inputText.length,
                )
              }
              onBlur={() => setMentionMatch(null)}
              onKeyDown={handleKeyDown}
              aria-autocomplete="list"
              aria-expanded={mentionMatch != null}
              aria-controls="comment-mention-suggestions"
              aria-activedescendant={
                mentionMatch && mentionSuggestions[activeMentionIndex]
                  ? `mention-option-${mentionSuggestions[activeMentionIndex].id}`
                  : undefined
              }
              placeholder="댓글 달기... (@로 언급)"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!inputText.trim()}
              className="flex-shrink-0 text-[var(--gold-400)] transition-colors disabled:text-gray-300"
              aria-label="댓글 등록"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MentionCandidateAvatar({
  candidate,
}: {
  candidate: ChallengerSummary;
}) {
  if (candidate.avatarUrl) {
    return (
      <Image
        src={candidate.avatarUrl}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm"
    >
      {candidate.emoji ?? candidate.name.slice(0, 1)}
    </span>
  );
}
