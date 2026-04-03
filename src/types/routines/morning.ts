// 모닝 리추얼 관련 타입 정의

export type ConditionLevel = "상" | "중" | "하";

export interface MorningRecord {
  id: number;
  date: string;
  image?: string; // 인증 사진 1장
  sleepHours: number; // 수면 시간 (시간 단위)
  condition: ConditionLevel; // 컨디션 (상/중/하)
  successAndReflection: string; // 오늘의 작은 성공 & 한 줄 회고
  gift: string; // 오늘 나에게 주는 선물
}

export interface MorningContainerProps {
  onBackToTimer?: () => void;
  onBackToHome?: () => void;
}

export interface MorningFormData {
  image: string;
  sleepHours: number;
  condition: ConditionLevel;
  successAndReflection: string;
  gift: string;
}

export interface AddNewMorningProps {
  onCancel: () => void;
  onBackToHome?: () => void;
  onSubmit?: (recordData: MorningFormData) => void | Promise<void>;
}
