"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Clock3 } from "lucide-react";
import { Declaration } from "@/types/routines/declaration";
import { declarationQuestions } from "@/lib/declarationQuestions";
import { ROUTINE_CONFIG } from "@/lib/routineConfig";
import UserAvatar from "@/components/common/UserAvatar";
import ExampleTooltip from "@/components/common/ExampleTooltip";
import RoutineTimeFields from "@/components/Routines/RoutineTimeFields";
import { updateRoutineTime } from "@/api/routine";
import type { ChallengeRegistration } from "@/types/supabase";
import { deleteDeclaration, updateDeclaration } from "@/api/declaration";

interface DeclarationDetailProps {
  decl: Declaration;
  isMine: boolean;
  initialRoutine?: ChallengeRegistration | null;
  canEditRoutineTime?: boolean;
}

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

export default function DeclarationDetail({
  decl,
  isMine,
  initialRoutine,
  canEditRoutineTime = false,
}: DeclarationDetailProps) {
  const router = useRouter();
  const config = ROUTINE_CONFIG[decl.routineType];
  const questions = declarationQuestions[decl.routineType];

  const [routine, setRoutine] = useState(initialRoutine);
  const [startTime, setStartTime] = useState(initialRoutine?.routine_start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(initialRoutine?.routine_end_time?.slice(0, 5) ?? "");
  const [saveError, setSaveError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(decl.answers.map((a) => [a.questionId, a.answer])),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!config || !questions) return null;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    let timeSaved = false;
    try {
      if (isMine && canEditRoutineTime && routine && (
        startTime !== (routine.routine_start_time?.slice(0, 5) ?? "") ||
        endTime !== (routine.routine_end_time?.slice(0, 5) ?? "")
      )) {
        const result = await updateRoutineTime({
          registrationId: routine.id,
          routineStartTime: startTime,
          routineEndTime: endTime,
        });
        if (result.error || !result.data) {
          setSaveError(result.error ?? "시간을 저장하지 못했습니다.");
          return;
        }
        setRoutine(result.data);
        timeSaved = true;
      }
      const answers = questions
        .map((q) => ({ questionId: q.id, answer: draft[q.id] ?? "" }))
        .filter((a) => a.answer.trim().length > 0);
      const { error } = await updateDeclaration(decl.id, answers);
      if (error) {
        setSaveError(`${timeSaved ? "시간은 저장됐지만 선언 내용을 저장하지 못했습니다. " : ""}${error}`);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setSaveError(timeSaved
        ? "시간은 저장됐지만 선언 내용을 저장하지 못했습니다. 다시 저장해주세요."
        : "저장하지 못했습니다. 연결을 확인하고 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStartTime(routine?.routine_start_time?.slice(0, 5) ?? "");
    setEndTime(routine?.routine_end_time?.slice(0, 5) ?? "");
    setSaveError("");
    setDraft(
      Object.fromEntries(decl.answers.map((a) => [a.questionId, a.answer])),
    );
    setEditing(false);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("리추얼 선언을 삭제하시겠습니까?");
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await deleteDeclaration(decl.id);
    setDeleting(false);
    if (error) {
      alert(`삭제 실패: ${error}`);
      return;
    }
    router.push("/ritual");
    router.refresh();
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
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={deleting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "삭제 중" : "삭제"}
            </button>
          </div>
        )}
      </div>

      {/* 본문 카드 */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        {/* 유저 정보 */}
        <div className="flex items-center gap-3 mb-5">
          <UserAvatar
            avatarUrl={decl.avatarUrl}
            emoji={decl.userEmoji}
            size={48}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-gray-900">
                {decl.userName}
              </p>
              {isMine && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: "#eab32e" }}
                >
                  나
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {formatFullDate(decl.createdAt)}
            </p>
          </div>
        </div>

        {routine && (
          <section aria-label="리추얼 시간" className="mb-5 rounded-xl border border-gray-100 px-4 py-3">
            {editing && isMine && canEditRoutineTime ? (
              <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
                <legend className="sr-only">리추얼 시간</legend>
                <RoutineTimeFields
                  startTime={startTime}
                  endTime={endTime}
                  onStartChange={setStartTime}
                  onEndChange={setEndTime}
                />
              </fieldset>
            ) : (
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <div>
                <p className="text-xs font-semibold text-gray-500">리추얼 시간</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium tabular-nums text-gray-800">
                  <Clock3 size={14} aria-hidden="true" />
                  {routine.routine_start_time && routine.routine_end_time
                    ? `${routine.routine_start_time.slice(0, 5)} - ${routine.routine_end_time.slice(0, 5)}`
                    : "시간 미설정"}
                  {routine.routine_type === "morning" && <span className="text-xs text-gray-400">고정</span>}
                </p>
              </div>
            </div>
            )}
          </section>
        )}

        {/* 선언 내용 */}
        <div className="space-y-4">
          {questions.map((q) => {
            const answerText = decl.routineType === "모닝리추얼" && q.id === "cert_method"
              ? q.defaultValue ?? ""
              : draft[q.id] ?? "";
            const hasAnswer = decl.answers.some((a) => a.questionId === q.id);
            if (!editing && !hasAnswer) return null;
            const isReadOnly = q.id === "cert_method";
            return (
              <div
                key={q.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: config.bgColor }}
              >
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
                    disabled={saving}
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

        {saveError && <p role="alert" className="mt-4 text-sm text-red-600">{saveError}</p>}

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
