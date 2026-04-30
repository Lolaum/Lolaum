"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Declaration } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import UserAvatar from "@/components/common/UserAvatar";
import ExampleTooltip from "@/components/common/ExampleTooltip";
import { updateDeclaration } from "@/api/declaration";

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

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(decl.answers.map((a) => [a.questionId, a.answer])),
  );
  const [saving, setSaving] = useState(false);

  if (!config || !questions) return null;

  const handleSave = async () => {
    setSaving(true);
    const answers = (questions ?? [])
      .map((q) => ({ questionId: q.id, answer: draft[q.id] ?? "" }))
      .filter((a) => a.answer.trim().length > 0);
    const { error } = await updateDeclaration(decl.id, answers);
    setSaving(false);
    if (error) {
      alert(`수정 실패: ${error}`);
      return;
    }
    setEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setDraft(Object.fromEntries(decl.answers.map((a) => [a.questionId, a.answer])));
    setEditing(false);
  };

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
        {isMine && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            수정
          </button>
        )}
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
            const answerText = draft[q.id] ?? "";
            const hasAnswer = decl.answers.some((a) => a.questionId === q.id);
            if (!editing && !hasAnswer) return null;
            const isReadOnly = q.id === "cert_method";
            return (
              <div key={q.id} className="rounded-xl p-4" style={{ backgroundColor: config.bgColor }}>
                <p
                  className="text-xs font-semibold mb-1.5"
                  style={{ color: config.color }}
                >
                  {(() => {
                    const lines = q.label.split("\n");
                    const tipIdx = q.exampleLineIndex ?? lines.length - 1;
                    return lines.map((line, i) => (
                      <span key={i} className="block">
                        {line}
                        {q.example && i === tipIdx && (
                          <span className="ml-1 align-middle">
                            <ExampleTooltip content={q.example} />
                          </span>
                        )}
                      </span>
                    ));
                  })()}
                </p>
                {editing && !isReadOnly ? (
                  <textarea
                    value={answerText}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {answerText}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* 편집 액션 */}
        {editing && (
          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-all"
              style={{ backgroundColor: config.color }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
