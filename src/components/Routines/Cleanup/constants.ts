import type { CleanupArea, CleanupMetricType } from "@/types/supabase";

export const CLEANUP_AREA_OPTIONS: {
  value: CleanupArea;
  label: string;
}[] = [
  { value: "photo_album", label: "📷 사진첩" },
  { value: "laptop_folder", label: "💻 노트북 폴더/바탕화면" },
  { value: "drive", label: "☁️ 드라이브/클라우드" },
  { value: "email", label: "📧 이메일" },
  { value: "memo", label: "📝 메모" },
  { value: "desk", label: "🪑 책상" },
  { value: "closet", label: "👕 옷장" },
  { value: "drawer", label: "🚪 서랍" },
  { value: "bathroom", label: "🧴 욕실" },
  { value: "kitchen", label: "🍳 주방" },
  { value: "fridge", label: "❄️ 냉장고" },
  { value: "bag", label: "👜 가방" },
  { value: "shoe_cabinet", label: "👟 신발장" },
  { value: "other", label: "📦 기타(직접 입력)" },
];

const LEGACY_CLEANUP_AREA_LABELS: Partial<Record<CleanupArea, string>> = {
  desktop: "🖥 바탕화면",
  documents: "📁 서류",
  room: "🛏 방",
};

export const CLEANUP_METRIC_OPTIONS: {
  value: CleanupMetricType;
  label: string;
  unit: string;
}[] = CLEANUP_AREA_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
  unit: "개",
}));

export function getCleanupAreaLabel(area: CleanupArea, customArea?: string) {
  if (area === "other" && customArea?.trim()) return `📦 ${customArea.trim()}`;
  return (
    CLEANUP_AREA_OPTIONS.find((option) => option.value === area)?.label ??
    LEGACY_CLEANUP_AREA_LABELS[area] ??
    "정돈"
  );
}

export function getCleanupMetricMeta(type: CleanupMetricType) {
  return CLEANUP_METRIC_OPTIONS.find((option) => option.value === type);
}

export function getCleanupMetricLabel(
  metric: { type?: CleanupMetricType; label?: string },
  area?: CleanupArea,
  customArea?: string,
) {
  if (metric.label?.trim()) return metric.label.trim();
  if (metric.type) {
    const metricMeta = getCleanupMetricMeta(metric.type);
    if (metric.type === area) return getCleanupAreaLabel(area, customArea);
    return metricMeta?.label ?? "비운 것";
  }
  return "비운 것";
}

export function getCleanupMetricUnit(metric: {
  type?: CleanupMetricType;
  unit?: string;
}) {
  if (metric.unit?.trim()) return metric.unit.trim();
  return metric.type ? (getCleanupMetricMeta(metric.type)?.unit ?? "개") : "개";
}

export function normalizeCleanupMetrics(data: {
  metric?: {
    type?: CleanupMetricType;
    label?: string;
    value: number;
    unit?: string;
  };
  metrics?: {
    type?: CleanupMetricType;
    label?: string;
    value: number;
    unit?: string;
  }[];
}) {
  const metrics = data.metrics?.filter((metric) => metric.value > 0) ?? [];
  if (metrics.length > 0) return metrics;
  return data.metric && data.metric.value > 0 ? [data.metric] : [];
}
