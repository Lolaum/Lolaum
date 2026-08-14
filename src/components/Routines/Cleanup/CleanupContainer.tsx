"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AddNewCleanup from "./AddNewCleanup";
import RecordCleanup from "./RecordCleanup";
import RitualDeclarationAccordion from "@/components/Routines/RitualDeclarationAccordion";
import {
  createRitualRecordAuto,
  getMyRitualRecords,
} from "@/api/ritual-record";
import { formatKoreaDateKey } from "@/lib/korea-date";
import type { CleanupRecordData, Json } from "@/types/supabase";
import type { CleanupFormData, CleanupRecord } from "@/types/routines/cleanup";
import {
  getCleanupAreaLabel,
  getCleanupMetricLabel,
  getCleanupMetricUnit,
  normalizeCleanupMetrics,
} from "./constants";

interface CleanupContainerProps {
  mode?: "main" | "new";
}

function formatMetricValue(value: number) {
  return value.toLocaleString();
}

export default function CleanupContainer({
  mode = "main",
}: CleanupContainerProps) {
  const router = useRouter();
  const [cleanupRecords, setCleanupRecords] = useState<CleanupRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const goHome = () => router.push("/home");
  const goMain = () => router.push("/home/cleanup");
  const goNew = () => router.push("/home/cleanup/new");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const { data } = await getMyRitualRecords({
      routineType: "cleanup",
      currentPeriodOnly: true,
    });
    if (data) {
      const records: CleanupRecord[] = data.map((r) => {
        const d = r.record_data as unknown as CleanupRecordData;
        return {
          id: r.id,
          recordDate: r.record_date,
          area: d.area,
          customArea: d.customArea,
          certPhotos: d.certPhotos ?? [],
          metric: d.metric,
          metrics: d.metrics,
          note: d.note ?? "",
        };
      });
      setCleanupRecords(records);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (mode === "main") return fetchRecords();
      return undefined;
    });
  }, [fetchRecords, mode]);

  const handleSubmit = async (formData: CleanupFormData) => {
    const today = formatKoreaDateKey();
    const recordData: CleanupRecordData = {
      area: formData.area,
      customArea: formData.customArea,
      certPhotos: formData.certPhotos,
      metric: formData.metric,
      metrics: formData.metrics,
      note: formData.note,
    };
    const { error } = await createRitualRecordAuto({
      routineType: "cleanup",
      recordDate: today,
      recordData: recordData as unknown as Json,
    });
    if (error) {
      alert(`기록 저장 실패: ${error}`);
      return;
    }
    goMain();
  };

  const areaCount = useMemo(() => {
    return new Set(
      cleanupRecords.map((record) =>
        getCleanupAreaLabel(record.area, record.customArea),
      ),
    ).size;
  }, [cleanupRecords]);

  const metricTotals = useMemo(() => {
    return Array.from(
      cleanupRecords
        .reduce((map, record) => {
          normalizeCleanupMetrics(record).forEach((metric) => {
            const label = getCleanupMetricLabel(
              metric,
              record.area,
              record.customArea,
            );
            const unit = getCleanupMetricUnit(metric);
            const key = `${label}__${unit}`;
            const previous = map.get(key);
            map.set(key, {
              label,
              unit,
              value: (previous?.value ?? 0) + metric.value,
            });
          });
          return map;
        }, new Map<string, { label: string; unit: string; value: number }>())
        .values(),
    ).sort((a, b) => b.value - a.value);
  }, [cleanupRecords]);

  if (mode === "new") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-4">
        <AddNewCleanup
          onCancel={goMain}
          onBackToHome={goHome}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={goHome}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-xs text-gray-400 font-medium mb-0.5">정돈 리추얼</p>
        <div className="flex items-baseline gap-1.5 mb-4">
          <h1 className="text-lg font-bold text-gray-900">
            지금까지 정돈한 기록
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-xs text-teal-600 font-semibold mb-1">
              정돈 기록
            </p>
            <p className="text-lg font-bold text-gray-900">
              {cleanupRecords.length.toLocaleString()}
              <span className="ml-0.5 text-sm font-medium text-gray-400">
                회
              </span>
            </p>
          </div>
          <div className="bg-teal-50 rounded-xl p-3">
            <p className="text-xs text-teal-600 font-semibold mb-1">
              정돈한 분야
            </p>
            <p className="text-lg font-bold text-gray-900">
              {areaCount.toLocaleString()}
              <span className="ml-0.5 text-sm font-medium text-gray-400">
                개
              </span>
            </p>
          </div>
          {metricTotals.map((metric) => (
            <div
              key={`${metric.label}-${metric.unit}`}
              className="bg-teal-50 rounded-xl p-3"
            >
              <p className="text-xs text-teal-600 font-semibold mb-1">
                {metric.label}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatMetricValue(metric.value)}
                <span className="ml-0.5 text-sm font-medium text-gray-400">
                  {metric.unit}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <RitualDeclarationAccordion routineType="cleanup" />

      <div className="mb-4">
        <button
          type="button"
          onClick={goNew}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          style={{ backgroundColor: "#14b8a6" }}
        >
          + 오늘 정돈 인증하기
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">기록을 불러오는 중...</p>
        </div>
      ) : (
        <RecordCleanup
          cleanupRecords={cleanupRecords}
          onChanged={fetchRecords}
        />
      )}
    </div>
  );
}
