"use server";

import { getCurrentChallengeId } from "@/lib/current-challenge";

/** 현재 월의 활성 챌린지 ID를 가져옵니다. 없으면 자동 생성합니다. */
export async function getOrCreateCurrentChallenge(): Promise<{
  challengeId: string | null;
  error?: string;
}> {
  return getCurrentChallengeId();
}
