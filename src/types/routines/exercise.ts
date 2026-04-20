// 운동 관련 타입 정의

export type ExerciseRecordType = "exercise" | "diet";

export interface ExerciseRecord {
  id: number;
  date: string;
  recordType: ExerciseRecordType;
  exerciseName: string;
  duration: number; // 분 단위 (운동일 때만 사용)
  macros?: string; // 탄단지 비율 (식단일 때만 사용)
  images?: string[];
  achievement?: string;
}

export interface ExerciseContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
  certificationPhotos?: string[]; // [시작 인증 사진, 종료 인증 사진]
  elapsedSeconds?: number; // 타이머 경과 시간(초)
}

export interface ExerciseFormData {
  recordType: ExerciseRecordType;
  images: string[];
  exerciseName: string;
  duration: number;
  macros?: string;
  achievement: string;
}

export interface AddNewExerciseProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: ExerciseFormData) => void | Promise<void>;
  initialImages?: string[]; // 인증 사진 자동 주입
  initialDuration?: number; // 타이머 시간 자동 주입 (분)
}
