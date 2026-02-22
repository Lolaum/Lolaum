// 인증 피드 관련 타입 정의

export type RoutineCategory =
  | "운동"
  | "영어"
  | "독서"
  | "모닝"
  | "언어"
  | "자산관리";

export interface FeedItem {
  id: number;
  userId: number;
  userName: string;
  userProfileImage?: string;
  date: string; // ISO 형식 날짜
  routineCategory: RoutineCategory;
  routineId: number; // 루틴의 ID
  recordId: number; // 실제 기록의 ID
}

export interface FeedContainerProps {
  // 필요시 추가
}
