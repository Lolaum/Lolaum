// 모닝 리추얼 관련 타입 정의

export interface MorningRecord {
  id: number;
  date: string;
  image?: string; // 인증 사진 1장
  condition: number; // 컨디션 퍼센트 (0-100)
  successAndReflection: string; // 오늘의 작은 성공 & 한 줄 회고
  gift: string; // 오늘 나에게 주는 선물
}

export interface MorningContainerProps {
  onBackToTimer?: () => void;
}

export interface MorningFormData {
  image: string;
  condition: number;
  successAndReflection: string;
  gift: string;
}

export interface AddNewMorningProps {
  onCancel: () => void;
  onSubmit?: (recordData: MorningFormData) => void;
}
