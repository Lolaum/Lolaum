"use server";

import { createClient } from "@/lib/supabase/server";

/** 현재 월의 활성 챌린지 ID를 가져옵니다. 없으면 자동 생성합니다. */
export async function getOrCreateCurrentChallenge(): Promise<{
  challengeId: string | null;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { challengeId: null, error: "인증이 필요합니다." };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 현재 월의 챌린지 찾기
  const { data: existing } = await supabase
    .from("challenges")
    .select("id")
    .eq("year", year)
    .eq("month", month)
    .limit(1)
    .single();

  if (existing) {
    return { challengeId: existing.id };
  }

  // 없으면 유저의 팀을 찾아서 챌린지 생성
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const teamId = teamMember?.team_id;
  if (!teamId) {
    return { challengeId: null, error: "소속된 팀이 없습니다." };
  }

  // 이달 1일 ~ 말일
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: created, error } = await supabase
    .from("challenges")
    .insert({
      team_id: teamId,
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
}
