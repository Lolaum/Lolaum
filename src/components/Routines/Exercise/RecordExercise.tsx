"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, Utensils, Pencil, Trash2 } from "lucide-react";
import { ExerciseRecord } from "@/types/routines/exercise";
import { deleteRitualRecord } from "@/api/ritual-record";

interface GroupedRecord {
  date: string;
  exercises: ExerciseRecord[];
  totalDuration: number; // 운동만 합산
}

interface RecordExerciseProps {
  exerciseRecords: ExerciseRecord[];
  onChanged?: () => void;
}

export default function RecordExercise({
  exerciseRecords,
  onChanged,
}: RecordExerciseProps) {
  const router = useRouter();
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    const { error } = await deleteRitualRecord(deleteTargetId);
    setDeleting(false);
    setDeleteTargetId(null);
    if (error) {
      alert(`삭제 실패: ${error}`);
      return;
    }
    onChanged?.();
  };

  const groupedRecords = useMemo(() => {
    const grouped = exerciseRecords.reduce(
      (acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            exercises: [],
            totalDuration: 0,
          };
        }

        acc[record.date].exercises.push(record);
        if (record.recordType === "exercise") {
          acc[record.date].totalDuration += record.duration;
        }

        return acc;
      },
      {} as Record<string, GroupedRecord>,
    );

    return Object.values(grouped);
  }, [exerciseRecords]);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  return (
    <>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">운동/식단 기록</h2>
      </div>

      <div className="space-y-2">
        {groupedRecords.map((group) => {
          const isExpanded = expandedDates.includes(group.date);

          return (
            <div
              key={group.date}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleExpand(group.date)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {group.date}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {group.exercises.map((e) => e.exerciseName).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {group.totalDuration > 0 && (
                    <span className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                      <Clock className="w-4 h-4" />
                      {group.totalDuration}분
                    </span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="space-y-3">
                    {group.exercises.map((exercise, index) => (
                      <div key={index}>
                        <div className="bg-gray-50 rounded-xl p-3 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                  exercise.recordType === "diet"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                {exercise.recordType === "diet" ? "식단" : "운동"}
                              </span>
                              <span className="font-semibold text-gray-900">
                                {exercise.exerciseName}
                              </span>
                            </div>
                            {exercise.recordType === "exercise" && exercise.duration > 0 && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {exercise.duration}분
                              </div>
                            )}
                            {exercise.recordType === "diet" && exercise.macros && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Utensils className="w-4 h-4" />
                                탄:단:지 {exercise.macros}
                              </div>
                            )}
                          </div>
                          {/* 수정/삭제 버튼 */}
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200/70">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/feeds/${String(exercise.id)}`)
                              }
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTargetId(String(exercise.id))
                              }
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              삭제
                            </button>
                          </div>
                        </div>

                        {exercise.images && exercise.images.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              인증 사진
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {exercise.images.map((image, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={image}
                                  alt={`인증 ${imgIndex + 1}`}
                                  className="w-full h-32 object-cover rounded-xl"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {exercise.achievement && (
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              오늘의 작은 성취
                            </h4>
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                              {exercise.achievement}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => !deleting && setDeleteTargetId(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">
              기록을 삭제하시겠습니까?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              인증 게시글과 댓글도 함께 사라집니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#ef4444" }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
