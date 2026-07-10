"use server";

import {
  getCurrentChallengeId,
  getActivePeriod,
  getEffectiveStart,
} from "@/lib/current-challenge";
import { countWeekdaysInDateKeyRange } from "@/lib/korea-date";

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

/** 현재 챌린지에서 리추얼 달성률 계산에 사용하는 목표 평일 수를 가져옵니다. */
export async function getCurrentRoutineGoalDays(): Promise<{
  totalRoutineDays?: number;
  error?: string;
}> {
  const [{ period, error: periodError }, { resetAt, error: challengeError }] =
    await Promise.all([
      getActivePeriod(),
      getCurrentChallengeId({ allowEnded: true }),
    ]);

  if (!period) return { error: periodError ?? "활성 챌린지 기간이 없습니다." };

  const effectiveStart = getEffectiveStart(period.start_date, resetAt);
  return {
    totalRoutineDays: countWeekdaysInDateKeyRange(
      effectiveStart,
      period.end_date,
    ),
    error: challengeError,
  };
}
