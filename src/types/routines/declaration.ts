export type RoutineType =
  | "모닝리추얼"
  | "운동리추얼"
  | "독서리추얼"
  | "영어리추얼"
  | "제2외국어리추얼"
  | "기록리추얼"
  | "자산관리리추얼"
  | "원서읽기리추얼";

export interface DeclarationAnswer {
  questionId: string;
  answer: string;
}

export interface Declaration {
  id: string;
  userId: string;
  userName: string;
  userEmoji?: string;
  avatarUrl?: string;
  routineType: RoutineType;
  answers: DeclarationAnswer[];
  createdAt: string;
}
