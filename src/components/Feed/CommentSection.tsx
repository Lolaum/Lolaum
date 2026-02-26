"use client";

import React, { useState } from "react";
import { User, Send } from "lucide-react";
import { Comment } from "@/types/feed";

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
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

export default function CommentSection({
  comments,
  onAddComment,
}: CommentSectionProps) {
  const [inputText, setInputText] = useState("");

  const handleSubmit = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-800">
                    {comment.userName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatCommentDate(comment.date)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 댓글 입력 */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="댓글 달기..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
          />
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className="flex-shrink-0 text-[var(--gold-400)] disabled:text-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
