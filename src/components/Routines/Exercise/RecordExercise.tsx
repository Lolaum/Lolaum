"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { ExerciseRecord } from "@/types/routines/exercise";

interface GroupedRecord {
  date: string;
  exercises: {
    exerciseName: string;
    duration: number;
    images?: string[];
    achievement?: string;
  }[];
  totalDuration: number;
}

interface RecordExerciseProps {
  exerciseRecords: ExerciseRecord[];
}

export default function RecordExercise({
  exerciseRecords,
}: RecordExerciseProps) {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  // 날짜별로 그룹화
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

        acc[record.date].exercises.push({
          exerciseName: record.exerciseName,
          duration: record.duration,
          images: record.images,
          achievement: record.achievement,
        });
        acc[record.date].totalDuration += record.duration;

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
      {/* 운동 기록 섹션 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">운동 기록</h2>
      </div>

      {/* Collapsible 리스트 */}
      <div className="space-y-2">
        {groupedRecords.map((group) => {
          const isExpanded = expandedDates.includes(group.date);

          return (
            <div
              key={group.date}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
            >
              {/* 헤더 (클릭 가능) */}
              <button
                type="button"
                onClick={() => toggleExpand(group.date)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {group.date} {group.exercises[0].exerciseName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {group.exercises
                      .map((e) => `${e.exerciseName}`)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                    <Clock className="w-4 h-4" />
                    {group.totalDuration}분
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* 확장된 내용 */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  {/* 운동 상세 정보 */}
                  <div className="space-y-3">
                    {group.exercises.map((exercise, index) => (
                      <div key={index}>
                        <div className="bg-gray-50 rounded-xl p-3 mb-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900">
                              {exercise.exerciseName}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {exercise.duration}분
                            </div>
                          </div>
                        </div>

                        {/* 인증 사진 */}
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
                                  alt={`운동 인증 ${imgIndex + 1}`}
                                  className="w-full h-32 object-cover rounded-xl"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 오늘의 작은 성취 */}
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
    </>
  );
}
