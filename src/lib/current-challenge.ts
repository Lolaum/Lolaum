import { cache } from "react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getKoreanNow } from "@/lib/date";

/**
 * 현재 월의 챌린지 ID를 가져온다(없으면 자동 생성).
 * 요청당 한 번만 실행되도록 React `cache()`로 메모이제이션됨.
 *
 * server action(`getOrCreateCurrentChallenge`)이 동일 요청 내 여러 helper에서
 * 호출되어도 challenges 테이블 조회가 중복되지 않게 한다.
 */
export const getCurrentChallengeId = cache(async (): Promise<{
  challengeId: string | null;
  error?: string;
}> => {
  const user = await getCurrentUser();
  if (!user) return { challengeId: null, error: "인증이 필요합니다." };

  const supabase = await createClient();

  const now = getKoreanNow();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 현재 월의 내 챌린지 찾기
  const { data: existing } = await supabase
    .from("challenges")
    .select("id")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { challengeId: existing.id };
  }

  // 없으면 새 챌린지 생성
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: created, error } = await supabase
    .from("challenges")
    .insert({
      user_id: user.id,
      year,
      month,
      start_date: startDate,
      end_date: endDate,
      weekly_target: 5,
      total_weeks: 3,
    })
    .select("id")
    .single();

  if (error) {
    return { challengeId: null, error: error.message };
  }

  return { challengeId: created.id };
});
