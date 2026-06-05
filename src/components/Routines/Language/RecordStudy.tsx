"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { LanguageRecord } from "@/types/routines/language";
import { deleteRitualRecord } from "@/api/ritual-record";

interface Expression {
  word: string;
  meaning: string;
  example: string;
}

interface GroupedRecord {
  date: string;
  achievement: string;
  expressions: Expression[];
  totalExpressions: number;
  recordIds: string[];
}

interface RecordStudyProps {
  languageRecords: LanguageRecord[];
  onChanged?: () => void;
}

export default function RecordStudy({
  languageRecords,
  onChanged,
}: RecordStudyProps) {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 날짜별로 그룹화
  const groupedRecords = useMemo(() => {
    const grouped = languageRecords.reduce(
      (acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            achievement: record.achievement,
            expressions: [],
            totalExpressions: 0,
            recordIds: [],
          };
        }

        acc[record.date].expressions.push(...record.expressions);
        acc[record.date].totalExpressions += record.expressionCount;
        acc[record.date].recordIds.push(String(record.id));

        return acc;
      },
      {} as Record<string, GroupedRecord>,
    );

    return Object.values(grouped);
  }, [languageRecords]);

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const handleDelete = async () => {
    if (!deleteTargetIds || deleteTargetIds.length === 0) return;
    setDeleting(true);
    let firstError: string | undefined;
    for (const id of deleteTargetIds) {
      const { error } = await deleteRitualRecord(id);
      if (error && !firstError) firstError = error;
    }
    setDeleting(false);
    setDeleteTargetIds(null);
    if (firstError) {
      alert(`삭제 실패: ${firstError}`);
      return;
    }
    onChanged?.();
  };

  return (
    <>
      {/* 학습 기록 섹션 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">학습 기록</h2>
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
                    {group.date}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {group.expressions.map((e) => e.word).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm text-blue-600 font-medium">
                    {group.totalExpressions}개 표현
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
                  {/* 오늘의 작은 성취 */}
                  {group.achievement && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        오늘의 작은 성취
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                        {group.achievement}
                      </p>
                    </div>
                  )}

                  {/* 그 날 입력한 표현 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      공부한 표현
                    </h4>
                    <div className="space-y-3">
                      {group.expressions.map((expr, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-3">
                          <div className="font-semibold text-gray-900 mb-1">
                            {expr.word}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {expr.meaning}
                          </div>
                          {expr.example && (
                            <div className="text-sm text-gray-500 pl-3 border-l-2 border-orange-200">
                              {expr.example}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                    <a
                      href={`/feeds/${group.recordIds[0]}`}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      수정
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetIds(group.recordIds)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetIds && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => !deleting && setDeleteTargetIds(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900">
              학습 기록을 삭제하시겠습니까?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {deleteTargetIds.length > 1
                ? `이 날의 학습 기록 ${deleteTargetIds.length}건이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
                : "이 작업은 되돌릴 수 없습니다."}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setDeleteTargetIds(null)}
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
