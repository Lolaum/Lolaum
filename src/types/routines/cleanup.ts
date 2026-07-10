// 정돈 리추얼 관련 타입 정의

import type { CleanupArea, CleanupMetricType } from "@/types/supabase";

export interface CleanupMetric {
  type: CleanupMetricType;
  value: number;
}

export interface CleanupRecord {
  id: number;
  recordDate: string;
  area: CleanupArea;
  customArea?: string;
  certPhotos: string[];
  metric?: CleanupMetric;
  note: string;
}

export interface CleanupFormData {
  area: CleanupArea;
  customArea?: string;
  certPhotos: string[];
  metric?: CleanupMetric;
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

