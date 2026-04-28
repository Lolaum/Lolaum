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
 * 이번 달 챌린지에 참여 중인 모든 유저의 프로필 정보를 가져온다.
 * (challenges 테이블에 이번 year/month 챌린지가 있는 모든 user_id 기준)
 */
export async function getCurrentChallengers(): Promise<{
  data?: ChallengerSummary[];
  error?: string;
}> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

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
    .filter((r) => r.profiles && r.profiles.id !== currentUser?.id)
    .map((r) => ({
      id: r.profiles!.id,
      name: r.profiles!.name,
      avatarUrl: r.profiles!.avatar_url,
      emoji: r.profiles!.emoji,
    }));

  return { data: challengers };
}
