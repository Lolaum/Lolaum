"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteRitualRecord } from "@/api/ritual-record";
import type { RecordCleanupProps } from "@/types/routines/cleanup";
import {
  getCleanupAreaLabel,
  getCleanupMetricLabel,
  getCleanupMetricUnit,
  normalizeCleanupMetrics,
} from "./constants";

interface RecordCleanupPropsWithCallback extends RecordCleanupProps {
  onChanged?: () => void;
}

function formatDateToDisplay(dateString: string) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function RecordCleanup({
  cleanupRecords,
  onChanged,
}: RecordCleanupPropsWithCallback) {
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

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

  return (
    <>
      <div className="mb-2">
        <h2 className="text-base font-semibold text-gray-900">정돈 기록</h2>
      </div>

      {cleanupRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-400">아직 정돈 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cleanupRecords.map((record) => {
            const isExpanded = expandedIds.includes(record.id);
            const metrics = normalizeCleanupMetrics(record);
            const firstMetric = metrics[0];
            const firstMetricLabel = firstMetric
              ? getCleanupMetricLabel(firstMetric, record.area, record.customArea)
              : null;
            const firstMetricUnit = firstMetric
              ? getCleanupMetricUnit(firstMetric)
              : null;

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(record.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      {formatDateToDisplay(record.recordDate)} ·{" "}
                      {getCleanupAreaLabel(record.area, record.customArea)}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {record.note}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {firstMetric && firstMetricLabel && firstMetricUnit && (
                      <span className="text-sm text-teal-600 font-semibold">
                        {firstMetric.value.toLocaleString()}
                        {firstMetricUnit}
                        {metrics.length > 1 && (
                          <span className="ml-1 text-xs text-teal-500">
                            +{metrics.length - 1}
                          </span>
                        )}
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
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
                    {metrics.length > 0 && (
                      <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
                        <p className="text-xs font-semibold text-teal-500 mb-3">
                          숫자 기록
                        </p>
                        <div className="space-y-2">
                          {metrics.map((metric, index) => {
                            const metricLabel = getCleanupMetricLabel(
                              metric,
                              record.area,
                              record.customArea,
                            );
                            const metricUnit = getCleanupMetricUnit(metric);
                            return (
                              <div
                                key={`${metricLabel}-${metricUnit}-${index}`}
                                className="flex items-baseline justify-between gap-3"
                              >
                                <span className="text-sm font-semibold text-teal-700">
                                  {metricLabel}
                                </span>
                                <span className="text-lg font-bold text-gray-900">
                                  {metric.value.toLocaleString()}
                                  <span className="ml-0.5 text-sm font-medium text-gray-500">
                                    {metricUnit}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        한 줄 비움 소감
                      </h4>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {record.note}
                        </p>
                      </div>
                    </div>

                    {record.certPhotos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          인증 사진
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {record.certPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`정돈 인증 사진 ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-xl border border-gray-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(String(record.id))}
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
      )}

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
              정돈 기록을 삭제하시겠습니까?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              이 작업은 되돌릴 수 없습니다.
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
