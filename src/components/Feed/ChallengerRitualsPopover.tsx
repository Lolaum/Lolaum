"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getChallengerRoutines } from "@/api/routine";
import { ROUTINE_TYPE_LABEL } from "@/types/supabase";
import type { RoutineTypeDB } from "@/types/supabase";

const ROUTINE_BADGE_COLOR: Record<RoutineTypeDB, string> = {
  morning: "bg-yellow-50 text-yellow-700",
  exercise: "bg-orange-50 text-orange-700",
  reading: "bg-indigo-50 text-indigo-700",
  english: "bg-sky-50 text-sky-700",
  second_language: "bg-emerald-50 text-emerald-700",
  recording: "bg-rose-50 text-rose-700",
  finance: "bg-green-50 text-green-700",
  english_book: "bg-purple-50 text-purple-700",
};

export default function ChallengerRitualsPopover({
  userId,
  userName,
  open,
  onClose,
}: {
  userId: string;
  userName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [routines, setRoutines] = useState<RoutineTypeDB[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    void Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      const res = await getChallengerRoutines(userId);
      if (cancelled) return;
      setRoutines(res.data ?? []);
      setError(res.error ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-400">신청한 리추얼</p>
            <h3 className="mt-0.5 text-base font-bold text-gray-900">
              {userName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <p className="py-4 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        ) : routines.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            신청한 리추얼이 없습니다.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {routines.map((routine) => (
              <span
                key={routine}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${ROUTINE_BADGE_COLOR[routine]}`}
              >
                {ROUTINE_TYPE_LABEL[routine]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
