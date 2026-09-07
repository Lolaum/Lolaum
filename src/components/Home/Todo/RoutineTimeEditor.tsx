"use client";

import { useState, type FormEvent } from "react";
import RoutineTimeFields from "@/components/Routines/RoutineTimeFields";
import { updateRoutineTime } from "@/api/routine";
import type { ChallengeRegistration } from "@/types/supabase";

export default function RoutineTimeEditor({
  routine,
  onCancel,
  onSaved,
}: {
  routine: ChallengeRegistration;
  onCancel: () => void;
  onSaved: (routine: ChallengeRegistration) => void;
}) {
  const [startTime, setStartTime] = useState(routine.routine_start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(routine.routine_end_time?.slice(0, 5) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const result = await updateRoutineTime({
        registrationId: routine.id,
        routineStartTime: startTime,
        routineEndTime: endTime,
      });
      if (result.error || !result.data) {
        setError(result.error ?? "시간을 저장하지 못했습니다.");
        return;
      }
      onSaved(result.data);
    } catch {
      setError("시간을 저장하지 못했습니다. 연결을 확인하고 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      id={`routine-time-${routine.id}`}
      onSubmit={handleSubmit}
      aria-label="리추얼 시간 수정"
      aria-busy={saving}
      className="relative z-20 mt-3 border-t border-gray-200 pt-3"
    >
      <fieldset disabled={saving} className="m-0 w-full min-w-0 max-w-full border-0 p-0">
        <legend className="sr-only">시작 시간과 종료 시간</legend>
        <RoutineTimeFields
          startTime={startTime}
          endTime={endTime}
          onStartChange={(value) => { setStartTime(value); setError(""); }}
          onEndChange={(value) => { setEndTime(value); setError(""); }}
        />
        {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 disabled:opacity-50">
            취소
          </button>
          <button type="submit" disabled={!startTime || !endTime} className="min-h-11 flex-1 rounded-xl bg-[var(--gold-400)] text-sm font-semibold text-gray-900 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
