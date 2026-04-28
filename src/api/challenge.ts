"use server";

import { getCurrentChallengeId, getActivePeriod } from "@/lib/current-challenge";

/** 현재 활성 기간의 챌린지 ID를 가져옵니다. 없으면 자동 생성합니다. */
export async function getOrCreateCurrentChallenge(): Promise<{
  challengeId: string | null;
  error?: string;
}> {
  return getCurrentChallengeId();
}

/** 현재 활성 챌린지 기간(start/end) 정보를 가져옵니다. */
export async function getCurrentPeriod(): Promise<{
  period: {
    id: string;
    start_date: string;
    end_date: string;
    label: string | null;
  } | null;
  error?: string;
}> {
  return getActivePeriod();
}
