import type { CleanupArea, CleanupMetricType } from "@/types/supabase";

export const CLEANUP_AREA_OPTIONS: {
  value: CleanupArea;
  label: string;
}[] = [
  { value: "photo_album", label: "📷 사진첩" },
  { value: "laptop_folder", label: "💻 노트북 폴더" },
  { value: "drive", label: "☁️ 드라이브" },
  { value: "email", label: "📧 이메일" },
  { value: "memo", label: "📝 메모" },
  { value: "desktop", label: "🖥 바탕화면" },
  { value: "documents", label: "📁 서류" },
  { value: "desk", label: "🪑 책상" },
  { value: "room", label: "🛏 방" },
  { value: "closet", label: "👕 옷장" },
  { value: "drawer", label: "🚪 서랍" },
  { value: "bathroom", label: "🧴 욕실" },
  { value: "kitchen", label: "🍳 주방" },
  { value: "fridge", label: "❄️ 냉장고" },
  { value: "bag", label: "👜 가방" },
  { value: "shoe_cabinet", label: "👟 신발장" },
  { value: "other", label: "📦 기타(직접 입력)" },
];

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
  return CLEANUP_AREA_OPTIONS.find((option) => option.value === area)?.label ?? "정돈";
}

export function getCleanupMetricMeta(type: CleanupMetricType) {
  return CLEANUP_METRIC_OPTIONS.find((option) => option.value === type);
}
