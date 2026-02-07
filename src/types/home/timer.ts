// 타이머 관련 타입 정의

export interface TimerProps {
  taskTitle: string;
  color: string; // hex 값 (예: "#60A5FA")
  onClose: () => void;
  onNext?: () => void;
}
