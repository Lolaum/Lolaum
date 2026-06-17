import type { RoutineTypeDB } from "@/types/supabase";

// 관리자(롤라/지로) user_id — 리추얼 인증 알림 수신자
export const ADMIN_USER_IDS = [
  "4b29ae22-8404-4f4c-add2-48e6bb29f8e1", // 롤라
  "8e7f3990-dbf9-4f49-87f3-9a9ceef4873f", // 지로
] as const;

export interface NotificationView {
  id: string;
  type: "comment" | "like" | "ritual_completion";
  actorName: string;
  routineType: RoutineTypeDB | null;
  routineLabel: string | null;
  feedId: string | null;
  ritualRecordId: string | null;
  isRead: boolean;
  createdAt: string;
  message: string;
}
