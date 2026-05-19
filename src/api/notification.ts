"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ROUTINE_TYPE_LABEL,
  type Notification,
  type RoutineTypeDB,
} from "@/types/supabase";
import {
  ADMIN_USER_IDS,
  type NotificationView,
} from "@/lib/notifications/constants";

function isAdminUserId(userId: string): boolean {
  return (ADMIN_USER_IDS as readonly string[]).includes(userId);
}

function buildMessage(input: {
  type: Notification["type"];
  actorName: string;
  routineType: RoutineTypeDB | null;
}): string {
  const routineLabel = input.routineType
    ? ROUTINE_TYPE_LABEL[input.routineType]
    : "";

  if (input.type === "comment") {
    return `${routineLabel} 인증글에 ${input.actorName}님이 댓글을 올렸습니다`;
  }
  return `${input.actorName}님이 ${routineLabel} 인증을 완료했습니다`;
}

/** 내 알림 목록 */
export async function getNotifications(): Promise<{
  data: NotificationView[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { data: [], error: "인증이 필요합니다." };

    const supabase = await createClient();
    const { data: rows, error } = await supabase
      .from("notifications")
      .select(
        "id, type, actor_user_id, routine_type, feed_id, ritual_record_id, is_read, created_at",
      )
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { data: [], error: error.message };
    if (!rows?.length) return { data: [] };

    const admin = createAdminClient();
    const actorIds = [
      ...new Set(rows.map((r) => r.actor_user_id).filter(Boolean) as string[]),
    ];
    const { data: profiles } = actorIds.length
      ? await admin.from("profiles").select("id, name").in("id", actorIds)
      : { data: [] as { id: string; name: string }[] };

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));

    return {
      data: rows.map((r) => {
        const actorName = r.actor_user_id
          ? (nameMap.get(r.actor_user_id) ?? "알 수 없음")
          : "알 수 없음";
        return {
          id: r.id,
          type: r.type,
          actorName,
          routineType: r.routine_type,
          routineLabel: r.routine_type
            ? ROUTINE_TYPE_LABEL[r.routine_type]
            : null,
          feedId: r.feed_id,
          ritualRecordId: r.ritual_record_id,
          isRead: r.is_read,
          createdAt: r.created_at,
          message: buildMessage({
            type: r.type,
            actorName,
            routineType: r.routine_type,
          }),
        };
      }),
    };
  } catch (e) {
    console.error("getNotifications error:", e);
    return { data: [], error: "알림 조회 중 오류가 발생했습니다." };
  }
}

/** 미읽음 알림 개수 */
export async function getUnreadNotificationCount(): Promise<{
  count: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { count: 0 };

    const supabase = await createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_user_id", user.id)
      .eq("is_read", false);

    if (error) return { count: 0, error: error.message };
    return { count: count ?? 0 };
  } catch (e) {
    console.error("getUnreadNotificationCount error:", e);
    return { count: 0, error: "알림 카운트 조회 중 오류가 발생했습니다." };
  }
}

/** 특정 알림 읽음 처리 */
export async function markNotificationRead(
  notificationId: string,
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("recipient_user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("markNotificationRead error:", e);
    return { error: "알림 읽음 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 현재 유저가 관리자(롤라/지로)인지 + 리추얼 알림 ON/OFF 상태 조회.
 * 일반 유저에게는 isAdmin=false로 응답 (토글 자체를 안 보여줌).
 */
export async function getAdminNotificationSetting(): Promise<{
  isAdmin: boolean;
  enabled: boolean;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { isAdmin: false, enabled: true };
    if (!isAdminUserId(user.id)) return { isAdmin: false, enabled: true };

    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("admin_ritual_notifications_enabled")
      .eq("id", user.id)
      .single();

    return {
      isAdmin: true,
      enabled: data?.admin_ritual_notifications_enabled ?? true,
    };
  } catch (e) {
    console.error("getAdminNotificationSetting error:", e);
    return { isAdmin: false, enabled: true };
  }
}

/** 관리자 본인의 리추얼 알림 수신 ON/OFF 설정 변경 */
export async function setAdminNotificationSetting(
  enabled: boolean,
): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };
    if (!isAdminUserId(user.id)) return { error: "권한이 없습니다." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ admin_ritual_notifications_enabled: enabled })
      .eq("id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("setAdminNotificationSetting error:", e);
    return { error: "설정 변경 중 오류가 발생했습니다." };
  }
}

/** 내 알림 전체 영구 삭제 ("모두 읽음" 버튼 동작) */
export async function deleteAllNotifications(): Promise<{ error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: "인증이 필요합니다." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (e) {
    console.error("deleteAllNotifications error:", e);
    return { error: "알림 삭제 중 오류가 발생했습니다." };
  }
}
