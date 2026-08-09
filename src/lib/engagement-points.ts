import {
  DAILY_POINT_LIMIT,
  LIKE_POINT,
  POINTS_LAUNCHED_AT,
} from "@/lib/points";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };

type Engagement = {
  user_id: string;
  feed_id: string;
  created_at: string;
};

function getKoreaDate(createdAt: string): string {
  const koreaOffsetMs = 9 * 60 * 60 * 1000;
  return new Date(Date.parse(createdAt) + koreaOffsetMs)
    .toISOString()
    .slice(0, 10);
}

export async function getEngagementPointsByUser(
  admin: SupabaseAnyClient,
  userIds: string[],
  periodId: string,
  periodStartDate: string,
): Promise<Map<string, number>> {
  const uniqueUserIds = [...new Set(userIds)];
  const pointsByUser = new Map(uniqueUserIds.map((userId) => [userId, 0]));
  if (uniqueUserIds.length === 0) return pointsByUser;

  const periodStartedAt = new Date(
    `${periodStartDate}T00:00:00+09:00`,
  ).toISOString();
  const pointsStartedAt =
    Date.parse(periodStartedAt) > Date.parse(POINTS_LAUNCHED_AT)
      ? periodStartedAt
      : POINTS_LAUNCHED_AT;

  const [reactionsRes, challengesRes] = await Promise.all([
    admin
      .from("feed_reactions")
      .select("user_id, feed_id, created_at")
      .in("user_id", uniqueUserIds)
      .gte("created_at", pointsStartedAt),
    admin
      .from("challenges")
      .select("id")
      .eq("period_id", periodId),
  ]);

  if (reactionsRes.error || challengesRes.error) return pointsByUser;

  const reactions = reactionsRes.data ?? [];
  const challengeIds = (challengesRes.data ?? []).map(
    (challenge: { id: string }) => challenge.id,
  );
  if (reactions.length === 0 || challengeIds.length === 0) return pointsByUser;

  const feedIds = [
    ...new Set(reactions.map((row: { feed_id: string }) => row.feed_id)),
  ];

  const { data: feeds, error: feedsError } = await admin
    .from("feeds")
    .select("id, user_id")
    .in("id", feedIds)
    .in("challenge_id", challengeIds);
  if (feedsError) return pointsByUser;

  const feedOwnerById = new Map(
    (feeds ?? []).map((feed: { id: string; user_id: string }) => [
      feed.id,
      feed.user_id,
    ]),
  );

  const dailyPointsByUser = new Map<string, Map<string, number>>();
  const addPoints = (engagement: Engagement, points: number) => {
    const feedOwnerId = feedOwnerById.get(engagement.feed_id);
    if (!feedOwnerId || feedOwnerId === engagement.user_id) return;

    const date = getKoreaDate(engagement.created_at);
    const dailyPoints =
      dailyPointsByUser.get(engagement.user_id) ?? new Map<string, number>();
    dailyPoints.set(date, (dailyPoints.get(date) ?? 0) + points);
    dailyPointsByUser.set(engagement.user_id, dailyPoints);
  };

  for (const reaction of reactions as Engagement[]) {
    addPoints(reaction, LIKE_POINT);
  }

  for (const [userId, dailyPoints] of dailyPointsByUser) {
    pointsByUser.set(
      userId,
      [...dailyPoints.values()].reduce(
        (total, points) => total + Math.min(points, DAILY_POINT_LIMIT),
        0,
      ),
    );
  }

  return pointsByUser;
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
