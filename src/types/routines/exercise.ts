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
}
