import {
  COMMENT_POINT,
  DAILY_POINT_LIMIT,
  LIKE_POINT,
  POINTS_LAUNCHED_AT,
} from "@/lib/points";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };

type Engagement = {
  id: string;
  user_id: string;
  feed_id: string;
  created_at: string;
};

type EngagementWithPoints = Engagement & {
  type: "like" | "comment";
  basePoints: number;
};

type FeedInfo = {
  id: string;
  user_id: string;
  ritual_record_id: string | null;
};

export interface EngagementPointHistoryEntry {
  id: string;
  type: "like" | "comment";
  createdAt: string;
  date: string;
  feedId: string;
  ritualRecordId: string | null;
  targetUserId: string;
  targetName: string;
  basePoints: number;
  awardedPoints: number;
}

export interface EngagementPointSummary {
  points: number;
  history: EngagementPointHistoryEntry[];
}

function getKoreaDate(createdAt: string): string {
  const koreaOffsetMs = 9 * 60 * 60 * 1000;
  return new Date(Date.parse(createdAt) + koreaOffsetMs)
    .toISOString()
    .slice(0, 10);
}

export async function getEngagementPointSummariesByUser(
  admin: SupabaseAnyClient,
  userIds: string[],
  periodId: string,
  periodStartDate: string,
): Promise<Map<string, EngagementPointSummary>> {
  const uniqueUserIds = [...new Set(userIds)];
  const summariesByUser = new Map(
    uniqueUserIds.map((userId) => [
      userId,
      { points: 0, history: [] } as EngagementPointSummary,
    ]),
  );
  if (uniqueUserIds.length === 0) return summariesByUser;

  const periodStartedAt = new Date(
    `${periodStartDate}T00:00:00+09:00`,
  ).toISOString();
  const pointsStartedAt =
    Date.parse(periodStartedAt) > Date.parse(POINTS_LAUNCHED_AT)
      ? periodStartedAt
      : POINTS_LAUNCHED_AT;

  const [reactionsRes, commentsRes, challengesRes] = await Promise.all([
    admin
      .from("feed_reactions")
      .select("id, user_id, feed_id, created_at")
      .in("user_id", uniqueUserIds)
      .gte("created_at", pointsStartedAt),
    admin
      .from("feed_comments")
      .select("id, user_id, feed_id, created_at")
      .in("user_id", uniqueUserIds)
      .gte("created_at", pointsStartedAt),
    admin.from("challenges").select("id").eq("period_id", periodId),
  ]);

  if (reactionsRes.error || commentsRes.error || challengesRes.error) {
    return summariesByUser;
  }

  const engagements: EngagementWithPoints[] = [
    ...(reactionsRes.data ?? []).map((reaction: Engagement) => ({
      ...reaction,
      type: "like" as const,
      basePoints: LIKE_POINT,
    })),
    ...(commentsRes.data ?? []).map((comment: Engagement) => ({
      ...comment,
      type: "comment" as const,
      basePoints: COMMENT_POINT,
    })),
  ].sort(
    (a, b) =>
      Date.parse(a.created_at) - Date.parse(b.created_at) ||
      a.id.localeCompare(b.id),
  );
  const challengeIds = (challengesRes.data ?? []).map(
    (challenge: { id: string }) => challenge.id,
  );
  if (engagements.length === 0 || challengeIds.length === 0) {
    return summariesByUser;
  }

  const feedIds = [
    ...new Set(engagements.map((engagement) => engagement.feed_id)),
  ];

  const { data: feeds, error: feedsError } = await admin
    .from("feeds")
    .select("id, user_id, ritual_record_id")
    .in("id", feedIds)
    .in("challenge_id", challengeIds);
  if (feedsError) return summariesByUser;

  const feedById = new Map(
    ((feeds ?? []) as FeedInfo[]).map((feed) => [feed.id, feed]),
  );
  const targetUserIds = [
    ...new Set(((feeds ?? []) as FeedInfo[]).map((feed) => feed.user_id)),
  ];
  const { data: targetProfiles } = targetUserIds.length
    ? await admin.from("profiles").select("id, name").in("id", targetUserIds)
    : { data: [] };

  const targetNameById = new Map<string, string>(
    (targetProfiles ?? []).map((profile: { id: string; name: string }) => [
      profile.id,
      profile.name,
    ]),
  );

  const dailyPointsByUser = new Map<string, Map<string, number>>();
  for (const engagement of engagements) {
    const feed = feedById.get(engagement.feed_id);
    if (!feed || feed.user_id === engagement.user_id) continue;

    const date = getKoreaDate(engagement.created_at);
    const dailyPoints =
      dailyPointsByUser.get(engagement.user_id) ?? new Map<string, number>();
    const usedPoints = dailyPoints.get(date) ?? 0;
    const awardedPoints = Math.max(
      0,
      Math.min(engagement.basePoints, DAILY_POINT_LIMIT - usedPoints),
    );
    dailyPoints.set(date, usedPoints + awardedPoints);
    dailyPointsByUser.set(engagement.user_id, dailyPoints);

    const summary = summariesByUser.get(engagement.user_id);
    if (!summary) continue;
    summary.points += awardedPoints;
    summary.history.push({
      id: `${engagement.type}:${engagement.id}`,
      type: engagement.type,
      createdAt: engagement.created_at,
      date,
      feedId: engagement.feed_id,
      ritualRecordId: feed.ritual_record_id,
      targetUserId: feed.user_id,
      targetName: targetNameById.get(feed.user_id) ?? "다른 챌린저",
      basePoints: engagement.basePoints,
      awardedPoints,
    });
  }

  for (const summary of summariesByUser.values()) {
    summary.history.reverse();
  }

  return summariesByUser;
}

export async function getEngagementPointsByUser(
  admin: SupabaseAnyClient,
  userIds: string[],
  periodId: string,
  periodStartDate: string,
): Promise<Map<string, number>> {
  const summaries = await getEngagementPointSummariesByUser(
    admin,
    userIds,
    periodId,
    periodStartDate,
  );
  return new Map(
    [...summaries].map(([userId, summary]) => [userId, summary.points]),
  );
}

export async function getEngagementPoints(
  admin: SupabaseAnyClient,
  userId: string,
  periodId: string,
  periodStartDate: string,
): Promise<number> {
  const pointsByUser = await getEngagementPointsByUser(
    admin,
    [userId],
    periodId,
    periodStartDate,
  );
  return pointsByUser.get(userId) ?? 0;
}
