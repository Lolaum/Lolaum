import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_USER_IDS } from "@/lib/notifications/constants";
import type { RoutineTypeDB } from "@/types/supabase";

/**
 * 알림 INSERT는 service_role(admin) client로만 수행한다.
 * RLS 정책에 INSERT 폴리시를 두지 않아 일반 유저는 못 만들고,
 * 댓글/리추얼 생성 같은 서버 액션에서만 트리거된다.
 */

/** 댓글 알림: 본인 게시글에 다른 유저가 댓글을 단 경우 */
export async function insertCommentNotification(input: {
  recipientUserId: string;
  actorUserId: string;
  routineType: RoutineTypeDB;
  feedId: string;
  ritualRecordId: string | null;
  commentId: string;
}): Promise<void> {
  // 본인이 본인 글에 댓글을 단 경우는 알림 생략
  if (input.recipientUserId === input.actorUserId) return;

  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    recipient_user_id: input.recipientUserId,
    actor_user_id: input.actorUserId,
    type: "comment",
    routine_type: input.routineType,
    feed_id: input.feedId,
    ritual_record_id: input.ritualRecordId,
    comment_id: input.commentId,
  });

  if (error) {
    console.error("insertCommentNotification error:", error);
  }
}

/** 리추얼 인증 완료 알림: 관리자(롤라/지로) 전원에게 발송 */
export async function insertRitualCompletionNotifications(input: {
  actorUserId: string;
  routineType: RoutineTypeDB;
  ritualRecordId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const rows = ADMIN_USER_IDS.map((adminId) => ({
    recipient_user_id: adminId,
    actor_user_id: input.actorUserId,
    type: "ritual_completion" as const,
    routine_type: input.routineType,
    ritual_record_id: input.ritualRecordId,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    console.error("insertRitualCompletionNotifications error:", error);
  }
}
