// 할 일 및 루틴 관련 타입 정의

export interface TodoListProps {
  selectedDate: Date;
  onTaskClick: (title: string, color: string) => void;
}

export interface RoutineListProps {
  selectedDate: Date;
  onTaskClick: (title: string, color: string) => void;
}
