"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Declaration } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import UserAvatar from "@/components/common/UserAvatar";

interface DeclarationDetailProps {
  decl: Declaration;
  isMine: boolean;
}

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function DeclarationDetail({ decl, isMine }: DeclarationDetailProps) {
  const router = useRouter();
  const config = ROUTINE_CONFIG[decl.routineType];
  const questions = declarationQuestions[decl.routineType];

  if (!config || !questions) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6 mt-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon(16)}
          {decl.routineType}
        </span>
      </div>

      {/* 본문 카드 */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        {/* 유저 정보 */}
        <div className="flex items-center gap-3 mb-5">
          <UserAvatar avatarUrl={decl.avatarUrl} emoji={decl.userEmoji} size={48} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-gray-900">{decl.userName}</p>
              {isMine && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: "#eab32e" }}
                >
                  나
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{formatFullDate(decl.createdAt)}</p>
          </div>
        </div>

        {/* 선언 내용 */}
        <div className="space-y-4">
          {questions.map((q) => {
            const answer = decl.answers.find((a) => a.questionId === q.id);
            if (!answer) return null;
            return (
              <div key={q.id} className="rounded-xl p-4" style={{ backgroundColor: config.bgColor }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: config.color }}>
                  {q.label}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {answer.answer}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
