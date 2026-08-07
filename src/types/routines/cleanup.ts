// 정돈 리추얼 관련 타입 정의

import type { CleanupArea, CleanupMetricType } from "@/types/supabase";

export interface CleanupMetric {
  type?: CleanupMetricType;
  label?: string;
  value: number;
  unit?: string;
}

export interface CleanupRecord {
  id: string;
  recordDate: string;
  area: CleanupArea;
  customArea?: string;
  certPhotos: string[];
  metric?: CleanupMetric;
  metrics?: CleanupMetric[];
  note: string;
}

export interface CleanupFormData {
  area: CleanupArea;
  customArea?: string;
  certPhotos: string[];
  metric?: CleanupMetric;
  metrics?: CleanupMetric[];
  note: string;
}

export interface AddNewCleanupProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: CleanupFormData) => void | Promise<void>;
}

export interface RecordCleanupProps {
  cleanupRecords: CleanupRecord[];
}
