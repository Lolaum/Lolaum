// 할 일 및 리추얼 관련 타입 정의

export interface TodoListProps {
  selectedDate: Date;
  onTaskClick: (title: string, color: string) => void;
}

export interface RoutineListProps {
  selectedDate: Date;
  onTaskClick: (title: string, color: string) => void;
  routineCompletionMap?: Record<string, number>; // routine_type → 완료 일수
  isPastDate?: boolean; // 지난 날짜 여부 (리추얼 진행 차단용)
  isOutsidePeriod?: boolean; // 챌린지 기간 외 여부 (리추얼 진행 차단용)
}
