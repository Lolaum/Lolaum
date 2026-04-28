// 모닝 리추얼 관련 타입 정의

export type ConditionLevel = "상" | "중" | "하";

export interface MorningRecord {
  id: number;
  date: string;
  image?: string; // 인증 사진 1장
  sleepHours: number; // 수면 시간 (시간 단위)
  sleepImprovement?: string; // 수면 7시간 미만 시 원인과 개선 방법
  condition: ConditionLevel; // 컨디션 (상/중/하)
  success: string; // 오늘의 작은 성공 (오늘 한 일)
  reflection: string; // 한 줄 회고
}

export interface MorningContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
}

export interface MorningFormData {
  image: string;
  sleepHours: number;
  sleepImprovement?: string;
  condition: ConditionLevel;
  success: string;
  reflection: string;
}

export interface AddNewMorningProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: MorningFormData) => void | Promise<void>;
}
