// 타이머 관련 타입 정의

export interface TimerProps {
  taskTitle: string;
  color: string; // hex 값 (예: "#60A5FA")
  startPhoto?: string; // 시작 인증 사진 dataURL (있을 경우 썸네일 표시)
  onClose: () => void;
  onNext?: (elapsedSeconds: number) => void;
}
