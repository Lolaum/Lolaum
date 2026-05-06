import { cache } from "react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * 현재 활성 challenge_periods row.
 * 어드민이 supabase에서 is_active=true row 하나로 관리.
 */
export const getActivePeriod = cache(async (): Promise<{
  period: {
    id: string;
    start_date: string;
    end_date: string;
    label: string | null;
  } | null;
  error?: string;
}> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenge_periods")
    .select("id, start_date, end_date, label")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) return { period: null, error: error.message };
  if (!data) return { period: null, error: "활성 챌린지 기간이 없습니다." };
  return { period: data };
});

/**
 * 현재 활성 기간의 챌린지 ID를 가져온다(없으면 자동 생성).
 * 활성 period의 start_date/end_date를 그대로 복사 — 어드민이 challenge_periods를
 * 갱신하면 신규 가입자에게도 동일 기간이 적용된다.
 *
 * resetAt: 유저가 명시적으로 "다시 시작" 한 날짜. NULL이면 period.start_date 기준.
 *
 * 요청당 한 번만 실행되도록 React `cache()`로 메모이제이션됨.
 */
export const getCurrentChallengeId = cache(async (): Promise<{
  challengeId: string | null;
  resetAt?: string | null;
  error?: string;
}> => {
  const user = await getCurrentUser();
  if (!user) return { challengeId: null, error: "인증이 필요합니다." };

  const { period, error: periodError } = await getActivePeriod();
  if (!period) return { challengeId: null, error: periodError };

  const supabase = await createClient();

  // 현재 활성 period의 내 챌린지 찾기
  const { data: existing } = await supabase
    .from("challenges")
    .select("id, reset_at")
    .eq("user_id", user.id)
    .eq("period_id", period.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { challengeId: existing.id, resetAt: existing.reset_at };
  }

  // 없으면 활성 period의 날짜를 복사해서 생성
  const startDate = new Date(period.start_date);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;

  const { data: created, error } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      period_id: period.id,
      year,
      month,
      start_date: period.start_date,
      end_date: period.end_date,
      weekly_target: 5,
      total_weeks: 3,
    })
    .select("id, reset_at")
    .single();

  if (error) {
    return { challengeId: null, error: error.message };
  }

  return { challengeId: created.id, resetAt: created.reset_at };
});

/**
 * 진행률 집계 시작일을 계산한다.
 * - reset_at 이 있으면 그 날짜부터 (유저가 명시적으로 "다시 시작" 한 경우)
 * - 없으면 period.start_date 부터 (늦게 등록해도 빠진 날 카운트)
 */
export function getEffectiveStart(
  periodStart: string,
  resetAt: string | null | undefined,
): string {
  if (!resetAt) return periodStart;
  return resetAt > periodStart ? resetAt : periodStart;
}
