"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivePeriod } from "@/lib/current-challenge";
import type { Profile } from "@/types/supabase";

export async function getMe(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

/** 프로필 업데이트 (이름, 아바타) */
export async function updateMe(input: {
  name?: string;
  avatarUrl?: string | null;
}): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "인증이 필요합니다." };

  const supabase = await createClient();

  const patch: { name?: string; avatar_url?: string | null } = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

export interface ChallengerSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  emoji: string | null;
}

/**
 * 활성 챌린지 기간에 참여 중인 모든 유저의 프로필 정보를 가져온다.
 * 진행표(getProgressPageData)와 동일하게 period_id 기준 + admin 클라이언트로 조회해
 * RLS와 무관하게 동일한 챌린저 집합을 반환한다.
 */
export async function getCurrentChallengers(): Promise<{
  data?: ChallengerSummary[];
  error?: string;
}> {
  const currentUser = await getCurrentUser();

  const { period, error: periodError } = await getActivePeriod();
  if (!period) return { error: periodError ?? "활성 챌린지 기간이 없습니다." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenges")
    .select("user_id, profiles!inner(id, name, avatar_url, emoji)")
    .eq("period_id", period.id);

  if (error) return { error: error.message };

  type Row = {
    user_id: string;
    profiles: {
      id: string;
      name: string;
      avatar_url: string | null;
      emoji: string | null;
    } | null;
  };

  const rows = (data ?? []) as unknown as Row[];
  const challengers: ChallengerSummary[] = rows
    .filter((r) => r.profiles)
    .map((r) => ({
      id: r.profiles!.id,
      name: r.profiles!.name,
      avatarUrl: r.profiles!.avatar_url,
      emoji: r.profiles!.emoji,
    }))
    .sort((a, b) => {
      // 본인을 맨 앞으로
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return 0;
    });

  return { data: challengers };
}
