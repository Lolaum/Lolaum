"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import EditFeedRecord from "@/components/Feed/EditFeedRecord";
import { MorningRecord, ConditionLevel } from "@/types/routines/morning";
import { deleteRitualRecord } from "@/api/ritual-record";
import type { FeedItem, MorningFeedData } from "@/types/feed";

interface GroupedRecord {
  date: string;
  image?: string;
  sleepHours: number;
  sleepImprovement?: string;
  condition: ConditionLevel;
  success: string;
  reflection: string;
  records: MorningRecord[];
  recordIds: string[];
}

interface RecordMorningProps {
  morningRecords: MorningRecord[];
  onChanged?: () => void;
}

export default function RecordMorning({
  morningRecords,
  onChanged,
}: RecordMorningProps) {
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 날짜별로 그룹화
  const groupedRecords = useMemo(() => {
    const grouped = morningRecords.reduce(
      (acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            image: record.image,
            sleepHours: record.sleepHours,
            sleepImprovement: record.sleepImprovement,
            condition: record.condition,
            success: record.success,
            reflection: record.reflection,
            records: [],
            recordIds: [],
          };
        }
        acc[record.date].records.push(record);
        acc[record.date].recordIds.push(String(record.id));

        return acc;
      },
      {} as Record<string, GroupedRecord>,
    );

    return Object.values(grouped);
  }, [morningRecords]);

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

  const makeFeedItem = (record: MorningRecord): FeedItem => ({
    id: String(record.id),
    odOriginalId: String(record.id),
    userId: "",
    userName: "",
    date: record.date,
    routineCategory: "모닝",
    routineId: 0,
    recordId: 0,
    routineData: {
      image: record.image,
      sleepHours: record.sleepHours,
      sleepImprovement: record.sleepImprovement,
      condition: record.condition,
      success: record.success,
      reflection: record.reflection,
    } satisfies MorningFeedData,
  });

  return (
    <>
      {/* 모닝 기록 섹션 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">모닝 기록</h2>
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
                    {group.reflection || group.success}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-xs text-yellow-500 font-medium">
                    {group.sleepHours}h
                  </span>
                  <span className="text-sm text-yellow-500 font-medium">
                    {group.condition}
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
                  {/* 모닝 상세 정보 */}
                  <div className="space-y-3">
                    {editingRecordId === group.recordIds[0] && group.records[0] ? (
                      <EditFeedRecord
                        item={makeFeedItem(group.records[0])}
                        onCancel={() => {
                          setEditingRecordId(null);
                          onChanged?.();
                        }}
                      />
                    ) : (
                      <>
                    {/* 인증 사진 */}
                    {group.image && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          인증 사진
                        </h4>
                        <img
                          src={group.image}
                          alt="모닝 인증"
                          className="w-full h-48 object-cover rounded-xl"
                        />
                      </div>
                    )}

                    {/* 수면 시간 & 컨디션 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-yellow-50 rounded-xl p-3">
                        <p className="text-xs text-yellow-500 font-medium mb-1">
                          수면 시간
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                          {group.sleepHours}
                          <span className="text-sm font-medium text-gray-500">
                            h
                          </span>
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-xl p-3">
                        <p className="text-xs text-yellow-500 font-medium mb-1">
                          컨디션
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                          {group.condition}
                        </p>
                      </div>
                    </div>

                    {/* 수면 부족 원인 & 개선 방법 */}
                    {group.sleepImprovement && (
                      <div className="bg-orange-50 rounded-xl p-4">
                        <p className="text-xs text-orange-500 font-medium mb-1">
                          수면 부족 원인 & 개선 방법
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {group.sleepImprovement}
                        </p>
                      </div>
                    )}

                    {/* 오늘의 작은 성공 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">
                        오늘의 작은 성공 (오늘 한 일)
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {group.success}
                      </p>
                    </div>

                    {/* 한 줄 다짐 */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">
                        한 줄 다짐
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {group.reflection}
                      </p>
                    </div>

                    {/* 수정/삭제 버튼 */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRecordId((current) =>
                            current === group.recordIds[0] ? null : group.recordIds[0],
                          )
                        }
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {editingRecordId === group.recordIds[0] ? "수정 닫기" : "수정"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetIds(group.recordIds)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        삭제
                      </button>
                    </div>
                      </>
                    )}
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
              모닝 기록을 삭제하시겠습니까?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {deleteTargetIds.length > 1
                ? `이 날의 모닝 기록 ${deleteTargetIds.length}건이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`
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
