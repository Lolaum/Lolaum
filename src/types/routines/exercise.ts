// 운동 관련 타입 정의

export interface ExerciseRecord {
  id: number;
  date: string;
  exerciseName: string;
  duration: number; // 분 단위
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
  images: string[];
  exerciseName: string;
  duration: number;
  achievement: string;
}

export interface AddNewExerciseProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: ExerciseFormData) => void;
  initialImages?: string[]; // 인증 사진 자동 주입
  initialDuration?: number; // 타이머 시간 자동 주입 (분)
}
