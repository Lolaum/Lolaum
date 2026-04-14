"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
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

export interface ChallengerSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  emoji: string | null;
}

/**
 * 이번 달 챌린지에 참여 중인 모든 유저의 프로필 정보를 가져온다.
 * (challenges 테이블에 이번 year/month 챌린지가 있는 모든 user_id 기준)
 */
export async function getCurrentChallengers(): Promise<{
  data?: ChallengerSummary[];
  error?: string;
}> {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data, error } = await supabase
    .from("challenges")
    .select("user_id, profiles!inner(id, name, avatar_url, emoji)")
    .eq("year", year)
    .eq("month", month);

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
    }));

  return { data: challengers };
}
